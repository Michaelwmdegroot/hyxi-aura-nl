/**
 * Secure one-time HYXI AURA owner bootstrap (interactive TTY only).
 * This script NEVER runs during npm start, build or deploy.
 */
import { createInterface } from 'node:readline/promises';
import { loadConfig } from '../server/config.mjs';
import { createLeadPool } from '../server/db/pool.mjs';
import { newTotpSecret } from '../server/auth/security.mjs';
import { createFirstAdmin } from '../server/auth/bootstrap.mjs';

async function askVisible(question){
  const rl=createInterface({input:process.stdin,output:process.stdout});
  try {return (await rl.question(question)).trim();}
  finally {rl.close();}
}
async function askHidden(label) {
  // No password echo, logs, CLI flags or environment variables.
  const input=process.stdin,output=process.stdout;
  if(!input.isTTY||typeof input.setRawMode!=='function')throw new Error('Interactive TTY required.');
  output.write(label);
  return new Promise((resolve,reject)=>{
    const prior=Boolean(input.isRaw);
    let value='';
    input.setRawMode(true);input.resume();
    function finish(error){
      input.off('data',onData);
      input.setRawMode(prior);
      output.write('\n');
      if(error)reject(error);else resolve(value);
    }
    function onData(buffer){
      const chars=buffer.toString('utf8');
      for(const ch of chars){
        if(ch==='\u0003')return finish(new Error('Interrupted.'));
        if(ch==='\r'||ch==='\n')return finish();
        if(ch==='\u007f'||ch==='\b'){value=value.slice(0,-1);continue;}
        if(ch<' '||ch==='\u007f')continue;
        if(value.length<1024)value+=ch;
      }
    }
    input.on('data',onData);
  });
}

if(process.argv[2]!=='--create-first-owner'||
   process.env.ADMIN_BOOTSTRAP!=='interactive-confirmed'||
   !process.stdin.isTTY || !process.stdout.isTTY) {
  console.error('Owner bootstrap refused. Use --create-first-owner and ADMIN_BOOTSTRAP=interactive-confirmed in a private interactive terminal.');
  process.exitCode=1;
}else{
  let pool;
  try{
    const cfg=loadConfig();
    if(!cfg.dbConfigured || !cfg.adminConfigured){
      throw new Error('Complete DB and independent admin secrets must be set securely first.');
    }
    console.log('HYXI AURA Beheer — eerste eigenaar (eenmalige inrichting)');
    console.log('Gebruik uitsluitend een vertrouwde terminal; deel onderstaande MFA-setupcode niet.');
    const email=await askVisible('E-mailadres eigenaar: ');
    const password=await askHidden('Nieuw sterk wachtwoord: ');
    const repeat=await askHidden('Herhaal wachtwoord: ');
    if(password!==repeat)throw new Error('Wachtwoorden komen niet overeen.');
    const seed=newTotpSecret();
    const uri='otpauth://totp/'+encodeURIComponent('HYXI AURA Beheer:'+email)+
      '?secret='+seed+'&issuer='+encodeURIComponent('HYXI AURA Beheer')+'&digits=6&period=30';
    console.log('Voeg dit account handmatig toe aan jouw authenticator:');
    console.log('Eenmalig secret: '+seed);
    console.log('Authenticator URI: '+uri);
    const code=await askVisible('Bevestig met een actuele 6-cijferige code: ');
    pool=createLeadPool(cfg);
    const account=await createFirstAdmin({
      pool,email,password,totpSecret:seed,confirmationCode:code,mfaKey:cfg.adminMfaKey,
    });
    console.log('Eerste beheerder aangemaakt: '+account.email+'. De bevestigingscode kan niet opnieuw worden gebruikt.');
  }catch{
    console.error('Eigenaaraccount niet aangemaakt. Controleer invoer en configuratie in de beveiligde omgeving.');
    process.exitCode=1;
  }finally{
    if(pool)await pool.end().catch(()=>{});
  }
}
