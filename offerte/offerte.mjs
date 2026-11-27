// Standalone quote intake. Personal data stays in form memory; never in URL/storage/analytics.
import '../src/ads-consent.mjs';
import { getCampaignAttribution } from '../src/campaign-attribution.mjs';
import { createConversionReference, publishAcceptedLeadSignal } from '../src/lead-conversion-signal.mjs';
const $ = id => document.getElementById(id);
const form = $('quoteForm'),button=$('submitQuote');
let config=null,configPromise=null,submitting=false,complete=false,key=null,conversionRef=null;
function selection(){
  const offeredPhase=$('phase').value==='three'?'three':'single';
  const countField=$('moduleCount');
  const third=countField.querySelector('option[value="3"]');
  third.disabled=offeredPhase!=='three';
  if(third.disabled && countField.value==='3')countField.value='2';
  const count=Number(countField.value);
  $('offerPhase').value=offeredPhase;
  const phaseName=offeredPhase==='three'?'3 fasen':'1 fase';
  const inverter=offeredPhase==='three'?'10 kW':'5 kW';
  const nominal=(9.04*count).toLocaleString('nl-NL',{minimumFractionDigits:2,maximumFractionDigits:2});
  const phaseUnknown=$('phase').value==='unknown';
  $('selectionLabel').textContent=(phaseUnknown?'Voorlopige keuze, aansluiting nog controleren · ':'')+phaseName+' · '+inverter+' omvormer · '+nominal+' kWh · '+count+' × BAT-Q9 · back-up inbegrepen';
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
  const attribution=getCampaignAttribution(window);
  const body={
    intent:'quote',
    fullName:String(data.get('fullName')||'').trim(),
    email:String(data.get('email')||'').trim(),
    phone:String(data.get('phone')||'').trim(),
    city:String(data.get('city')||'').trim(),
    postcode:String(data.get('postcode')||'').trim(),
    consent:$('consent').checked,
    website:String(data.get('website')||''),
    profile:{
      solar:String(data.get('solar')||''),
      annualUsage:usage?Number(usage):null,
      goal:String(data.get('goal')||''),
      phase:String(data.get('phase')||''),
      moduleType:9,
      moduleCount:Number(data.get('moduleCount')),
      offerPhase:$('offerPhase').value,
    },
  };
  const details=String(data.get('projectDetails')||'').trim();
  if(details)body.projectDetails=details;
  if(Object.keys(attribution).length)body.attribution=attribution;
  return body;
}
form.addEventListener('input',()=>{if(!submitting){key=null;conversionRef=null;clearError();}});
const preset=new URLSearchParams(location.search);
// Legacy BAT-Q7 and 4-6-module URLs are deliberately not accepted as offers.
// Only anonymous, allowlisted installation-check answers may be prefilled.
let prefilled=false;
for(const [field,allowed] of Object.entries({solar:['yes','planned','no'],phase:['single','three','unknown'],goal:['solar','prices','backup','unsure']})){
  const value=preset.get(field);
  if(value!==null && allowed.includes(value)){$(field).value=value;prefilled=true;}
}
if(preset.get('moduleType')==='9' && /^[1-3]$/.test(preset.get('moduleCount')||'')){
  const count=Number(preset.get('moduleCount'));
  if(count<=2 || $('phase').value==='three')$('moduleCount').value=String(count);
}
if(prefilled)$('check-prefill-note').hidden=false;
$('phase').addEventListener('change',selection);
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
  conversionRef ||= createConversionReference(window);
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
      publishAcceptedLeadSignal('quote', window, conversionRef);
      form.hidden=true;
      $('quoteResult').hidden=false;
      $('quoteResult').scrollIntoView({behavior:'smooth',block:'start'});
      $('quoteResult').setAttribute('tabindex','-1');
      $('quoteResult').focus({preventScroll:true});
      return;
    }
    if(data?.code==='SESSION_EXPIRED')await loadConfig(true);
    if(data?.code==='REQUEST_CHANGED'){key=null;conversionRef=null;}
    error(data?.message||'Je aanvraag kon niet worden opgeslagen. Probeer opnieuw of neem direct contact op.',[429,503].includes(response.status));
  }catch{
    error('We konden de ontvangst niet bevestigen. Probeer het opnieuw met dezelfde gegevens of neem contact met ons op.',true);
  }finally{setBusy(false);}
});
loadConfig().then(ready=>{
  if(ready && !ready.leadEnabled)error('Online aanvragen is tijdelijk niet beschikbaar. Gebruik de contactmogelijkheden hieronder.',true);
});
