/**
 * HYXI AURA Beheer browser QA with injected, synthetic-only admin store.
 * No database, real credentials, or SMTP connection is used.
 */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createApp } from '../server/app.mjs';
import { loadConfig } from '../server/config.mjs';

const output = resolve(import.meta.dirname,'..','test-results','browser');
await mkdir(output,{recursive:true});
const requestId='AURA-1c000000-1111-4111-8111-222222222222';
const secondId='AURA-2c000000-1111-4111-8111-222222222222';
const token='a'.repeat(43);
let signedIn=false, leadStatus='new', statusChanges=0;
const now = new Date().toISOString();
const leadData = {
  id:'1c000000-1111-4111-8111-222222222222',
  requestId,status:leadStatus,requestType:'advice',source:'hyxi-aura.nl',
  createdAt:now,assignedTo:null,
  notification:{status:'accepted',attempts:1,errorCode:null},
  contact:{fullName:'Fictieve Browsercontrole',email:'testpersoon@example.test',phone:'0612345678',postcode:'1234AB'},
  profile:{solar:'yes',annualUsage:4200,goal:'solar',phase:'three',moduleType:9,moduleCount:2},
  attribution:{utm_source:'test'},
};
const fakeAdmin={
  async currentSession(cookie){return signedIn&&cookie===token ? {id:'1',role:'admin',email:'beheerder@example.test'} : null;},
  async login({email,password,code}){
    if(email!=='beheerder@example.test'||password!=='FictiefEnVeiligWachtwoord2026!'||code!=='123456')return null;
    signedIn=true;return {token,user:{id:'1',role:'admin',email}};
  },
  async logout(){signedIn=false;},
  async summary(){return {total:2,statuses:{new:leadStatus==='new'?1:0,contact_planned:0,in_progress:leadStatus==='in_progress'?1:0,quote_requested:1},notifications:{accepted:1,uncertain:1}};},
  async listLeads(){return {page:1,items:[
    {id:leadData.id,requestId,status:leadStatus,requestType:'advice',source:'hyxi-aura.nl',createdAt:now,assignedTo:null,deliveryStatus:'accepted'},
    {id:'2c000000-1111-4111-8111-222222222222',requestId:secondId,status:'quote_requested',requestType:'quote',source:'hyxi-aura.nl',createdAt:now,assignedTo:null,deliveryStatus:'uncertain'},
  ]};},
  async getLead(_user,id){assert.equal(id,requestId);return {...leadData,status:leadStatus};},
  async changeStatus(_user,id,status){assert.equal(id,requestId);leadStatus=status;statusChanges++;return {requestId:id,status,changed:true};},
};
const config=loadConfig({
  NODE_ENV:'test',SITE_URL:'https://hyxi-aura.nl',
  LEAD_ENABLED:'true',LEAD_STORAGE_MODE:'database',
  SMTP_HOST:'example.test',SMTP_USER:'sender@example.test',SMTP_PASS:'fake-test-password',
  SMTP_FROM:'sender@example.test',LEAD_TO:'leads@example.test',
  DB_HOST:'127.0.0.1',DB_NAME:'fake',DB_USER:'fake',DB_PASSWORD:'fake',
  LEAD_ENCRYPTION_KEY:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  LEAD_HASH_SECRET:'isolated-test-hmac-value-very-long-secret',
  ADMIN_ENABLED:'true',
  ADMIN_SESSION_SECRET:'test-only-admin-session-secret-with-more-than-32-bytes',
  ADMIN_MFA_KEY:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
});
assert.equal(config.adminEnabled,true);
const app=createApp({
  config,adminStore:fakeAdmin,transport:{sendMail:async()=>{throw new Error('Do not send mail');}},
  leadStore:{receive:async()=>{throw new Error('Do not store lead');}},
  distDir:resolve(import.meta.dirname,'..','dist'),
});
const server=app.listen(0,'127.0.0.1');
await once(server,'listening');
const base='http://127.0.0.1:'+server.address().port;
// The test runs on a temporary local origin; production remains restricted
// to SITE_URL and explicit configured origins.
config.allowedOrigins.add(base);
let browser;
async function accessibility(page,label){
  const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  assert.deepEqual(report.violations.map(x=>({id:x.id,targets:x.nodes.map(n=>n.target)})),[],label+' accessibility violations');
}
async function layout(page,label){
  const sizes=await page.evaluate(()=>({body:document.body.scrollWidth,doc:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(sizes.body<=sizes.width+1&&sizes.doc<=sizes.width+1,label+' horizontal overflow '+JSON.stringify(sizes));
}
async function loginAndReview(context,label){
  const page=await context.newPage();
  const exceptions=[];
  page.on('pageerror',error=>exceptions.push(error.message));
  await page.goto(base+'/beheer',{waitUntil:'load'});
  await expect(page.locator('#loginView')).toBeVisible();
  await accessibility(page,label+'/login');
  await layout(page,label+'/login');
  await page.screenshot({path:resolve(output,'beheer-'+label+'-login.png')});
  // Before authenticating there must be no access to private records.
  const before=await page.evaluate(async()=> (await fetch('/api/beheer/leads')).status);
  assert.equal(before,401);
  await page.locator('#email').fill('beheerder@example.test');
  await page.locator('#password').fill('FictiefEnVeiligWachtwoord2026!');
  await page.locator('#totp').fill('123456');
  await page.locator('#loginButton').click();
  await expect(page.locator('#dashboardView')).toBeVisible();
  await expect(page.locator('#statTotal')).toHaveText('2');
  await expect(page.locator('#statMail')).toHaveText('1');
  await page.evaluate(async()=>document.fonts.ready);
  await accessibility(page,label+'/dashboard');
  await layout(page,label+'/dashboard');
  await page.screenshot({path:resolve(output,'beheer-'+label+'-dashboard.png')});
  await page.locator('.open-lead').first().click();
  await expect(page.locator('#detailPane')).toBeVisible();
  await expect(page.locator('#detailTitle')).toHaveText(requestId);
  await expect(page.locator('#contactFields')).toContainText('Fictieve Browsercontrole');
  await accessibility(page,label+'/detail');
  await layout(page,label+'/detail');
  await page.screenshot({path:resolve(output,'beheer-'+label+'-detail.png')});
  if(label==='desktop'){
    await page.locator('#editStatus').selectOption('in_progress');
    await page.locator('#statusForm button[type=submit]').click();
    await expect(page.locator('#statusMessage')).toContainText('bijgewerkt');
    assert.equal(statusChanges,1);
  }
  const closeGeometry=await page.locator('#closeDetail').evaluate(button=>{
    const rect=button.getBoundingClientRect();
    const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
    const hit=document.elementFromPoint(x,y);
    const computed=getComputedStyle(button);
    return {
      bounds:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
      hit:hit?.outerHTML.slice(0,160)||'none',
      position:computed.position,zIndex:computed.zIndex,
      panelScroll:document.getElementById('detailPane').scrollTop,
      viewport:{w:innerWidth,h:innerHeight},
    };
  });
  console.log('BEHEER_CLOSE_GEOMETRY '+JSON.stringify(closeGeometry));
  await page.locator('#closeDetail').click({timeout:5000});
  await page.locator('#logoutButton').click();
  await expect(page.locator('#loginView')).toBeVisible();
  assert.equal(await page.evaluate(async()=> (await fetch('/api/beheer/leads')).status),401);
  assert.deepEqual(exceptions,[],label+' JavaScript exceptions');
  await context.close();
}
try{
  browser=await chromium.launch({headless:true});
  const desktop=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',locale:'nl-NL'});
  await loginAndReview(desktop,'desktop');
  const mobile=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',locale:'nl-NL',isMobile:true,hasTouch:true});
  await loginAndReview(mobile,'mobile');
  console.log('PASS desktop/mobile Beheer login, access controls, dashboard, lead detail, status update, logout, screenshots and WCAG A/AA');
} finally {
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
