/** Disposable local/CI MySQL only. Every recipient and SMTP transport is fake. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '../server/config.mjs';
import { createLeadPool } from '../server/db/pool.mjs';
import { createMysqlLeadStore, assertNotificationBudgetSchema } from '../server/db/store.mjs';
import { createNotificationWorker } from '../server/db/worker.mjs';
import { applyInitialMigration } from '../scripts/db-migrate.mjs';
import { applyNotificationMigration } from '../scripts/db-notification-migrate.mjs';

if (process.env.NODE_ENV !== 'test' || !/(?:test|ci)/i.test(process.env.DB_NAME || '') ||
    !['127.0.0.1','localhost','::1'].includes(process.env.DB_HOST || '127.0.0.1')) {
  throw new Error('Notification budget tests require a disposable local test/CI database.');
}
const config = loadConfig(process.env);
const pool = createLeadPool(config);
const createStore = () => createMysqlLeadStore({pool,encryptionKey:config.encryptionKey,hashSecret:config.hashSecret});
let owned = [], deferred = [], budgetDay, initialBudget, initialOldDay, constraint = false;
const priorDay = '2000-01-01';
const sample = {
  fullName:'Fictieve budgettest',email:'budget-test@example.test',phone:'0612345678',postcode:'1234AB',
  consent:true,website:'',profile:{solar:'planned',annualUsage:4000,goal:'backup',phase:'three',moduleType:9,moduleCount:2},
  attribution:{utm_source:'isolated-ci'},
};
async function receive(store) {
  const lead = await store.receive({lead:sample,requestKey:randomUUID()});
  owned.push(lead.requestId);
  return lead.requestId;
}
async function budget() {
  const [rows] = await pool.execute('SELECT attempt_count FROM aura_notification_daily_budget WHERE day_key=?',[budgetDay]);
  return Number(rows[0]?.attempt_count || 0);
}
async function notification(requestId) {
  const [rows] = await pool.execute(
    'SELECT o.* FROM aura_notification_outbox o JOIN aura_leads l ON l.id=o.lead_id WHERE l.request_id=?',[requestId],
  );
  return rows[0];
}
async function finish(store,row,state,error=null) {
  return store.completeNotification(row.id,state,error,0,{expectedAttempt:Number(row.attempt_count)});
}
async function dropConstraint() {
  const [version] = await pool.query('SELECT VERSION() AS version');
  await pool.query(/mariadb/i.test(version[0].version)
    ? 'ALTER TABLE aura_notification_daily_budget DROP CONSTRAINT ci_budget_reservation'
    : 'ALTER TABLE aura_notification_daily_budget DROP CHECK ci_budget_reservation');
  constraint=false;
}

try {
  await applyInitialMigration(pool);
  await applyNotificationMigration(pool);
  assert.equal((await applyNotificationMigration(pool)).applied,false,'Budget migration is repeatable');
  await assertNotificationBudgetSchema(pool);

  // Keep earlier suites' fictional queues intact and temporarily out of this
  // suite's selection window. No table or existing account is truncated.
  [deferred] = await pool.query("SELECT id,next_attempt_at FROM aura_notification_outbox WHERE delivery_status IN ('pending','retry_wait')");
  for (const row of deferred) await pool.execute('UPDATE aura_notification_outbox SET next_attempt_at=DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 2 DAY) WHERE id=?',[row.id]);
  const [dates] = await pool.query("SELECT DATE_FORMAT(UTC_TIMESTAMP(3),'%Y-%m-%d') AS day_key");
  budgetDay=dates[0].day_key;
  const [initial] = await pool.execute('SELECT attempt_count FROM aura_notification_daily_budget WHERE day_key=?',[budgetDay]);
  initialBudget=initial[0]?.attempt_count ?? null;
  const base=Number(initialBudget || 0);
  assert.ok(base < 900,'Disposable fixture leaves room for budget tests');
  const [older] = await pool.execute('SELECT attempt_count FROM aura_notification_daily_budget WHERE day_key=?',[priorDay]);
  initialOldDay=older[0]?.attempt_count ?? null;
  await pool.execute('INSERT INTO aura_notification_daily_budget (day_key,attempt_count) VALUES (?,1000) ON DUPLICATE KEY UPDATE attempt_count=1000',[priorDay]);

  const one=createStore(),two=createStore();
  await assert.rejects(()=>one.claimNextNotification({dailyLimit:0}));
  await assert.rejects(()=>one.claimNextNotification({dailyLimit:Infinity}));
  assert.equal(await one.claimNextNotification({dailyLimit:base+3}),null,'An empty queue reserves no attempt');
  assert.equal(await budget(),base);
  for(let i=0;i<8;i++)await receive(one);

  const claimed=(await Promise.all(Array.from({length:12},(_,i)=>
    (i%2?one:two).claimNextNotification({dailyLimit:base+3})))).filter(Boolean);
  assert.equal(claimed.length,3,'Concurrent workers share a single daily cap');
  assert.equal(new Set(claimed.map(row=>row.id)).size,3,'Each queued notification is claimed once');
  assert.equal(await budget(),base+3,'A previous UTC day budget does not count today');
  const restarted=createStore();
  assert.equal(await restarted.claimNextNotification({dailyLimit:base+3}),null,'Process restart cannot restore spent budget');
  let rows=await Promise.all(owned.map(notification));
  assert.equal(rows.filter(row=>row.delivery_status==='pending'&&Number(row.attempt_count)===0).length,5);

  await finish(one,claimed[0],'accepted');
  await finish(one,claimed[1],'retry_wait','ECONNREFUSED');
  await pool.execute('UPDATE aura_notification_outbox SET next_attempt_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 MINUTE) WHERE id=?',[claimed[1].id]);
  await pool.execute('UPDATE aura_notification_outbox SET claimed_until=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 SECOND) WHERE id=?',[claimed[2].id]);
  await one.recoverStaleClaims();
  assert.equal((await notification(claimed[2].request_id)).delivery_status,'uncertain');
  assert.equal(await budget(),base+3,'Interrupted reservations remain spent');

  let failures=0;
  const failedWorker=createNotificationWorker({store:one,config:{...config,dailyLimit:base+4},transport:{
    async sendMail(){failures++;throw Object.assign(new Error('Fake refused connection'),{code:'ECONNREFUSED'});},
  }});
  assert.equal(await failedWorker.flush(8),1);
  assert.equal(failures,1);
  assert.equal(await failedWorker.flush(8),0,'Worker honors the cap for automatic retries too');
  assert.equal(await budget(),base+4);
  assert.equal(Number((await notification(claimed[1].request_id)).attempt_count),2);

  // Simulate an operator's later retry without resetting monotonic attempts.
  await pool.execute('UPDATE aura_notification_outbox SET next_attempt_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 MINUTE) WHERE id=?',[claimed[1].id]);
  const retried=await one.claimNextNotification({dailyLimit:base+5});
  assert.equal(retried.id,claimed[1].id);
  assert.equal(Number(retried.attempt_count),3);
  await assert.rejects(()=>one.completeNotification(retried.id,'accepted',null,0,{expectedAttempt:2}),error=>error.code==='STALE_NOTIFICATION_CLAIM');
  assert.equal((await notification(retried.request_id)).delivery_status,'sending','A stale worker cannot complete the new claim');
  await finish(one,retried,'accepted');

  const sent=[];
  const worker=createNotificationWorker({store:two,config:{...config,dailyLimit:base+7},transport:{
    async sendMail(mail){sent.push(mail.messageId);return {accepted:[config.smtp.to]};},
  }});
  assert.equal(await worker.flush(8),2);
  assert.equal(await worker.flush(8),0);
  assert.equal(await budget(),base+7);
  assert.equal(sent.length,2);

  // An SQL failure while reserving the budget must roll back the outbox claim.
  const rollbackRequest=await receive(one);
  const rollbackRow=await notification(rollbackRequest);
  await pool.execute('UPDATE aura_notification_outbox SET next_attempt_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 MINUTE) WHERE id=?',[rollbackRow.id]);
  assert.match(budgetDay,/^\d{4}-\d{2}-\d{2}$/);
  await pool.query(`ALTER TABLE aura_notification_daily_budget ADD CONSTRAINT ci_budget_reservation CHECK (day_key <> '${budgetDay}' OR attempt_count <= ${base+7})`);
  constraint=true;
  await assert.rejects(()=>one.claimNextNotification({dailyLimit:base+8}),/ci_budget_reservation|Check constraint|CONSTRAINT/i);
  await dropConstraint();
  assert.equal(await budget(),base+7);
  assert.equal((await notification(rollbackRequest)).delivery_status,'pending');
  assert.equal(Number((await notification(rollbackRequest)).attempt_count),0,'Rolled-back reservation consumes no attempt');

  const drain=createNotificationWorker({store:one,config:{...config,dailyLimit:base+50},transport:{
    async sendMail(mail){sent.push(mail.messageId);return {accepted:[config.smtp.to]};},
  }});
  assert.equal(await drain.flush(20),4);
  const afterDrain=await budget();
  assert.equal(await drain.flush(20),0);
  assert.equal(await budget(),afterDrain,'Empty flush cannot consume budget');
  assert.equal((await notification(claimed[2].request_id)).delivery_status,'uncertain');
  assert.ok(!sent.includes(claimed[2].mail_message_id),'An uncertain delivery is never automatically resent');
  console.log('PASS persistent UTC SMTP budget, concurrent workers, retry cap, crash reservation, stale claim isolation and atomic rollback');
} finally {
  if(constraint)await dropConstraint();
  for(const requestId of owned)await pool.execute('DELETE FROM aura_leads WHERE request_id=?',[requestId]);
  for(const row of deferred)await pool.execute('UPDATE aura_notification_outbox SET next_attempt_at=? WHERE id=?',[row.next_attempt_at,row.id]);
  if(budgetDay){
    if(initialBudget===null)await pool.execute('DELETE FROM aura_notification_daily_budget WHERE day_key=?',[budgetDay]);
    else if(initialBudget!==undefined)await pool.execute('UPDATE aura_notification_daily_budget SET attempt_count=? WHERE day_key=?',[initialBudget,budgetDay]);
  }
  if(initialOldDay===null)await pool.execute('DELETE FROM aura_notification_daily_budget WHERE day_key=?',[priorDay]);
  else if(initialOldDay!==undefined)await pool.execute('UPDATE aura_notification_daily_budget SET attempt_count=? WHERE day_key=?',[initialOldDay,priorDay]);
  await pool.end();
}
