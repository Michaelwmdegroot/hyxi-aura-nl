// HYXI AURA Beheer — authorized, deliberately manual privacy operations.
// This does not create a scheduled retention cleanup or remove copies in mail/Odoo/backups.
import { openLead, parseEncryptionKey } from '../db/crypto.mjs';

const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const REQUEST=/^AURA-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const CLOSED=new Set(['lost','not_suitable']);
const IN_FLIGHT=new Set(['pending','retry_wait','sending']);
const REASONS=new Set(['retention_reviewed','verified_privacy_request']);
const iso=value=>value?new Date(value).toISOString():null;

export class PrivacyOperationError extends Error {
  constructor(code){super('Privacy operation refused.');this.code=code;}
}

function requireAdmin(actor) {
  if(actor?.role!=='admin'||!UUID.test(actor.id||''))throw new PrivacyOperationError('FORBIDDEN');
}
async function activeAdmin(conn,actor){
  requireAdmin(actor);
  const [rows]=await conn.execute(
    "SELECT id FROM aura_admin_users WHERE id=? AND role='admin' AND disabled_at IS NULL FOR UPDATE",
    [actor.id],
  );
  if(rows.length!==1)throw new PrivacyOperationError('FORBIDDEN');
}

export function validateDeletionConfirmation(requestId,input){
  if(!REQUEST.test(requestId||'')||!input||typeof input!=='object'||Array.isArray(input))return null;
  if(Object.keys(input).sort().join(',')!=='acknowledgedExternalCopies,confirmedRequestId,legalReviewConfirmed,reason')return null;
  if(input.confirmedRequestId!==requestId||input.legalReviewConfirmed!==true||
     input.acknowledgedExternalCopies!==true||!REASONS.has(input.reason))return null;
  return {reason:input.reason};
}

export function createPrivacyOperations({pool,leadEncryptionKey}){
  if(!pool||typeof pool.getConnection!=='function')throw new Error('Privacy operations require a MySQL pool.');
  const encryptionKey=parseEncryptionKey(leadEncryptionKey);

  async function exportPrivacyDossier(actor,requestId){
    requireAdmin(actor);
    if(!REQUEST.test(requestId||''))throw new PrivacyOperationError('NOT_FOUND');
    const conn=await pool.getConnection();
    try{
      await conn.beginTransaction();
      await activeAdmin(conn,actor);
      const [rows]=await conn.execute(
        'SELECT id,request_id,request_type,status,source_domain,privacy_version,encrypted_payload,encryption_key_id,contact_requested_at,created_at,updated_at FROM aura_leads WHERE request_id=? LIMIT 1 FOR SHARE',
        [requestId],
      );
      const row=rows[0];
      if(!row)throw new PrivacyOperationError('NOT_FOUND');
      const decrypted=openLead(row.encrypted_payload,row.id,encryptionKey,row.encryption_key_id);
      await conn.execute(
        "INSERT INTO aura_admin_audit (actor_user_id,lead_id,action,result_code) VALUES (?,?,'privacy_export','ok')",
        [actor.id,row.id],
      );
      await conn.commit();
      return {
        requestId:row.request_id,
        exportedAt:new Date().toISOString(),
        record:{
          requestType:row.request_type,status:row.status,source:row.source_domain,
          privacyVersion:row.privacy_version,
          receivedAt:iso(row.contact_requested_at),createdAt:iso(row.created_at),updatedAt:iso(row.updated_at),
        },
        // Includes internal notes — an authorized human must review before sharing with a requester.
        lead:decrypted,
        scope:'HYXI database dossier only. E-mail, Odoo and Hostinger back-up copies are separate.',
      };
    }catch(error){
      await conn.rollback().catch(()=>{});
      throw error;
    }finally{conn.release();}
  }

  async function deletePrivacyDossier(actor,requestId,confirmation){
    requireAdmin(actor);
    if(!REQUEST.test(requestId||''))throw new PrivacyOperationError('NOT_FOUND');
    const parsed=validateDeletionConfirmation(requestId,confirmation);
    if(!parsed)throw new PrivacyOperationError('BAD_PRIVACY_ACTION');
    const conn=await pool.getConnection();
    try{
      await conn.beginTransaction();
      await activeAdmin(conn,actor);
      const [rows]=await conn.execute(
        'SELECT id,status FROM aura_leads WHERE request_id=? LIMIT 1 FOR UPDATE',
        [requestId],
      );
      const row=rows[0];
      if(!row)throw new PrivacyOperationError('NOT_FOUND');
      // Never auto-delete an active/won lead for routine retention; no verified last-contact date exists.
      if(row.status==='won'||(parsed.reason==='retention_reviewed'&&!CLOSED.has(row.status))){
        throw new PrivacyOperationError('PRIVACY_STATUS');
      }
      // Do not destroy queued/sending notifications while a worker may still need this record.
      const [notifications]=await conn.execute(
        'SELECT delivery_status FROM aura_notification_outbox WHERE lead_id=? FOR UPDATE',
        [row.id],
      );
      if(notifications.some(item=>IN_FLIGHT.has(item.delivery_status))){
        throw new PrivacyOperationError('PRIVACY_MAIL_PENDING');
      }
      // Historical admin audit records contain no PII other than a correlatable lead UUID.
      // Retain anonymized action/time history but break the record linkage.
      await conn.execute('UPDATE aura_admin_audit SET lead_id=NULL WHERE lead_id=?',[row.id]);
      const [deleted]=await conn.execute('DELETE FROM aura_leads WHERE id=?',[row.id]);
      if(deleted.affectedRows!==1)throw new PrivacyOperationError('STATE_CHANGED');
      // FK cascade deletes submission keys, lead events, outbox and encrypted notes.
      // Keep an unlinked reason-only deletion audit record, no request ID or contact data.
      await conn.execute(
        "INSERT INTO aura_admin_audit (actor_user_id,lead_id,action,result_code) VALUES (?,NULL,'privacy_delete',?)",
        [actor.id,parsed.reason==='retention_reviewed'?'retention':'rights_request'],
      );
      await conn.commit();
      return {requestId,deleted:true,externalCopiesPending:true};
    }catch(error){
      await conn.rollback().catch(()=>{});
      throw error;
    }finally{conn.release();}
  }

  return {exportPrivacyDossier,deletePrivacyDossier};
}
