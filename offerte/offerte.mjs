// Standalone quote intake. Personal data stays in form memory; never in URL/storage/analytics.
const $ = id => document.getElementById(id);
const form = $('quoteForm'),button=$('submitQuote');
let config=null,configPromise=null,submitting=false,complete=false,key=null;
function selection(){
  const count=Number($('moduleCount').value);
  $('selectionLabel').textContent='Je verkent: '+count+' × BAT-Q'+$('moduleType').value;
}
function error(message,withFallback=false){
  $('quoteError').textContent=message;$('quoteError').hidden=false;
  $('quoteFallback').hidden=!withFallback;
}
function clearError(){$('quoteError').textContent='';$('quoteError').hidden=true;$('quoteFallback').hidden=true;}
function setBusy(value){
  submitting=value;button.disabled=value;
  button.setAttribute('aria-busy',String(value));
  button.firstChild.textContent=value?'Aanvraag wordt verwerkt… ':'Verstuur mijn vrijblijvende aanvraag ';
}
async function loadConfig(force=false){
  if(configPromise&&!force)return configPromise;
  configPromise=fetch('/api/config',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000)})
    .then(async response=>{
      if(!response.ok)throw new Error('Configuration unavailable');
      const result=await response.json();
      if(typeof result?.csrfToken!=='string'||typeof result?.leadEnabled!=='boolean')throw new Error('Invalid configuration');
      config=result;return config;
    })
    .catch(()=>{config=null;return null;})
    .finally(()=>{configPromise=null;});
  return configPromise;
}
function payload(){
  const data=new FormData(form);
  const usage=data.get('annualUsage')?.toString().trim()||'';
  const attribution={};
  const params=new URLSearchParams(location.search);
  for(const name of ['utm_source','utm_medium','utm_campaign']){
    const value=params.get(name);
    if(value && !/[\u0000-\u001f]/.test(value))attribution[name]=value.trim().slice(0,120);
  }
  const body={
    intent:'quote',
    fullName:String(data.get('fullName')||'').trim(),
    email:String(data.get('email')||'').trim(),
    phone:String(data.get('phone')||'').trim(),
    postcode:String(data.get('postcode')||'').trim(),
    consent:$('consent').checked,
    website:String(data.get('website')||''),
    profile:{
      solar:String(data.get('solar')||''),
      annualUsage:usage?Number(usage):null,
      goal:String(data.get('goal')||''),
      phase:String(data.get('phase')||''),
      moduleType:Number(data.get('moduleType')),
      moduleCount:Number(data.get('moduleCount')),
    },
  };
  const details=String(data.get('projectDetails')||'').trim();
  if(details)body.projectDetails=details;
  if(Object.keys(attribution).length)body.attribution=attribution;
  return body;
}
form.addEventListener('input',()=>{if(!submitting){key=null;clearError();}});
$('moduleType').addEventListener('change',selection);
$('moduleCount').addEventListener('change',selection);
selection();
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(submitting||complete)return;
  clearError();
  if(!form.checkValidity()){form.reportValidity();return;}
  const active=await loadConfig();
  if(!active?.leadEnabled){
    error('Online aanvragen is momenteel niet beschikbaar. Neem rechtstreeks contact op met Thuisbatterij Team.',true);
    return;
  }
  key ||= crypto.randomUUID().replaceAll('-','');
  setBusy(true);
  try{
    const response=await fetch('/api/leads',{
      method:'POST',credentials:'same-origin',cache:'no-store',
      signal:AbortSignal.timeout(25000),
      headers:{
        'Accept':'application/json','Content-Type':'application/json',
        'X-CSRF-Token':active.csrfToken,'Idempotency-Key':key,
      },
      body:JSON.stringify(payload()),
    });
    let data;
    try{data=await response.json();}catch{data=null;}
    if((response.status===200||response.status===201)&&data?.ok&&/^AURA-[a-f0-9-]{36}$/.test(data.requestId||'')){
      complete=true;
      $('quoteReceipt').textContent=data.requestId;
      form.hidden=true;
      $('quoteResult').hidden=false;
      $('quoteResult').scrollIntoView({behavior:'smooth',block:'start'});
      $('quoteResult').setAttribute('tabindex','-1');
      $('quoteResult').focus({preventScroll:true});
      return;
    }
    if(data?.code==='SESSION_EXPIRED')await loadConfig(true);
    if(data?.code==='REQUEST_CHANGED')key=null;
    error(data?.message||'Je aanvraag kon niet worden opgeslagen. Probeer opnieuw of neem direct contact op.',[429,503].includes(response.status));
  }catch{
    error('We konden de ontvangst niet bevestigen. Probeer het opnieuw met dezelfde gegevens of neem contact met ons op.',true);
  }finally{setBusy(false);}
});
loadConfig().then(ready=>{
  if(ready && !ready.leadEnabled)error('Online aanvragen is tijdelijk niet beschikbaar. Gebruik de contactmogelijkheden hieronder.',true);
});
