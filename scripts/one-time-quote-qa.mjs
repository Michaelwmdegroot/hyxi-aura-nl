// One-off synthetic HYXI AURA quote QA. No customer data, no external dependencies.
// Stable idempotency key prevents duplicate CRM test leads if this action is retried.
const origin='https://hyxi-aura.nl';
const key='HYXI-AURA-QUOTE-ONE-TIME-20261116-V1';
const lead={
  intent:'quote',
  fullName:'TEST HYXI OFFERTE CI',
  email:'leads@thuisbatterijteam.nl',
  phone:'0600000000',
  postcode:'1000AA',
  consent:true,
  website:'',
  projectDetails:'INTERNE TEST - QA-offerte, niet behandelen als echte verkoopkans.',
  profile:{
    solar:'yes',annualUsage:3800,goal:'backup',phase:'three',
    moduleType:7,moduleCount:3,
  },
  attribution:{utm_source:'github-quote-qa',utm_campaign:'one-time-2026-11-16'},
};
const configResponse=await fetch(origin+'/api/config',{
  method:'GET',redirect:'manual',signal:AbortSignal.timeout(12000),
});
if(configResponse.status!==200)throw new Error('Config HTTP '+configResponse.status);
const config=await configResponse.json();
const cookie=configResponse.headers.get('set-cookie')?.split(';')[0]||'';
if(config.leadEnabled!==true||typeof config.csrfToken!=='string'||!cookie.startsWith('aura_csrf='))
  throw new Error('Public intake is not enabled; no quote submitted.');
const response=await fetch(origin+'/api/leads',{
  method:'POST',redirect:'manual',signal:AbortSignal.timeout(24000),
  headers:{
    Origin:origin,Cookie:cookie,'X-CSRF-Token':config.csrfToken,
    'Idempotency-Key':key,'Content-Type':'application/json',
  },
  body:JSON.stringify(lead),
});
let result=null;
try{result=await response.json();}catch{}
if(![200,201].includes(response.status)||result?.ok!==true||
   !/^AURA-[a-f0-9-]{36}$/.test(result.requestId||'')){
  console.log('FAIL quote: HTTP '+response.status+'; code '+(result?.code||'UNKNOWN'));
  process.exitCode=1;
}else{
  console.log('PASS one-time synthetic quote: HTTP '+response.status);
  console.log('REQUEST_ID='+result.requestId);
  console.log('EXPECTED_TYPE=quote; MODULES=3xBAT-Q7; CAMPAIGN=one-time-2026-11-16');
  console.log('Receipt issued after a committed database transaction; inbox requires independent verification.');
}
