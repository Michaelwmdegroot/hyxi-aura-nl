/**
 * Isolated real-MySQL admin/API tests. Never touches Hostinger or sends mail.
 * Requires the disposable CI service: DB_NAME=aura_ci, NODE_ENV=test, CI=true.
 */
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../server/app.mjs';
import { loadConfig } from '../server/config.mjs';
import { applyInitialMigration } from '../scripts/db-migrate.mjs';
import { applyAdminMigration } from '../scripts/db-admin-migrate.mjs';
import { createLeadPool } from '../server/db/pool.mjs';
import { createMysqlLeadStore } from '../server/db/store.mjs';
import { createAdminStore, assertAdminSchema } from '../server/auth/store.mjs';
import { createFirstAdmin } from '../server/auth/bootstrap.mjs';
import { hashAdminPassword } from '../server/auth/security.mjs';

if (process.env.CI !== 'true' || process.env.DB_NAME !== 'aura_ci' || process.env.NODE_ENV !== 'test') {
  throw new Error('Run only in disposable GitHub Actions MySQL service.');
}
const now = Date.now();
let currentTime = now;
const secret = randomBytes(32).toString('hex');
const env = {...process.env,ADMIN_ENABLED:'true',ADMIN_SESSION_SECRET:secret};
const cfg = loadConfig(env);
assert.equal(cfg.adminEnabled,true,'Admin is gated on DB + secrets + explicit flag');
const pool = createLeadPool(cfg);
let servers=[];

function fictitiousLead(name) {
  return {
    fullName:name,email:'only-tests@example.test',phone:'0612345678',postcode:'1234AB',
    consent:true,website:'',profile:{
      solar:'planned',annualUsage:4200,goal:'backup',phase:'three',moduleType:9,moduleCount:2,
    },attribution:{utm_source:'isolated-ci'},
  };
}
async function initAccount(email,role) {
  const id = randomUUID();
  const password = 'Fictief&UniekBeheerWachtwoord2026!';
  await pool.execute(
    'INSERT INTO aura_admin_users (id,login_email,password_hash,role,mfa_secret_encrypted) VALUES (?,?,?,?,?)',
    [id,email,await hashAdminPassword(password),role,Buffer.alloc(0)],
  );
  return {id,email,password,role};
}
async function fixture(adminStore, config=cfg) {
  const app = createApp({
    config,
    adminStore,
    transport:{sendMail:async()=>({accepted:[]})},
    leadStore:{receive:async()=>{throw new Error('Offline test may not write customer traffic');}},
    distDir:new URL('../dist',import.meta.url).pathname,
  });
  const server = app.listen(0,'127.0.0.1');
  await once(server,'listening');
  servers.push(server);
  const base='http://127.0.0.1:'+server.address().port;
  return {
    base,
    request:(path,options={})=>fetch(base+path,{...options,redirect:'manual'}),
  };
}
async function csrfSession(f) {
  const response=await f.request('/api/beheer/session');
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.authenticated,false);
  return {token:data.csrfToken,cookie:response.headers.get('set-cookie').split(';')[0]};
}
async function tryLogin(f,auth,session,{password,email,extra={}}={}) {
  const r=await f.request('/api/beheer/login',{
    method:'POST',headers:{
      'Content-Type':'application/json',
      'Origin':cfg.siteUrl,
      'X-Aura-CSRF':session.token,
      'Cookie':session.cookie,...extra,
    },
    body:JSON.stringify({email:email||auth.email,password:password||auth.password}),
  });
  return r;
}
function cookies(...parts){return parts.map(v=>v.split(';')[0]).join('; ');}
async function secured(f,path,sessionCookie,options={}) {
  return f.request(path,{...options,headers:{'Cookie':sessionCookie,...options.headers}});
}

try {
  const migration1=await applyInitialMigration(pool);
  assert.equal(migration1.applied,false,'lead migration already verified by prior CI job');
  const migration2=await applyAdminMigration(pool);
  assert.equal(migration2.applied,true);
  assert.equal((await applyAdminMigration(pool)).applied,false);
  await assertAdminSchema(pool);
  const adminPassword='Fictief&UniekBeheerWachtwoord2026!';
  const adminResult=await createFirstAdmin({
    pool,email:'owner-admin@example.test',password:adminPassword,
  });
  const admin={id:adminResult.id,email:adminResult.email,password:adminPassword,role:'admin'};
  await assert.rejects(() => createFirstAdmin({
    pool,email:'second-owner@example.test',password:adminPassword,
  }));
  const sales=await initAccount('seller-test@example.test','sales');
  const leadStore=createMysqlLeadStore({pool,encryptionKey:cfg.encryptionKey,hashSecret:cfg.hashSecret});
  const assigned=await leadStore.receive({lead:fictitiousLead('Test Assigned'),requestKey:randomUUID()});
  const unassigned=await leadStore.receive({lead:fictitiousLead('Test Unassigned'),requestKey:randomUUID()});
  await pool.execute('UPDATE aura_leads SET assigned_user_id=? WHERE request_id=?',[sales.id,assigned.requestId]);
  const store=createAdminStore({
    pool,sessionSecret:secret,leadEncryptionKey:cfg.encryptionKey,
  });

  // Routes remain completely absent unless every required DB/security gate is ready.
  const off=await fixture(store,loadConfig({...env,ADMIN_ENABLED:'false'}));
  assert.equal((await off.request('/beheer')).status,404);
  assert.equal((await off.request('/api/beheer/session')).status,404);
  assert.equal((await off.request('/api/beheer/leads')).status,404);

  const f=await fixture(store);
  const page=await f.request('/beheer');
  assert.equal(page.status,200);
  assert.match(page.headers.get('x-robots-tag'),/noindex/);
  assert.equal(page.headers.get('cache-control'),'no-store');
  assert.match(await page.text(),/BEHEER/);
  assert.equal((await f.request('/beheer/beheer.css')).status,200);
  assert.equal((await f.request('/beheer/beheer.mjs')).status,200);
  assert.equal((await f.request('/api/beheer/leads')).status,401);
  assert.equal((await f.request('/api/beheer/summary')).status,401);
  assert.equal((await f.request('/api/beheer/leads/'+assigned.requestId)).status,401);
  assert.equal((await f.request('/server/auth/store.mjs')).status,404);

  const session=await csrfSession(f);
  const noOrigin=await tryLogin(f,admin,session,{extra:{Origin:''}});
  assert.equal(noOrigin.status,403,'login CSRF requires same-origin');
  const badCsrf=await tryLogin(f,admin,session,{extra:{'X-Aura-CSRF':'bad'}});
  assert.equal(badCsrf.status,403);
  assert.equal((await tryLogin(f,admin,session,{password:'wrong-password'})).status,401);
  assert.equal((await tryLogin(f,admin,session,{password:'invalid'})).status,401);
  const good=await tryLogin(f,admin,session);
  assert.equal(good.status,200);
  const setCookie=good.headers.get('set-cookie');
  assert.match(setCookie,/HttpOnly/);
  assert.match(setCookie,/SameSite=Strict/);
  const adminSession=cookies(session.cookie,setCookie);
  const leadList=await secured(f,'/api/beheer/leads',adminSession);
  assert.equal(leadList.status,200);
  const listData=await leadList.json();
  assert.equal(listData.items.some(x=>x.requestId===assigned.requestId),true);
  assert.equal(listData.items.some(x=>x.requestId===unassigned.requestId),true);
  assert.doesNotMatch(JSON.stringify(listData),/Test Assigned|only-tests@example/,'List has no PII');
  const details=await secured(f,'/api/beheer/leads/'+assigned.requestId,adminSession);
  assert.equal(details.status,200);
  assert.equal((await details.json()).lead.contact.fullName,'Test Assigned');
  const [audit] = await pool.execute(
    "SELECT COUNT(*) AS total FROM aura_admin_audit WHERE actor_user_id=? AND action='lead_view'",[admin.id],
  );
  assert.ok(Number(audit[0].total)>=1);

  const noCsrf=await secured(f,'/api/beheer/leads/'+assigned.requestId+'/status',adminSession,{
    method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'in_progress'}),
  });
  assert.equal(noCsrf.status,403);
  const status=await secured(f,'/api/beheer/leads/'+assigned.requestId+'/status',adminSession,{
    method:'PATCH',headers:{
      'Content-Type':'application/json',Origin:cfg.siteUrl,'X-Aura-CSRF':session.token,
    },body:JSON.stringify({status:'in_progress'}),
  });
  assert.equal(status.status,200);
  assert.equal((await status.json()).changed,true);
  const badStatus=await secured(f,'/api/beheer/leads/'+assigned.requestId+'/status',adminSession,{
    method:'PATCH',headers:{
      'Content-Type':'application/json',Origin:cfg.siteUrl,'X-Aura-CSRF':session.token,
    },body:JSON.stringify({status:'evil'}),
  });
  assert.equal(badStatus.status,422);
  const [events] = await pool.execute(
    "SELECT COUNT(*) AS total FROM aura_lead_events l JOIN aura_leads a ON a.id=l.lead_id WHERE a.request_id=? AND l.event_type='status_changed'",
    [assigned.requestId],
  );
  assert.equal(Number(events[0].total),1);

  await pool.execute('UPDATE aura_admin_sessions SET expires_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 SECOND) WHERE user_id=?',[admin.id]);
  assert.equal((await secured(f,'/api/beheer/leads',adminSession)).status,401,'An expired session cannot access lead records');

  const logout=await secured(f,'/api/beheer/logout',adminSession,{
    method:'POST',headers:{'Content-Type':'application/json',Origin:cfg.siteUrl,'X-Aura-CSRF':session.token},
    body:'{}',
  });
  assert.equal(logout.status,200);
  assert.equal((await secured(f,'/api/beheer/leads',adminSession)).status,401);

  // No authenticator code: another browser can login with the same password.
  const fresh=await csrfSession(f);
  const renewed=await tryLogin(f,admin,fresh);
  assert.equal(renewed.status,200);

  const second=await fixture(store);
  const salesCsrf=await csrfSession(second);
  const salesLogin=await tryLogin(second,sales,salesCsrf);
  assert.equal(salesLogin.status,200);
  const salesCookie=cookies(salesCsrf.cookie,salesLogin.headers.get('set-cookie'));
  const salesLeads=await (await secured(second,'/api/beheer/leads',salesCookie)).json();
  assert.equal(salesLeads.items.some(x=>x.requestId===assigned.requestId),true);
  assert.equal(salesLeads.items.some(x=>x.requestId===unassigned.requestId),false);
  assert.equal((await secured(second,'/api/beheer/leads/'+unassigned.requestId,salesCookie)).status,404);
  assert.equal((await secured(second,'/api/beheer/leads/'+assigned.requestId,salesCookie)).status,200);

  await pool.execute('UPDATE aura_admin_users SET disabled_at=UTC_TIMESTAMP(3) WHERE id=?',[sales.id]);
  assert.equal((await secured(second,'/api/beheer/leads',salesCookie)).status,401);

  const brute=await fixture(store);
  const bruteCsrf=await csrfSession(brute);
  const responses=[];
  const absentAccount={
    email:'unknown-test@example.test',
    password:'WrongNotRealTestPass1234!',
    totpSecret:newTotpSecret(),
  };
  for(let i=0;i<7;i++)responses.push((await tryLogin(brute,absentAccount,bruteCsrf)).status);
  assert.ok(responses.includes(429),'persistent account guard throttles after repeated attempts');
  console.log('PASS admin SQL migrations, password-only login, CSRF, RBAC, audit, status changes, session expiry and throttle');
} finally {
  await Promise.all(servers.map(server=>new Promise(resolve=>server.close(resolve))));
  await pool.end();
}
