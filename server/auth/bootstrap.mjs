import { randomUUID } from 'node:crypto';
import { hashAdminPassword } from './security.mjs';
import { assertAdminSchema } from './store.mjs';

function validEmail(input) {
  const value = typeof input === 'string' ? input.trim().toLowerCase() : '';
  return value.length >= 6 && value.length <= 254 && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value)
    ? value : null;
}

export async function createFirstAdmin({ pool, email, password }) {
  if (!pool || typeof pool.getConnection!=='function') throw new Error('Database connection required.');
  const loginEmail=validEmail(email);
  if (!loginEmail) throw new Error('Invalid owner email.');
  const passwordHash=await hashAdminPassword(password);
  const id=randomUUID();
  await assertAdminSchema(pool);

  const conn=await pool.getConnection();
  let locked=false;
  try{
    // Named lock protects one-time bootstrap if two operators race.
    const [locks]=await conn.query("SELECT GET_LOCK('aura_beheer_first_owner',10) AS acquired");
    if(Number(locks[0]?.acquired)!==1)throw new Error('Owner initialization is currently locked.');
    locked=true;
    await conn.beginTransaction();
    const [existing]=await conn.query('SELECT COUNT(*) AS total FROM aura_admin_users');
    if(Number(existing[0].total)!==0)throw new Error('An owner already exists; use audited user management.');
    await conn.execute(
      'INSERT INTO aura_admin_users (id,login_email,password_hash,role,mfa_secret_encrypted,mfa_last_accepted_step) VALUES (?,?,?,?,?,?)',
      [id,loginEmail,passwordHash,'admin',Buffer.alloc(0),-1],
    );
    await conn.execute(
      'INSERT INTO aura_admin_audit (actor_user_id,action,result_code) VALUES (?,?,?)',
      [id,'owner_bootstrap','ok'],
    );
    await conn.commit();
    return { id, email:loginEmail, role:'admin' };
  }catch(error){
    await conn.rollback().catch(()=>{});
    throw error;
  }finally{
    if(locked)await conn.query("SELECT RELEASE_LOCK('aura_beheer_first_owner')").catch(()=>{});
    conn.release();
  }
}
