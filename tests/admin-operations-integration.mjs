// Disposable MySQL integration: assignment, incident decisions and degraded startup.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';
import { createLeadPool } from '../server/db/pool.mjs';
import { createMysqlLeadStore } from '../server/db/store.mjs';
import { createAdminStore } from '../server/auth/store.mjs';
import { todayInAmsterdam } from '../server/auth/due-followups.mjs';
import { createApp } from '../server/app.mjs';
import { loadConfig } from '../server/config.mjs';
import { hashAdminPassword } from '../server/auth/security.mjs';
import { applyAccountMigration } from '../scripts/db-account-migrate.mjs';

if (process.env.CI !== 'true' || process.env.DB_NAME !== 'aura_ci' || process.env.NODE_ENV !== 'test') {
  throw new Error('Use only the disposable aura_ci test database.');
}
const env = { ...process.env, ADMIN_ENABLED: 'true', ADMIN_SESSION_SECRET: randomBytes(32).toString('hex') };
const config = loadConfig(env);
const pool = createLeadPool(config);
const store = createAdminStore({ pool, sessionSecret: config.adminSessionSecret, leadEncryptionKey: config.encryptionKey });
const leadStore = createMysqlLeadStore({ pool, encryptionKey: config.encryptionKey, hashSecret: config.hashSecret });
let server, child;

async function account(role) {
  const id = randomUUID(), email = id + '@example.test';
  const password = 'Fictional-Operations-Password-Only-2026!';
  await pool.execute(
    'INSERT INTO aura_admin_users (id,login_email,role,password_hash,mfa_secret_encrypted) VALUES (?,?,?,?,?)',
    [id, email, role, await hashAdminPassword(password), Buffer.alloc(0)],
  );
  return { id, email, role, password };
}
async function newLead() {
  const received = await leadStore.receive({ requestKey: randomUUID(), lead: {
    fullName: 'Fictional Operations Applicant', email: 'operations@example.test', phone: '0612345678', postcode: '1234AB',
    consent: true, website: '', profile: { solar: 'planned', annualUsage: 4000, goal: 'backup', phase: 'three', moduleType: 9, moduleCount: 2 },
    attribution: { utm_source: 'isolated-ci' },
  } });
  const [rows] = await pool.execute('SELECT l.id,l.request_id,o.id AS notification_id FROM aura_leads l JOIN aura_notification_outbox o ON o.lead_id=l.id WHERE l.request_id=?', [received.requestId]);
  return { ...rows[0], requestId: received.requestId };
}
async function outbox(id) {
  const [rows] = await pool.execute('SELECT * FROM aura_notification_outbox WHERE id=?', [id]);
  return rows[0];
}
async function login(base, actor) {
  const session = await fetch(base + '/api/beheer/session');
  const { csrfToken } = await session.json();
  const csrfCookie = session.headers.get('set-cookie').split(';')[0];
  const response = await fetch(base + '/api/beheer/login', {
    method: 'POST', headers: { Origin: config.siteUrl, 'Content-Type': 'application/json', 'X-Aura-CSRF': csrfToken, Cookie: csrfCookie },
    body: JSON.stringify({ email: actor.email, password: actor.password }),
  });
  assert.equal(response.status, 200);
  return { Origin: config.siteUrl, 'Content-Type': 'application/json', 'X-Aura-CSRF': csrfToken, Cookie: csrfCookie + '; ' + response.headers.get('set-cookie').split(';')[0] };
}

try {
  await applyAccountMigration(pool);
  const admin = await account('admin'), sales = await account('sales'), disabled = await account('sales');
  await pool.execute('UPDATE aura_admin_users SET disabled_at=UTC_TIMESTAMP(3) WHERE id=?', [disabled.id]);
  const lead = await newLead(), other = await newLead();
  assert.ok(!(await store.listLeads(sales)).items.some(row => row.requestId === lead.requestId));
  await assert.rejects(() => store.assignLead(sales, lead.requestId, sales.id), { code: 'FORBIDDEN' });
  await assert.rejects(() => store.assignLead(admin, lead.requestId, disabled.id), { code: 'BAD_ASSIGNEE' });
  assert.equal((await store.assignLead(admin, lead.requestId, sales.id)).changed, true);
  assert.equal((await store.assignLead(admin, lead.requestId, sales.id)).changed, false);
  assert.equal((await store.getLead(sales, lead.requestId)).contact.fullName, 'Fictional Operations Applicant');
  const followUpPayload={nextAction:'Afspraak bevestigen',dueDate:'2026-11-24',note:'Volgende week bellen'};
  assert.equal((await store.updateFollowup(sales,lead.requestId,followUpPayload)).changed,true);
  const updatedFollowup=await store.getLead(sales,lead.requestId);
  assert.equal(updatedFollowup.followUp.nextAction,'Afspraak bevestigen');
  assert.equal(updatedFollowup.followUp.dueDate,'2026-11-24');
  assert.equal(updatedFollowup.followUp.notes.length,1);
  assert.equal(updatedFollowup.followUp.notes[0].text,'Volgende week bellen');
  assert.equal((await store.updateFollowup(sales,lead.requestId,{nextAction:'Afspraak bevestigen',dueDate:'2026-11-24',note:''})).changed,false);
  await assert.rejects(() => store.updateFollowup(sales,other.requestId,followUpPayload),{code:'NOT_FOUND'});
  await assert.rejects(() => store.updateFollowup(sales,lead.requestId,{...followUpPayload,note:'x'.repeat(1001)}),{code:'BAD_FOLLOWUP'});
  const [following]=await pool.execute('SELECT encrypted_payload FROM aura_leads WHERE request_id=?',[lead.requestId]);
  assert.equal(following.length,1);
  assert.equal(Buffer.from(following[0].encrypted_payload).includes(Buffer.from('Volgende week bellen')),false,'Encrypted payload must not contain plaintext notes');
  const [followupAudit]=await pool.execute("SELECT COUNT(*) AS total FROM aura_admin_audit WHERE action='followup_update' AND lead_id=?",[lead.id]);
  assert.equal(Number(followupAudit[0].total),1);
  const dueToday=await store.listDueFollowups(admin,{now:new Date('2026-11-24T12:00:00Z')});
  assert.equal(dueToday.asOf,'2026-11-24');
  assert.ok(dueToday.items.some(item=>item.requestId===lead.requestId&&item.priority==='today'));
  const late=await store.listDueFollowups(sales,{now:new Date('2026-11-25T12:00:00Z')});
  assert.ok(late.items.some(item=>item.requestId===lead.requestId&&item.priority==='overdue'));
  assert.ok(!late.items.some(item=>item.requestId===other.requestId));
  const future=await store.listDueFollowups(sales,{now:new Date('2026-11-23T12:00:00Z')});
  assert.ok(!future.items.some(item=>item.requestId===lead.requestId));
  const [dueAudit]=await pool.execute("SELECT COUNT(*) AS total FROM aura_admin_audit WHERE actor_user_id=? AND action='followups_view' AND lead_id IS NULL",[sales.id]);
  assert.ok(Number(dueAudit[0].total)>=1);


  await assert.rejects(() => store.getLead(sales, other.requestId), { code: 'NOT_FOUND' });
  await store.assignLead(admin, lead.requestId, null);
  await assert.rejects(() => store.getLead(sales, lead.requestId), { code: 'NOT_FOUND' });
  const [assignmentEvents] = await pool.execute("SELECT COUNT(*) AS total FROM aura_lead_events WHERE lead_id=? AND event_type='assignment_changed'", [lead.id]);
  assert.equal(Number(assignmentEvents[0].total), 2);
  assert.ok(!(await store.listAssignees(admin)).items.some(row => row.id === disabled.id));
  await assert.rejects(() => store.listAssignees(sales), { code: 'FORBIDDEN' });

  await pool.execute("UPDATE aura_notification_outbox SET delivery_status='uncertain',attempt_count=3,last_error_code='WORKER_INTERRUPTED' WHERE id=?", [lead.notification_id]);
  await pool.execute("UPDATE aura_notification_outbox SET delivery_status='failed',attempt_count=4,last_error_code='EAUTH' WHERE id=?", [other.notification_id]);
  const incidents = await store.listNotifications(admin);
  assert.ok(incidents.items.some(row => row.id === lead.notification_id));
  assert.doesNotMatch(JSON.stringify(incidents), /Fictional Operations Applicant|operations@example/);
  await assert.rejects(() => store.listNotifications(sales), { code: 'FORBIDDEN' });
  await assert.rejects(() => store.resolveNotification(admin, lead.notification_id, { action: 'retry', expectedStatus: 'uncertain', expectedAttempt: 3 }), { code: 'BAD_NOTIFICATION_ACTION' });
  await assert.rejects(() => store.resolveNotification(sales, lead.notification_id, { action: 'retry', expectedStatus: 'uncertain', expectedAttempt: 3, confirmed: true }), { code: 'FORBIDDEN' });
  await assert.rejects(() => store.resolveNotification(admin, lead.notification_id, { action: 'retry', expectedStatus: 'uncertain', expectedAttempt: 1, confirmed: true }), { code: 'STATE_CHANGED' });
  const decision = { action: 'confirm_received', expectedStatus: 'uncertain', expectedAttempt: 3, confirmed: true };
  const concurrent = await Promise.allSettled([
    store.resolveNotification(admin, lead.notification_id, decision),
    store.resolveNotification(admin, lead.notification_id, decision),
  ]);
  assert.equal(concurrent.filter(row => row.status === 'fulfilled').length, 1);
  assert.equal(concurrent.find(row => row.status === 'rejected').reason.code, 'STATE_CHANGED');
  const confirmed = await outbox(lead.notification_id);
  assert.equal(confirmed.delivery_status, 'confirmed');
  assert.equal(confirmed.accepted_by_smtp_at, null, 'Inbox confirmation must not fabricate SMTP evidence');
  assert.equal(Number(confirmed.attempt_count), 3);
  const retry = await store.resolveNotification(admin, other.notification_id, { action: 'retry', expectedStatus: 'failed', expectedAttempt: 4, confirmed: true });
  assert.equal(retry.status, 'pending');
  assert.equal(Number((await outbox(other.notification_id)).attempt_count), 4, 'Manual retry cannot reset the lease sequence');
  await assert.rejects(() => store.resolveNotification(admin, other.notification_id, { action: 'retry', expectedStatus: 'failed', expectedAttempt: 4, confirmed: true }), { code: 'STATE_CHANGED' });
  const [events] = await pool.execute("SELECT COUNT(*) AS total FROM aura_lead_events WHERE lead_id=? AND event_type='notification_confirm_received'", [lead.id]);
  assert.equal(Number(events[0].total), 1);

  // GDPR-style admin operations: one explicit manual deletion, no live data or mail traffic.
  const privacyLead=await newLead();
  await assert.rejects(() => store.exportPrivacyDossier(sales,privacyLead.requestId),{code:'FORBIDDEN'});
  const exported=await store.exportPrivacyDossier(admin,privacyLead.requestId);
  assert.equal(exported.record.status,'new');
  assert.equal(exported.lead.fullName,'Fictional Operations Applicant');
  assert.equal(exported.requestId,privacyLead.requestId);
  assert.ok(exported.scope.includes('Odoo'));
  const confirmation={
    confirmedRequestId:privacyLead.requestId,reason:'retention_reviewed',
    legalReviewConfirmed:true,acknowledgedExternalCopies:true,
  };
  await assert.rejects(() => store.deletePrivacyDossier(sales,privacyLead.requestId,confirmation),{code:'FORBIDDEN'});
  await assert.rejects(() => store.deletePrivacyDossier(admin,privacyLead.requestId,{...confirmation,confirmedRequestId:'AURA-wrong'}),{code:'BAD_PRIVACY_ACTION'});
  await assert.rejects(() => store.deletePrivacyDossier(admin,privacyLead.requestId,confirmation),{code:'PRIVACY_STATUS'});
  await assert.rejects(() => store.deletePrivacyDossier(admin,privacyLead.requestId,{...confirmation,reason:'verified_privacy_request'}),{code:'PRIVACY_MAIL_PENDING'});
  await pool.execute("UPDATE aura_notification_outbox SET delivery_status='accepted' WHERE id=?",[privacyLead.notification_id]);
  await store.changeStatus(admin,privacyLead.requestId,'not_suitable');
  const deletedPrivacy=await store.deletePrivacyDossier(admin,privacyLead.requestId,confirmation);
  assert.equal(deletedPrivacy.deleted,true);
  assert.equal(deletedPrivacy.externalCopiesPending,true);
  await assert.rejects(() => store.getLead(admin,privacyLead.requestId),{code:'NOT_FOUND'});
  for(const table of ['aura_leads','aura_submission_keys','aura_lead_events','aura_notification_outbox']){
    const clause=table==='aura_leads'?'id=?':'lead_id=?';
    const [rows]=await pool.execute('SELECT COUNT(*) AS total FROM '+table+' WHERE '+clause,[privacyLead.id]);
    assert.equal(Number(rows[0].total),0,'Delete cascades in '+table);
  }
  const [linkedAudit]=await pool.execute('SELECT COUNT(*) AS total FROM aura_admin_audit WHERE lead_id=?',[privacyLead.id]);
  assert.equal(Number(linkedAudit[0].total),0,'No correlatable lead UUID remains in audit');
  const [deleteAudit]=await pool.execute("SELECT COUNT(*) AS total FROM aura_admin_audit WHERE actor_user_id=? AND action='privacy_delete' AND result_code='retention' AND lead_id IS NULL",[admin.id]);
  assert.ok(Number(deleteAudit[0].total)>=1);
  await assert.rejects(() => store.deletePrivacyDossier(admin,privacyLead.requestId,confirmation),{code:'NOT_FOUND'});

  // Route-level negative authorization is verified separately from store methods.
  server = createApp({ config, adminStore: store }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  assert.equal((await fetch(base + '/api/beheer/outbox')).status, 401);
  assert.equal((await fetch(base + '/api/beheer/followups')).status,401);
  const salesHeaders = await login(base, sales), adminHeaders = await login(base, admin);
  await store.updateFollowup(admin,lead.requestId,{nextAction:'Bel vandaag',dueDate:todayInAmsterdam(),note:''});
  const adminDueResponse=await fetch(base+'/api/beheer/followups',{headers:adminHeaders});
  assert.equal(adminDueResponse.status,200);
  assert.equal(adminDueResponse.headers.get('cache-control'),'no-store');
  const adminDue=await adminDueResponse.json();
  assert.ok(adminDue.items.some(item=>item.requestId===lead.requestId));
  const salesDue=await (await fetch(base+'/api/beheer/followups',{headers:salesHeaders})).json();
  assert.ok(!salesDue.items.some(item=>item.requestId===lead.requestId));

  assert.equal((await fetch(base + '/api/beheer/outbox', { headers: salesHeaders })).status, 403);
  assert.equal((await fetch(base + '/api/beheer/assignees', { headers: salesHeaders })).status, 403);
  const privacyUrl=base+'/api/beheer/leads/'+other.requestId;
  assert.equal((await fetch(privacyUrl+'/privacy-export',{method:'POST',headers:salesHeaders,body:'{}'})).status,403);
  assert.equal((await fetch(privacyUrl+'/privacy-export',{method:'POST',headers:{...adminHeaders,'X-Aura-CSRF':'invalid'},body:'{}'})).status,403);
  const privacyExportResponse=await fetch(privacyUrl+'/privacy-export',{method:'POST',headers:adminHeaders,body:'{}'});
  assert.equal(privacyExportResponse.status,200);
  assert.equal(privacyExportResponse.headers.get('cache-control'),'no-store');
  const privacyExportBody=await privacyExportResponse.json();
  assert.equal(privacyExportBody.dossier.requestId,other.requestId);
  assert.equal(privacyExportBody.dossier.lead.fullName,'Fictional Operations Applicant');
  const invalidDeleteResponse=await fetch(privacyUrl+'/privacy-delete',{
    method:'POST',headers:adminHeaders,
    body:JSON.stringify({reason:'retention_reviewed',confirmedRequestId:'wrong',legalReviewConfirmed:true,acknowledgedExternalCopies:true}),
  });
  assert.equal(invalidDeleteResponse.status,422);
  assert.equal((await fetch(privacyUrl+'/privacy-delete',{
    method:'POST',headers:adminHeaders,
    body:JSON.stringify({reason:'verified_privacy_request',confirmedRequestId:other.requestId,legalReviewConfirmed:true,acknowledgedExternalCopies:true}),
  })).status,409,'A pending notification is not silently erased');
  const routed=await newLead();
  await pool.execute("UPDATE aura_notification_outbox SET delivery_status='accepted' WHERE id=?",[routed.notification_id]);
  await store.changeStatus(admin,routed.requestId,'lost');
  const routedDeleteUrl=base+'/api/beheer/leads/'+routed.requestId+'/privacy-delete';
  const routedDelete=await fetch(routedDeleteUrl,{method:'POST',headers:adminHeaders,body:JSON.stringify({
    reason:'retention_reviewed',confirmedRequestId:routed.requestId,legalReviewConfirmed:true,acknowledgedExternalCopies:true,
  })});
  assert.equal(routedDelete.status,200);
  assert.equal((await routedDelete.json()).deleted,true);
  assert.equal((await fetch(base+'/api/beheer/leads/'+routed.requestId,{headers:adminHeaders})).status,404);

  const followupUrl=base+'/api/beheer/leads/'+lead.requestId+'/followup';
  assert.equal((await fetch(followupUrl,{method:'PATCH',headers:{...salesHeaders,'X-Aura-CSRF':'invalid'},body:JSON.stringify({nextAction:'',dueDate:null,note:''})})).status,403);
  assert.equal((await fetch(followupUrl,{method:'PATCH',headers:salesHeaders,body:JSON.stringify({nextAction:'',dueDate:null,note:''})})).status,404,'Unassigned sales must not mutate follow-up');
  assert.equal((await fetch(followupUrl,{method:'PATCH',headers:adminHeaders,body:JSON.stringify({nextAction:'Volgende contactpoging',dueDate:'2026-11-30',note:''})})).status,200);
  const afterFollowup=await (await fetch(base+'/api/beheer/leads/'+lead.requestId,{headers:adminHeaders})).json();
  assert.equal(afterFollowup.lead.followUp.nextAction,'Volgende contactpoging');

  const assignmentUrl = base + '/api/beheer/leads/' + lead.requestId + '/assignee';
  assert.equal((await fetch(assignmentUrl, { method: 'PATCH', headers: salesHeaders, body: JSON.stringify({ userId: sales.id }) })).status, 403);
  assert.equal((await fetch(assignmentUrl, { method: 'PATCH', headers: { ...adminHeaders, 'X-Aura-CSRF': 'invalid' }, body: JSON.stringify({ userId: sales.id }) })).status, 403);
  assert.equal((await fetch(assignmentUrl, { method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ userId: sales.id }) })).status, 200);
  assert.equal((await fetch(base + '/api/beheer/outbox/' + lead.notification_id + '/resolve', { method: 'POST', headers: adminHeaders, body: JSON.stringify(decision) })).status, 409);

  // Real server startup must keep the workbench accessible when SMTP is absent
  // and public lead intake is intentionally disabled. No transport is created.
  const probe = createServer().listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  child = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...env, PORT: String(port), LEAD_ENABLED: 'false', SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '', SMTP_FROM: '' },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) throw new Error('Isolated startup unexpectedly exited.');
    try {
      const health = await fetch('http://127.0.0.1:' + port + '/api/health', { signal: AbortSignal.timeout(300) });
      if (health.ok) {
        assert.equal((await health.json()).leadEnabled, false);
        ready = true; break;
      }
    } catch { /* Wait for Node to bind its test listener. */ }
    await sleep(100);
  }
  assert.equal(ready, true);
  assert.equal((await fetch('http://127.0.0.1:' + port + '/beheer')).status, 200);
  assert.equal((await fetch('http://127.0.0.1:' + port + '/api/beheer/leads')).status, 401);
  console.log('PASS assignment/RBAC, audited concurrent incident decisions, CSRF, and Beheer startup without SMTP/intake');
} finally {
  if (child && child.exitCode === null) { const exited = once(child, 'exit'); child.kill('SIGTERM'); await exited; }
  if (server) await new Promise(resolve => server.close(resolve));
  await pool.end();
}
