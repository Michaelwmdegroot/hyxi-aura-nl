// ONE-TIME AUTHORIZED SYNTHETIC production lead. No real customer data.
// Do not run in the ordinary npm/CI tests or production runtime.
const origin = 'https://hyxi-aura.nl';
const testKey = 'HYXI-AURA-P0-ONE-TIME-20261115-V1';
const payload = {
  fullName: 'TEST HYXI AURA CI',
  email: 'leads@thuisbatterijteam.nl',
  phone: '0600000000',
  postcode: '1000AA',
  consent: true,
  profile: {
    solar: 'planned',
    annualUsage: null,
    goal: 'unsure',
    phase: 'unknown',
    moduleType: 9,
    moduleCount: 2,
  },
  attribution: {
    utm_source: 'github-p0-e2e',
    utm_campaign: 'internal-qa-2026-11-15',
  },
};

const configResponse = await fetch(origin+'/api/config', {
  method:'GET',redirect:'manual',signal:AbortSignal.timeout(12000),
});
if(configResponse.status!==200)throw new Error('Public config returned HTTP '+configResponse.status);
const config = await configResponse.json();
const cookie = configResponse.headers.get('set-cookie')?.split(';')[0] || '';
if(!config.leadEnabled||!cookie.startsWith('aura_csrf=')||typeof config.csrfToken!=='string')
  throw new Error('Public form is not ready; no lead submitted.');
// Never print CSRF tokens, cookies, address, number or request body.
const response = await fetch(origin+'/api/leads',{
  method:'POST',redirect:'manual',signal:AbortSignal.timeout(20000),
  headers:{
    Origin:origin, Cookie:cookie,'X-CSRF-Token':config.csrfToken,
    'Idempotency-Key':testKey,'Content-Type':'application/json',
  },
  body:JSON.stringify(payload),
});
let result=null;
try {result=await response.json();}catch { /* no body logging */ }
if(![200,201].includes(response.status)||!result?.ok||!/^AURA-[a-f0-9-]{36}$/.test(result.requestId||'')){
  console.log('FAIL synthetic P0 test: HTTP '+response.status+'; code '+(result?.code||'UNKNOWN'));
  process.exitCode=1;
}else{
  console.log('PASS synthetic P0 test: HTTP '+response.status);
  console.log('REQUEST_ID='+result.requestId);
  console.log(response.status===201?'NEW lead request acknowledged after DB commit':'REUSED idempotent receipt; no duplicate request created');
  console.log('Test profile: 2 x BAT-Q9; goal unsure; no solar installation yet.');
  console.log('NEXT: check this request ID in /beheer and leads@thuisbatterijteam.nl (including Junk).');
}
