// HYXI AURA Beheer: only same-origin, cookie-authenticated API requests.
// Never put contact data in localStorage, query strings or analytics.
const $ = id => document.getElementById(id);
const labels = {
  new:'Nieuw',contact_planned:'Contact gepland',in_progress:'In behandeling',
  quote_requested:'Offerte gevraagd',quote_sent:'Offerte verstuurd',
  won:'Gewonnen',lost:'Verloren',not_suitable:'Niet passend',
  pending:'Wacht op verzending',sending:'Wordt verzonden',accepted:'SMTP geaccepteerd',
  retry_wait:'Wacht op nieuwe poging',failed:'Mislukt',uncertain:'Aflevering onzeker',
};
let csrfToken = null, currentPage = 1, currentLead = null, lastItems = [], previousFocus = null;
let pending = false;

function message(id,text){$(id).textContent=text||'';$(id).hidden=!text;}
function textOr(value){return value===null||value===undefined||value===''?'—':String(value);}
function formatDate(value){
  const date = new Date(value);
  return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('nl-NL',{dateStyle:'medium',timeStyle:'short'}).format(date);
}
function setLoading(button, loading){
  button.disabled=loading;
  button.setAttribute('aria-busy',loading?'true':'false');
}
async function api(path,opts={}){
  const init={credentials:'same-origin',headers:{'Accept':'application/json'},...opts};
  if(opts.method&&opts.method!=='GET'){
    init.headers={...init.headers,'Content-Type':'application/json','X-Aura-CSRF':csrfToken};
  }
  const response=await fetch('/api/beheer'+path,init);
  let result;
  try{result=await response.json();}catch{throw new Error('De server reageert tijdelijk niet.');}
  if(!response.ok||!result.ok){
    if(response.status===401&&path!=='/login')showLogin('Je sessie is verlopen. Log opnieuw in.');
    throw new Error(result.message||'Er is iets misgegaan.');
  }
  return result;
}
async function session(){
  const response=await fetch('/api/beheer/session',{credentials:'same-origin',headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('Beheer is nog niet beschikbaar.');
  const data=await response.json();
  if(!data.ok)throw new Error('Beheer is niet beschikbaar.');
  csrfToken=data.csrfToken;
  return data;
}
function showLogin(text=''){
  $('dashboardView').hidden=true;$('loginView').hidden=false;closeDetail();
  $('leadRows').replaceChildren();lastItems=[];
  for(const id of ['statTotal','statNew','statQuote','statMail'])$(id).textContent='—';
  message('loginError',text);
}
function showDashboard(user){
  $('loginView').hidden=true;$('dashboardView').hidden=false;
  $('currentUser').textContent=user.email||'Beheerder';
  $('currentRole').textContent=user.role==='admin'?'Beheerder':'Sales';
}
async function enterDashboard(user){
  showDashboard(user);
  await refreshAll();
}
function makeCell(text,tag='td'){
  const node=document.createElement(tag);node.textContent=textOr(text);return node;
}
function makeBadge(value){
  const el=document.createElement('span');
  el.className='tag '+(Object.hasOwn(labels,value)?value:'');
  el.textContent=labels[value]||textOr(value);
  return el;
}
async function refreshAll(){
  if(pending)return;
  pending=true;
  try{
    const data=await Promise.all([api('/summary'),loadLeads()]);
    const s=data[0];$('statTotal').textContent=String(s.total);
    $('statNew').textContent=String(s.statuses?.new||0);
    $('statQuote').textContent=String(s.statuses?.quote_requested||0);
    $('statMail').textContent=String((s.notifications?.failed||0)+(s.notifications?.uncertain||0));
    message('dashboardMessage','');
  }catch(error){message('dashboardMessage',error.message);}finally{pending=false;}
}
async function loadLeads(){
  message('listMessage','Aanvragen laden…');
  const params=new URLSearchParams({page:String(currentPage)});
  if($('statusFilter').value)params.set('status',$('statusFilter').value);
  const data=await api('/leads?'+params.toString());
  lastItems=data.items;
  const rows=$('leadRows');rows.replaceChildren();
  for(const lead of lastItems){
    const tr=document.createElement('tr');
    tr.append(makeCell(lead.requestId),makeCell(formatDate(lead.createdAt)));
    const status=makeCell('');status.textContent='';status.append(makeBadge(lead.status));tr.append(status);
    const delivery=makeCell('');delivery.textContent='';delivery.append(makeBadge(lead.deliveryStatus));tr.append(delivery);
    const act=makeCell('');const btn=document.createElement('button');
    btn.type='button';btn.className='open-lead';btn.textContent='Bekijk →';
    btn.setAttribute('aria-label','Bekijk aanvraag '+lead.requestId);
    btn.addEventListener('click',()=>openDetail(lead.requestId));
    act.append(btn);tr.append(act);rows.append(tr);
  }
  message('listMessage',lastItems.length?'':'Er zijn geen aanvragen voor dit filter.');
  $('pageLabel').textContent='Pagina '+currentPage;
  $('prevPage').disabled=currentPage===1;$('nextPage').disabled=lastItems.length<20;
  return data;
}
function fillDetails(container,rows){
  const dl=$(container);dl.replaceChildren();
  for(const [label,value] of rows){
    const dt=document.createElement('dt'),dd=document.createElement('dd');
    dt.textContent=label;dd.textContent=textOr(value);dl.append(dt,dd);
  }
}
function openPane(){
  previousFocus=document.activeElement;
  $('detailPane').hidden=false;$('detailBackdrop').hidden=false;
  document.body.style.overflow='hidden';
  document.querySelector('.workspace').inert=true;
  document.querySelector('.sidebar').inert=true;
  $('closeDetail').focus();
}
function closeDetail(){
  $('detailPane').hidden=true;$('detailBackdrop').hidden=true;
  document.body.style.overflow='';
  document.querySelector('.workspace').inert=false;
  document.querySelector('.sidebar').inert=false;
  for(const name of ['contactFields','profileFields','systemFields'])$(name).replaceChildren();
  $('detailContent').hidden=true;
  currentLead=null;$('detailTitle').textContent='Aanvraag';
  const restore=previousFocus;previousFocus=null;
  if(restore?.isConnected&&!$('dashboardView').hidden)restore.focus();
}
async function openDetail(requestId){
  openPane();$('detailContent').hidden=true;$('detailLoading').hidden=false;
  $('detailLoading').textContent='Aanvraag ophalen…';
  $('detailTitle').textContent=requestId;message('statusMessage','');
  try{
    const data=await api('/leads/'+encodeURIComponent(requestId));
    currentLead=data.lead;
    const r=currentLead,p=r.profile||{},c=r.contact||{},n=r.notification||{};
    fillDetails('contactFields',[
      ['Naam',c.fullName],['E-mail',c.email],['Telefoon',c.phone],['Postcode',c.postcode],
    ]);
    fillDetails('profileFields',[
      ['Zonnepanelen',({yes:'Aanwezig',planned:'Gepland',no:'Niet aanwezig'})[p.solar]],
      ['Jaarverbruik',p.annualUsage===null?'Onbekend':p.annualUsage+' kWh'],
      ['Doel',({solar:'Eigen zonnestroom',prices:'Stroomprijzen',backup:'Back-up',unsure:'Advies'})[p.goal]],
      ['Aansluiting',({single:'1-fase',three:'3-fase',unknown:'Onbekend'})[p.phase]],
      ['Modules',p.moduleCount+' × BAT-Q'+p.moduleType],
    ]);
    fillDetails('systemFields',[
      ['Ontvangen',formatDate(r.createdAt)],['Website',r.source],['Mailstatus',labels[n.status]||n.status],
      ['Pogingen',n.attempts],['Foutcode',n.errorCode],
    ]);
    $('editStatus').value=r.status;
    $('detailLoading').hidden=true;$('detailContent').hidden=false;
  }catch(error){$('detailLoading').textContent=error.message;}
}
$('loginForm').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('loginButton');setLoading(button,true);message('loginError','');
  try{
    const result=await api('/login',{method:'POST',body:JSON.stringify({
      email:$('email').value.trim(),password:$('password').value,code:$('totp').value.trim(),
    })});
    $('password').value='';$('totp').value='';
    const state=await session();
    await enterDashboard(state.user||result.user);
  }catch(error){message('loginError',error.message);}
  finally{setLoading(button,false);}
});
$('logoutButton').addEventListener('click',async()=>{
  try{
    await api('/logout',{method:'POST',body:'{}'});
    $('password').value='';$('totp').value='';
    showLogin();await session();
  }catch(error){
    message('dashboardMessage','Uitloggen is niet bevestigd. Probeer opnieuw of sluit het browservenster.');
  }
});
$('refreshButton').addEventListener('click',refreshAll);
$('statusFilter').addEventListener('change',()=>{currentPage=1;refreshAll();});
$('prevPage').addEventListener('click',()=>{if(currentPage>1){currentPage--;refreshAll();}});
$('nextPage').addEventListener('click',()=>{if(lastItems.length===20){currentPage++;refreshAll();}});
$('closeDetail').addEventListener('click',closeDetail);
$('detailBackdrop').addEventListener('click',closeDetail);
document.addEventListener('keydown',event=>{
  if($('detailPane').hidden)return;
  if(event.key==='Escape'){event.preventDefault();closeDetail();return;}
  if(event.key!=='Tab')return;
  const focusable=[...$('detailPane').querySelectorAll('button:not([disabled]),select:not([disabled]),a[href],input:not([disabled])')].filter(node=>!node.hidden);
  if(!focusable.length)return;
  const first=focusable[0],last=focusable.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
$('statusForm').addEventListener('submit',async event=>{
  event.preventDefault();if(!currentLead)return;
  const button=$('statusForm').querySelector('button[type=submit]');setLoading(button,true);
  message('statusMessage','');
  try{
    const result=await api('/leads/'+encodeURIComponent(currentLead.requestId)+'/status',{
      method:'PATCH',body:JSON.stringify({status:$('editStatus').value}),
    });
    currentLead.status=result.status;
    message('statusMessage',result.changed?'Status bijgewerkt.':'Status was al bijgewerkt.');
    await refreshAll();
  }catch(error){message('statusMessage',error.message);}
  finally{setLoading(button,false);}
});
(async()=>{
  try{
    const s=await session();
    if(s.authenticated)await enterDashboard(s.user);
    else showLogin();
  }catch(error){showLogin(error.message);}
})();
