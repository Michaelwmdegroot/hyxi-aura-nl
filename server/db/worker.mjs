import { buildLeadMail, definitelyNotDelivered, recipientAccepted } from '../mail.mjs';

const DELAY_SECONDS = [30, 120, 600, 1800];

export function createNotificationWorker({ store, transport, config, sendTimeoutMs = 25000 }) {
  if (!store || !transport || !config) throw new Error('Outbox worker needs store, transport and config.');
  let running = false;
  let rerun = false;
  let stopped = false;
  let interval = null;

  async function flush(maxItems = 8) {
    let handled = 0;
    const recovered = await store.recoverStaleClaims();
    if (recovered) console.warn('HYXI AURA outbox has interrupted deliveries requiring review:', recovered);
    while (handled < maxItems) {
      const row = await store.claimNextNotification();
      if (!row) break;
      handled++;
      try {
        const lead = store.decodeNotification(row);
        const occurred = new Date(row.contact_requested_at).getTime();
        const mail = buildLeadMail(config, lead, row.request_id, Number.isFinite(occurred) ? occurred : Date.now());
        mail.messageId = row.mail_message_id;
        const result = await transport.sendMail({
          ...mail,
          signal: AbortSignal.timeout(sendTimeoutMs),
        });
        if (!recipientAccepted(result, config.smtp.to)) {
          const error = new Error('Recipient was rejected.');
          error.code = 'EENVELOPE';
          throw error;
        }
        await store.completeNotification(row.id, 'accepted');
      } catch (error) {
        const reason = /^[A-Z0-9_]{1,64}$/.test(String(error?.code || ''))
          ? String(error.code) : 'SMTP_UNCERTAIN';
        if (!definitelyNotDelivered(error)) {
          await store.completeNotification(row.id, 'uncertain', reason);
        } else if (reason === 'EAUTH' || reason === 'EENVELOPE' || row.attempt_count >= 4) {
          await store.completeNotification(row.id, 'failed', reason);
        } else {
          await store.completeNotification(row.id, 'retry_wait', reason, DELAY_SECONDS[Math.min(3, row.attempt_count - 1)]);
        }
      }
    }
    return handled;
  }

  async function work() {
    if (stopped) return;
    if (running) { rerun = true; return; }
    running = true;
    try {
      await flush();
    } catch {
      // Do not emit SQL, SMTP data, names, addresses or other sensitive errors.
      console.error('HYXI AURA outbox maintenance failed; notifications remain persisted.');
    } finally {
      running = false;
      if (rerun && !stopped) {
        rerun = false;
        queueMicrotask(() => { void work(); });
      }
    }
  }

  function start(intervalMs = 30000) {
    if (interval) return;
    stopped = false;
    interval = setInterval(() => { void work(); }, intervalMs);
    interval.unref();
    void work();
  }

  function wake() { void work(); }
  function stop() { stopped = true; if (interval) clearInterval(interval); interval = null; }
  return { start, wake, stop, flush };
}
