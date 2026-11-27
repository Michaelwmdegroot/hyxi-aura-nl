// Operational actions exposed only to an authenticated administrator.
// Customer payloads and SMTP credentials are never needed for these actions.
const REQUEST_ID = /^AURA-[a-f0-9-]{36}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const INCIDENTS = new Set(['failed', 'uncertain']);
const iso = value => value ? new Date(value).toISOString() : null;

export class AdminOperationError extends Error {
  constructor(code) { super('Administrative operation refused.'); this.code = code; }
}

function requireAdmin(actor) {
  if (!actor || actor.role !== 'admin' || !UUID.test(actor.id || '')) {
    throw new AdminOperationError('FORBIDDEN');
  }
}

async function activeAdministrator(conn, actor) {
  requireAdmin(actor);
  const [rows] = await conn.execute(
    "SELECT id FROM aura_admin_users WHERE id=? AND role='admin' AND disabled_at IS NULL FOR UPDATE",
    [actor.id],
  );
  if (rows.length !== 1) throw new AdminOperationError('FORBIDDEN');
}

export function createAdminOperations({ pool }) {
  async function listAssignees(actor) {
    requireAdmin(actor);
    const [rows] = await pool.query(
      "SELECT id,login_email,role FROM aura_admin_users WHERE disabled_at IS NULL AND role IN ('admin','sales') ORDER BY login_email LIMIT 100",
    );
    return { items: rows.map(row => ({ id: row.id, email: row.login_email, role: row.role })) };
  }

  async function assignLead(actor, requestId, userId) {
    requireAdmin(actor);
    if (!REQUEST_ID.test(requestId || '')) throw new AdminOperationError('NOT_FOUND');
    if (userId !== null && !UUID.test(userId || '')) throw new AdminOperationError('BAD_ASSIGNEE');
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await activeAdministrator(conn, actor);
      const [rows] = await conn.execute(
        'SELECT id,assigned_user_id FROM aura_leads WHERE request_id=? LIMIT 1 FOR UPDATE', [requestId],
      );
      const row = rows[0];
      if (!row) throw new AdminOperationError('NOT_FOUND');
      if (userId !== null) {
        const [users] = await conn.execute(
          "SELECT id FROM aura_admin_users WHERE id=? AND disabled_at IS NULL AND role IN ('admin','sales') FOR UPDATE", [userId],
        );
        if (users.length !== 1) throw new AdminOperationError('BAD_ASSIGNEE');
      }
      const changed = row.assigned_user_id !== userId;
      if (changed) {
        await conn.execute('UPDATE aura_leads SET assigned_user_id=? WHERE id=?', [userId, row.id]);
        await conn.execute(
          'INSERT INTO aura_lead_events (lead_id,event_type,actor_type,actor_id,metadata_json) VALUES (?,?,?,?,?)',
          [row.id, 'assignment_changed', 'admin', actor.id, JSON.stringify({ from: row.assigned_user_id, to: userId })],
        );
        await conn.execute(
          'INSERT INTO aura_admin_audit (actor_user_id,lead_id,action,result_code) VALUES (?,?,?,?)',
          [actor.id, row.id, 'lead_assign', 'ok'],
        );
      }
      await conn.commit();
      return { requestId, assignedTo: userId, changed };
    } catch (error) {
      await conn.rollback().catch(() => {});
      throw error;
    } finally { conn.release(); }
  }

  async function listNotifications(actor, { page = 1 } = {}) {
    requireAdmin(actor);
    if (!Number.isSafeInteger(page) || page < 1 || page > 1000) throw new AdminOperationError('BAD_FILTER');
    const [counts] = await pool.query(
      "SELECT COUNT(*) AS total FROM aura_notification_outbox WHERE delivery_status IN ('failed','uncertain')",
    );
    const [rows] = await pool.query(
      "SELECT o.id,l.request_id,o.event_type,o.delivery_status,o.attempt_count,o.last_error_code,o.updated_at,o.next_attempt_at,o.mail_message_id FROM aura_notification_outbox o JOIN aura_leads l ON l.id=o.lead_id WHERE o.delivery_status IN ('failed','uncertain') ORDER BY o.updated_at ASC,o.id ASC LIMIT ? OFFSET ?",
      [20, (page - 1) * 20],
    );
    return {
      total: Number(counts[0].total), page,
      items: rows.map(row => ({
        id: row.id, requestId: row.request_id, eventType: row.event_type,
        notificationType: row.event_type === 'sales_lead_received' ? 'sales' : 'crm',
        notificationLabel: row.event_type === 'sales_lead_received' ? 'Salesnotificatie' : 'CRM-mail',
        mailboxLabel: row.event_type === 'sales_lead_received' ? 'Interne salesmailbox' : 'leads@thuisbatterijteam.nl',
        status: row.delivery_status,
        attempts: Number(row.attempt_count), errorCode: row.last_error_code,
        updatedAt: iso(row.updated_at), nextAttemptAt: iso(row.next_attempt_at), mailMessageId: row.mail_message_id,
      })),
    };
  }

  async function resolveNotification(actor, id, { action, expectedStatus, expectedAttempt, confirmed } = {}) {
    requireAdmin(actor);
    if (!UUID.test(id || '')) throw new AdminOperationError('NOT_FOUND');
    if (!['retry', 'confirm_received'].includes(action) || !INCIDENTS.has(expectedStatus) ||
        !Number.isSafeInteger(expectedAttempt) || expectedAttempt < 1 || confirmed !== true) {
      throw new AdminOperationError('BAD_NOTIFICATION_ACTION');
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await activeAdministrator(conn, actor);
      const [rows] = await conn.execute(
        'SELECT id,lead_id,delivery_status,attempt_count,last_error_code FROM aura_notification_outbox WHERE id=? LIMIT 1 FOR UPDATE', [id],
      );
      const row = rows[0];
      if (!row) throw new AdminOperationError('NOT_FOUND');
      if (row.delivery_status !== expectedStatus || Number(row.attempt_count) !== expectedAttempt) {
        throw new AdminOperationError('STATE_CHANGED');
      }
      const status = action === 'retry' ? 'pending' : 'confirmed';
      // A confirmed inbox receipt is recorded separately from SMTP acceptance.
      // Keep the attempt counter monotonic, including during a manual retry.
      await conn.execute(
        'UPDATE aura_notification_outbox SET delivery_status=?,claimed_until=NULL,next_attempt_at=UTC_TIMESTAMP(3),last_error_code=NULL WHERE id=?',
        [status, id],
      );
      await conn.execute(
        'INSERT INTO aura_lead_events (lead_id,event_type,actor_type,actor_id,metadata_json) VALUES (?,?,?,?,?)',
        [row.lead_id, 'notification_' + action, 'admin', actor.id, JSON.stringify({
          notificationId: id, from: expectedStatus, to: status, attempts: Number(row.attempt_count),
        })],
      );
      await conn.execute(
        'INSERT INTO aura_admin_audit (actor_user_id,lead_id,action,result_code) VALUES (?,?,?,?)',
        [actor.id, row.lead_id, action === 'retry' ? 'notification_retry' : 'notification_confirm', 'ok'],
      );
      await conn.commit();
      return { id, status, changed: true };
    } catch (error) {
      await conn.rollback().catch(() => {});
      throw error;
    } finally { conn.release(); }
  }

  return { listAssignees, assignLead, listNotifications, resolveNotification };
}
