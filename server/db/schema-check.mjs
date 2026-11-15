import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

// These are required invariants, not a replacement migration framework.
// Later migrations may add columns/indexes but may not weaken these keys,
// encryption columns, referential constraints or transactional engines.
const leadTables = {
  aura_schema_migrations: {
    columns:{version:'varchar(64)@ascii_bin',checksum:'char(64)@ascii_bin',applied_at:'datetime(3)'},
    unique:[['PRIMARY','version']],
  },
  aura_leads: {
    columns:{id:'char(36)@ascii_bin',request_id:'varchar(48)@ascii_bin',request_type:'varchar(16)',status:'varchar(32)',source_domain:'varchar(100)',encrypted_payload:'mediumblob',encryption_key_id:'varchar(32)@ascii_bin',privacy_version:'varchar(32)',contact_requested_at:'datetime(3)',assigned_user_id:'char(36)?@ascii_bin',created_at:'datetime(3)',updated_at:'datetime(3)'},
    unique:[['PRIMARY','id'],['uq_aura_leads_request_id','request_id']],
  },
  aura_submission_keys: {
    columns:{key_hash:'char(64)@ascii_bin',payload_hash:'char(64)@ascii_bin',lead_id:'char(36)@ascii_bin',created_at:'datetime(3)',expires_at:'datetime(3)'},
    unique:[['PRIMARY','key_hash']],
    foreign:[['fk_aura_submission_lead','lead_id','aura_leads','id','CASCADE']],
  },
  aura_lead_events: {
    columns:{id:'bigint unsigned',lead_id:'char(36)@ascii_bin',event_type:'varchar(48)',actor_type:'varchar(16)',actor_id:'char(36)?@ascii_bin',metadata_json:'json?',occurred_at:'datetime(3)'},
    unique:[['PRIMARY','id']],
    foreign:[['fk_aura_events_lead','lead_id','aura_leads','id','CASCADE']],
    autoIncrement:'id',
  },
  aura_notification_outbox: {
    columns:{id:'char(36)@ascii_bin',lead_id:'char(36)@ascii_bin',event_type:'varchar(40)',delivery_status:'varchar(24)',attempt_count:'int unsigned',next_attempt_at:'datetime(3)',claimed_until:'datetime(3)?',mail_message_id:'varchar(128)?@ascii_bin',last_error_code:'varchar(64)?@ascii_bin',accepted_by_smtp_at:'datetime(3)?',created_at:'datetime(3)',updated_at:'datetime(3)'},
    unique:[['PRIMARY','id'],['uq_aura_notification_lead_type','lead_id','event_type'],['uq_aura_notification_mail_id','mail_message_id']],
    foreign:[['fk_aura_notification_lead','lead_id','aura_leads','id','CASCADE']],
  },
};
const adminTables = {
  aura_admin_users: {
    columns:{id:'char(36)@ascii_bin',login_email:'varchar(254)',password_hash:'varchar(255)@ascii_bin',role:'varchar(16)',mfa_secret_encrypted:'varbinary(255)',mfa_last_accepted_step:'bigint',disabled_at:'datetime(3)?',created_at:'datetime(3)'},
    unique:[['PRIMARY','id'],['uq_aura_admin_email','login_email']],
  },
  aura_admin_sessions: {
    columns:{token_hash:'char(64)@ascii_bin',user_id:'char(36)@ascii_bin',expires_at:'datetime(3)',revoked_at:'datetime(3)?',created_at:'datetime(3)'},
    unique:[['PRIMARY','token_hash']],
    foreign:[['fk_aura_admin_session_user','user_id','aura_admin_users','id','CASCADE']],
  },
  aura_admin_login_guards: {
    columns:{guard_hash:'char(64)@ascii_bin',failures:'smallint unsigned',window_started_at:'datetime(3)',blocked_until:'datetime(3)?'},
    unique:[['PRIMARY','guard_hash']],
  },
  aura_admin_audit: {
    columns:{id:'bigint unsigned',actor_user_id:'char(36)?@ascii_bin',lead_id:'char(36)?@ascii_bin',action:'varchar(40)@ascii_bin',result_code:'varchar(32)@ascii_bin',occurred_at:'datetime(3)'},
    unique:[['PRIMARY','id']],
    autoIncrement:'id',
  },
};

export async function migrationChecksum(version) {
  if (!['001_initial_leads','002_admin_auth','003_account_audit','004_notification_budget'].includes(version)) {
    throw new Error('Unknown reviewed migration.');
  }
  const source=await readFile(new URL('../../db/migrations/'+version+'.sql',import.meta.url),'utf8');
  return createHash('sha256').update(source).digest('hex');
}

export async function assertMigrationChecksum(connection,version) {
  const [rows]=await connection.execute('SELECT checksum FROM aura_schema_migrations WHERE version=? LIMIT 1',[version]);
  if(rows.length!==1 || rows[0].checksum!==await migrationChecksum(version)) {
    throw new Error('Required migration is absent or its checksum differs: '+version);
  }
}

async function assertStructure(connection,tables) {
  for(const [name,expected] of Object.entries(tables)) {
    const [engines]=await connection.execute(
      'SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?',[name],
    );
    if(engines.length!==1 || engines[0].ENGINE!=='InnoDB')throw new Error('Required transactional table differs: '+name);
    const [columns]=await connection.execute(
      'SELECT COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLLATION_NAME,EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?',[name],
    );
    const byName=new Map(columns.map(column=>[column.COLUMN_NAME,column]));
    for(const [columnName,spec] of Object.entries(expected.columns)) {
      const [declared,collation]=spec.split('@');
      const nullable=declared.endsWith('?');
      const type=nullable?declared.slice(0,-1):declared;
      const column=byName.get(columnName);
      const actual=String(column?.COLUMN_TYPE||'').toLowerCase().replace(/^(tinyint|smallint|mediumint|int|bigint)\(\d+\)/,'$1');
      // MariaDB represents its JSON alias as longtext. The application
      // always serializes this optional non-sensitive metadata itself.
      if(!column || (actual!==type && !(type==='json'&&actual==='longtext')) ||
         column.IS_NULLABLE!==(nullable?'YES':'NO') || (collation&&column.COLLATION_NAME!==collation) ||
         (columnName===expected.autoIncrement&&!/\bauto_increment\b/.test(column.EXTRA))) {
        throw new Error('Required column differs: '+name+'.'+columnName);
      }
    }
    const [indexes]=await connection.execute(
      'SELECT INDEX_NAME,COLUMN_NAME,NON_UNIQUE,SEQ_IN_INDEX,SUB_PART FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY INDEX_NAME,SEQ_IN_INDEX',[name],
    );
    for(const [indexName,...names] of expected.unique) {
      const index=indexes.filter(row=>row.INDEX_NAME===indexName);
      if(index.length!==names.length||index.some((row,i)=>row.COLUMN_NAME!==names[i]||Number(row.NON_UNIQUE)!==0||row.SUB_PART!==null)) {
        throw new Error('Required unique key differs: '+name+'.'+indexName);
      }
    }
    if(expected.foreign?.length) {
      const [foreign]=await connection.execute(
        'SELECT k.CONSTRAINT_NAME,k.COLUMN_NAME,k.TABLE_SCHEMA,k.REFERENCED_TABLE_SCHEMA,k.REFERENCED_TABLE_NAME,k.REFERENCED_COLUMN_NAME,r.DELETE_RULE FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME AND r.TABLE_NAME=k.TABLE_NAME WHERE k.TABLE_SCHEMA=DATABASE() AND k.TABLE_NAME=? ORDER BY k.ORDINAL_POSITION',[name],
      );
      for(const [key,column,target,targetColumn,onDelete] of expected.foreign) {
        const matches=foreign.filter(row=>row.CONSTRAINT_NAME===key);
        if(matches.length!==1 || matches[0].COLUMN_NAME!==column || matches[0].REFERENCED_TABLE_NAME!==target ||
           matches[0].REFERENCED_COLUMN_NAME!==targetColumn || matches[0].REFERENCED_TABLE_SCHEMA!==matches[0].TABLE_SCHEMA || matches[0].DELETE_RULE!==onDelete) {
          throw new Error('Required foreign key differs: '+name+'.'+key);
        }
      }
    }
  }
}

export const assertLeadStructure=connection=>assertStructure(connection,leadTables);
export const assertAdminStructure=connection=>assertStructure(connection,adminTables);
export const assertNotificationBudgetStructure=connection=>assertStructure(connection,{
  aura_notification_daily_budget:{columns:{day_key:'date',attempt_count:'int unsigned'},unique:[['PRIMARY','day_key']]},
});

export async function withMigrationLock(pool,operation) {
  const connection=await pool.getConnection();
  let locked=false;
  try {
    const [rows]=await connection.query("SELECT GET_LOCK(CONCAT('aura_schema:',LEFT(SHA2(DATABASE(),256),40)),10) AS acquired");
    if(Number(rows[0]?.acquired)!==1)throw new Error('Schema migration is locked.');
    locked=true;
    return await operation(connection);
  } finally {
    if(locked)await connection.query("SELECT RELEASE_LOCK(CONCAT('aura_schema:',LEFT(SHA2(DATABASE(),256),40)))").catch(()=>{});
    connection.release();
  }
}
