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
const salesId='33333333-1111-4111-8111-222222222222';
const token='a'.repeat(43);
let signedIn=false, leadStatus='new', statusChanges=0;
let role='admin', assignedTo=null, assignmentChanges=0, notificationChanges=0, clockOffset=0;
let followupUpdates=0,followUp={nextAction:'',dueDate:null,notes:[]};
let privacyExports=0,privacyDeletes=0,privacyDeleted=false;
let forceNotificationConflict=false;
let deferredDetail=null, releaseDetail=null, deferredList=null, releaseList=null;
let waitingDetails=0,waitingLists=0;
const now = new Date().toISOString();
const makeNotification=()=>({id:'44444444-1111-4111-8111-222222222222',requestId:secondId,status:'uncertain',attempts:1,errorCode:'SMTP_ACK_UNKNOWN',updatedAt:now,nextAttemptAt:null,mailMessageId:'<synthetic-browser-message@hyxi-aura.nl>'});
let notification=makeNotification();
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
  async currentSession(cookie){return signedIn&&cookie===token ? {id:'1',role,email:'beheerder@example.test'} : null;},
  async login({email,password}){
    if(email!=='beheerder@example.test'||password!=='FictiefEnVeiligWachtwoord2026!')return null;
    signedIn=true;return {token,user:{id:'1',role,email}};
  },
  async logout(){signedIn=false;},
  async summary(){return {total:2,statuses:{new:leadStatus==='new'?1:0,contact_planned:0,in_progress:leadStatus==='in_progress'?1:0,quote_requested:1},notifications:{accepted:1,[notification.status]:1}};},
  async listLeads(){if(deferredList){waitingLists++;await deferredList;}return {page:1,items:[
    ...(!privacyDeleted?[{id:leadData.id,requestId,status:leadStatus,requestType:'advice',source:'hyxi-aura.nl',createdAt:now,assignedTo:null,deliveryStatus:'accepted'}]:[]),
    {id:'2c000000-1111-4111-8111-222222222222',requestId:secondId,status:'quote_requested',requestType:'quote',source:'hyxi-aura.nl',createdAt:now,assignedTo:null,deliveryStatus:notification.status},
  ]};},
  async leadMetrics(actor){
    const today=new Date();
    const start=Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate())-13*86400000;
    const days=Array.from({length:14},(_,i)=>{
      const day=new Date(start+i*86400000).toISOString().slice(0,10);
      const isLast=i===13;
      return {day,total:isLast?(actor.role==='admin'?2:1):0,advice:isLast?1:0,
        quote:isLast&&actor.role==='admin'?1:0,other:0};
    });
    return {period:{from:days[0].day,through:days.at(-1).day,days:14,timezone:'UTC'},
      scope:actor.role==='admin'?'all':'assigned',
      totals:actor.role==='admin'?{received:2,advice:1,quote:1,other:0}:{received:1,advice:1,quote:0,other:0},
      days};
  },
  async listDueFollowups(_user){
    const base={asOf:'2026-11-16',checked:2,limited:false};
    const first={requestId,dueDate:'2026-11-15',nextAction:'Test vervolgcontact',priority:'overdue',status:leadStatus,requestType:'advice',assignedTo:salesId};
    const second={requestId:secondId,dueDate:'2026-11-16',nextAction:'Offerte bespreken',priority:'today',status:'quote_requested',requestType:'quote',assignedTo:null};
    return role==='admin'?{...base,overdue:1,todayCount:1,items:[first,second]}:
      {...base,overdue:1,todayCount:0,items:[first]};
  },
  async getLead(_user,id){assert.equal(id,requestId);if(deferredDetail){waitingDetails++;await deferredDetail;}return {...leadData,status:leadStatus,assignedTo,followUp};},
  async updateFollowup(_user,id,input){assert.equal(id,requestId);followupUpdates++;followUp={nextAction:input.nextAction,dueDate:input.dueDate,notes:input.note?[...followUp.notes,{text:input.note,createdAt:now,authorId:'1'}]:followUp.notes};return {requestId:id,changed:true,followUp};},
  async changeStatus(_user,id,status){assert.equal(id,requestId);leadStatus=status;statusChanges++;return {requestId:id,status,changed:true};},
  async exportPrivacyDossier(actor,id){
    assert.equal(actor.role,'admin');assert.equal(id,requestId);privacyExports++;
    return {requestId:id,record:{status:leadStatus},lead:{fullName:'Fictieve Browsercontrole',followUp},scope:'Only HYXI'};
  },
  async deletePrivacyDossier(actor,id,body){
    assert.equal(actor.role,'admin');assert.equal(id,requestId);
    assert.equal(body.confirmedRequestId,requestId);
    assert.equal(body.legalReviewConfirmed,true);assert.equal(body.acknowledgedExternalCopies,true);
    assert.equal(body.reason,'verified_privacy_request');
    privacyDeletes++;privacyDeleted=true;
    return {requestId:id,deleted:true,externalCopiesPending:true};
  },
  async listAssignees(actor){assert.equal(actor.role,'admin');return {items:[{id:salesId,email:'sales@example.test',role:'sales'}]};},
  async assignLead(actor,id,userId){assert.equal(actor.role,'admin');assert.equal(id,requestId);assignedTo=userId;assignmentChanges++;return {requestId:id,assignedTo,changed:true};},
  async listNotifications(actor,{page}){
    assert.equal(actor.role,'admin');const items=['uncertain','failed'].includes(notification.status)?[notification]:[];
    return {items,total:items.length,page};
  },
  async resolveNotification(actor,id,{action,expectedStatus,expectedAttempt,confirmed}){
    assert.equal(actor.role,'admin');assert.equal(id,notification.id);assert.equal(confirmed,true);
    assert.ok(Number.isSafeInteger(expectedAttempt)&&expectedAttempt>0);
    if(forceNotificationConflict){notification.attempts++;forceNotificationConflict=false;}
    if(expectedStatus!==notification.status||expectedAttempt!==notification.attempts)throw Object.assign(new Error('Changed notification'),{code:'STATE_CHANGED'});
    assert.ok(['retry','confirm_received'].includes(action));notificationChanges++;
    notification.status=action==='retry'?'pending':'confirmed';return {id,status:notification.status,changed:true};
  },
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
});
assert.equal(config.adminEnabled,true);
const app=createApp({
  config,adminStore:fakeAdmin,transport:{sendMail:async()=>{throw new Error('Do not send mail');}},
  leadStore:{receive:async()=>{throw new Error('Do not store lead');}},
  distDir:resolve(import.meta.dirname,'..','dist'),
  now:()=>Date.now()+clockOffset,
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
  const expected=label.startsWith('mobile')?390:1440;
  assert.ok(sizes.width<=expected+1,label+' layout viewport incorrectly expanded: '+JSON.stringify(sizes));
}
async function loginAndReview(context,label){
  notification=makeNotification();clockOffset=0;
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
  await page.locator('#loginButton').click();
  await expect(page.locator('#dashboardView')).toBeVisible();
  await expect(page.locator('#statTotal')).toHaveText('2');
  await expect(page.locator('#statMail')).toHaveText('1');
  await page.evaluate(async()=>document.fonts.ready);
  await accessibility(page,label+'/dashboard');
  await layout(page,label+'/dashboard');
  await page.screenshot({path:resolve(output,'beheer-'+label+'-dashboard.png')});
  await expect(page.locator('#followupsTab')).toBeVisible();
  await page.locator('#followupsTab').click();
  await expect(page.locator('#followupsPanel')).toBeVisible();
  await expect(page.locator('.due-item')).toHaveCount(2);
  await expect(page.locator('#dueSummary')).toContainText('1 verlopen');
  await expect(page.locator('#dueSummary')).toContainText('1 voor vandaag');
  await expect(page.locator('#dueCount')).toHaveText('2');
  await accessibility(page,label+'/due-worklist');
  await layout(page,label+'/due-worklist');
  await page.locator('.due-open').first().click();
  await expect(page.locator('#detailTitle')).toHaveText(requestId);
  await page.locator('#closeDetail').click();
  await page.locator('#metricsTab').click();
  await expect(page.locator('#metricsPanel')).toBeVisible();
  await expect(page.locator('#kpiTotal')).toHaveText('2');
  await expect(page.locator('#kpiAdvice')).toHaveText('1');
  await expect(page.locator('#kpiQuote')).toHaveText('1');
  await expect(page.locator('#kpiDays [role=listitem]')).toHaveCount(14);
  await accessibility(page,label+'/real-lead-kpis');
  await layout(page,label+'/real-lead-kpis');
  await page.locator('#leadsTab').click();

  await page.locator('.open-lead').first().click();
  await expect(page.locator('#detailPane')).toBeVisible();
  await expect(page.locator('#detailTitle')).toHaveText(requestId);
  await expect(page.locator('#contactFields')).toContainText('Fictieve Browsercontrole');
  await accessibility(page,label+'/detail');
  await layout(page,label+'/detail');
  await page.screenshot({path:resolve(output,'beheer-'+label+'-detail.png')});
  await expect(page.locator('#privacySection')).toBeVisible();
  if(label==='desktop'){
    const downloadReady=page.waitForEvent('download');
    await page.locator('#privacyExportButton').click();
    const exportedFile=await downloadReady;
    assert.equal(exportedFile.suggestedFilename(),requestId+'-privacy.json');
    await expect(page.locator('#privacyExportMessage')).toContainText('Export aangemaakt');
    assert.equal(privacyExports,1);
  }
  if(label==='desktop'){
    await page.locator('#nextAction').fill('Klant terugbellen');
    await page.locator('#followupDate').fill('2026-11-24');
    await page.locator('#followupNote').fill('Vraag naar beschikbare installatieplek');
    await page.locator('#followupForm button[type=submit]').click();
    await expect(page.locator('#followupMessage')).toContainText('opgeslagen');
    await expect(page.locator('#followupNotes')).toContainText('Vraag naar beschikbare installatieplek');
    assert.equal(followupUpdates,1);
  }
  if(label==='desktop'){
    // Prove a normal authenticated session can mutate after the 15-minute
    // CSRF token expiry without asking the operator to reload or log in again.
    clockOffset=16*60*1000;
    await page.locator('#editStatus').selectOption('in_progress');
    await page.locator('#statusForm button[type=submit]').click();
    await expect(page.locator('#statusMessage')).toContainText('bijgewerkt');
    assert.equal(statusChanges,1);
    await page.locator('#assignee').selectOption(salesId);
    await page.locator('#assignmentForm button[type=submit]').click();
    await expect(page.locator('#assignmentMessage')).toContainText('bijgewerkt');
    assert.equal(assignedTo,salesId);assert.equal(assignmentChanges,1);
  }
  await page.locator('#closeDetail').click({timeout:5000});
  await expect(page.locator('#contactFields')).toBeEmpty();
  await page.locator('#outboxTab').click();
  await expect(page.locator('#outboxPanel')).toBeVisible();
  await expect(page.locator('.outbox-item')).toHaveCount(1);
  await accessibility(page,label+'/mailcontrole');await layout(page,label+'/mailcontrole');
  await page.screenshot({path:resolve(output,'beheer-'+label+'-mailcontrole.png')});
  await page.locator('.review-mail').click();
  await expect(page.locator('#mailDialog')).toBeVisible();
  await page.locator('#resolveAction').selectOption(label==='desktop'?'confirm_received':'retry');
  assert.equal(await page.locator('#resolveConfirmed').isChecked(),false);
  await page.locator('#resolveButton').click();
  assert.equal(notificationChanges,label==='desktop'?0:1,'No action before mailbox confirmation');
  await page.locator('#resolveConfirmed').check();
  await accessibility(page,label+'/mail-review');await layout(page,label+'/mail-review');
  await page.screenshot({path:resolve(output,'beheer-'+label+'-mail-review.png')});
  if(label==='desktop'){
    // The same uncertain status may belong to a later delivery attempt.
    // The stale first-attempt decision must require a fresh review.
    forceNotificationConflict=true;
    await page.locator('#resolveButton').click();
    await expect(page.locator('#mailReviewMessage')).toContainText('inmiddels gewijzigd');
    await expect(page.locator('#resolveButton')).toBeDisabled();
    assert.equal(notificationChanges,0);
    await page.locator('#closeMailDialog').click();
    await page.locator('#refreshButton').click();
    await expect(page.locator('.outbox-state small')).toContainText('2 verzendpoging');
    await page.locator('.review-mail').click();
    await page.locator('#resolveAction').selectOption('confirm_received');
    await page.locator('#resolveConfirmed').check();
  }
  await page.locator('#resolveButton').click();
  await expect(page.locator('#mailDialog')).not.toBeVisible();
  await expect(page.locator('.outbox-item')).toHaveCount(0);
  assert.equal(notification.status,label==='desktop'?'confirmed':'pending');
  await page.locator('#leadsTab').click();
  if(label==='mobile'){
    await page.locator('.open-lead').first().click();
    await expect(page.locator('#privacySection')).toBeVisible();
    await page.locator('#privacyDeleteDetails summary').click();
    await page.locator('#privacyDeleteReason').selectOption('verified_privacy_request');
    await page.locator('#privacyDeleteId').fill(requestId);
    await page.locator('#privacyLegalReview').check();
    await page.locator('#privacyExternalCopies').check();
    await accessibility(page,'mobile/privacy-reviewed-delete');
    await page.locator('#privacyDeleteButton').click();
    await expect(page.locator('#detailPane')).not.toBeVisible();
    await expect(page.locator('#leadRows tr')).toHaveCount(1);
    await expect(page.locator('#dashboardMessage')).toContainText('HYXI-database verwijderd');
    assert.equal(privacyDeletes,1);
  }
  if(label==='desktop'){
    // A closed detail pane must never be repopulated by a response that was
    // already in flight. This also checks keyboard focus while loading.
    deferredDetail=new Promise(resolve=>{releaseDetail=resolve;});
    await page.locator('.open-lead').first().click();
    await expect(page.locator('#detailLoading')).toContainText('ophalen');
    await expect.poll(()=>waitingDetails).toBe(1);
    await page.keyboard.press('Tab');
    await expect(page.locator('#closeDetail')).toBeFocused();
    await page.keyboard.press('Escape');
    releaseDetail();deferredDetail=null;
    await page.waitForTimeout(75);
    await expect(page.locator('#contactFields')).toBeEmpty();
    await expect(page.locator('#detailPane')).not.toBeVisible();
    deferredList=new Promise(resolve=>{releaseList=resolve;});
    await page.locator('#refreshButton').click();
    await expect(page.locator('#listMessage')).toContainText('laden');
    await expect.poll(()=>waitingLists).toBe(1);
  }
  await page.locator('#logoutButton').click();
  await expect(page.locator('#loginView')).toBeVisible();
  if(deferredList){releaseList();deferredList=null;await page.waitForTimeout(75);}
  await expect(page.locator('#leadRows')).toBeEmpty();
  await expect(page.locator('#outboxItems')).toBeEmpty();
  await expect(page.locator('#dueItems')).toBeEmpty();
  await expect(page.locator('#kpiDays')).toBeEmpty();
  await expect(page.locator('#currentUser')).toHaveText('Beheerder');
  assert.equal(await page.evaluate(async()=> (await fetch('/api/beheer/leads')).status),401);
  assert.deepEqual(exceptions,[],label+' JavaScript exceptions');
  await context.close();
  privacyDeleted=false; // reset injected synthetic state for independent sales authorization tests
}
async function checkSalesAndExpiry(){
  role='sales';clockOffset=0;
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',locale:'nl-NL'});
  const page=await context.newPage();const privateRequests=[];
  page.on('request',request=>{if(/\/api\/beheer\/(outbox|assignees)/.test(request.url()))privateRequests.push(request.url());});
  await page.goto(base+'/beheer');await expect(page.locator('#loginView')).toBeVisible();
  await page.locator('#email').fill('beheerder@example.test');
  await page.locator('#password').fill('FictiefEnVeiligWachtwoord2026!');
  await page.locator('#loginButton').click();
  await expect(page.locator('#dashboardView')).toBeVisible();
  await expect(page.locator('#workbenchViews')).toBeVisible();
  await expect(page.locator('#outboxTab')).not.toBeVisible();
  await page.locator('#followupsTab').click();
  await expect(page.locator('.due-item')).toHaveCount(1);
  await expect(page.locator('#dueCount')).toHaveText('1');
  await page.locator('#metricsTab').click();
  await expect(page.locator('#kpiTotal')).toHaveText('1');
  await expect(page.locator('#metricsScope')).toContainText('Mijn toegewezen aanvragen');
  await page.locator('#leadsTab').click();
  await page.locator('.open-lead').first().click();
  await expect(page.locator('#contactFields')).toContainText('Fictieve Browsercontrole');
  await expect(page.locator('#assignmentForm')).not.toBeVisible();
  await expect(page.locator('#privacySection')).not.toBeVisible();
  assert.deepEqual(privateRequests,[],'Sales UI does not request admin-only data');
  signedIn=false;
  await page.locator('#editStatus').selectOption('contact_planned');
  await page.locator('#statusForm button').click();
  await expect(page.locator('#loginView')).toBeVisible();
  await expect(page.locator('#loginError')).toContainText('sessie is verlopen');
  await expect(page.locator('#contactFields')).toBeEmpty();
  await expect(page.locator('#profileFields')).toBeEmpty();
  await expect(page.locator('#leadRows')).toBeEmpty();
  await expect(page.locator('#assignee')).toBeEmpty();
  assert.equal(statusChanges,1,'Expired session must not perform a status mutation');
  await context.close();role='admin';
}
try{
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});
  const desktop=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce',locale:'nl-NL'});
  await loginAndReview(desktop,'desktop');
  const mobile=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',locale:'nl-NL',isMobile:true,hasTouch:true});
  await loginAndReview(mobile,'mobile');
  await checkSalesAndExpiry();
  console.log('PASS desktop/mobile Beheer including due tasks, real aggregate KPIs, privacy export/deletion, sales isolation, keyboard, logout and WCAG A/AA');
} finally {
  // Always release intentionally delayed responses, even if an assertion
  // fails, so CI reports the actual failure instead of timing out in close().
  releaseDetail?.();releaseList?.();
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
