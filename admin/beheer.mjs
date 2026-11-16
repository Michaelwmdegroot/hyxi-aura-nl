// HYXI AURA Beheer: only same-origin, cookie-authenticated API requests.
// Never put contact data in localStorage, query strings or analytics.
const $ = id => document.getElementById(id);
const labels = {
  new:'Nieuw',contact_planned:'Contact gepland',in_progress:'In behandeling',
  quote_requested:'Offerte gevraagd',quote_sent:'Offerte verstuurd',
  won:'Gewonnen',lost:'Verloren',not_suitable:'Niet passend',
  pending:'Wacht op verzending',sending:'Wordt verzonden',accepted:'SMTP geaccepteerd',
  retry_wait:'Wacht op nieuwe poging',failed:'Mislukt',uncertain:'Aflevering onzeker',
  confirmed:'Ontvangst bevestigd',
};
let csrfToken = null, currentPage = 1, currentLead = null, lastItems = [], previousFocus = null;
let currentUser = null, viewVersion = 0, detailVersion = 0, refreshVersion = 0;
let outboxPage = 1, currentNotification = null, activeView = 'leads', currentSearch = '';
const requests = new Set();

function interrupted(){return new DOMException('Dit verzoek is niet meer actueel.','AbortError');}
function isInterrupted(error){return error?.name==='AbortError';}
function clearRequests(){
  viewVersion++;
  refreshVersion++;
  for(const controller of requests)controller.abort();
  requests.clear();
}

function message(id,text){$(id).textContent=text||'';$(id).hidden=!text;}
function textOr(value){return value===null||value===undefined||value===''?'—':String(value);}
function formatDate(value){
  if(!value)return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('nl-NL',{dateStyle:'medium',timeStyle:'short'}).format(date);
}
function setLoading(button, loading){
  button.disabled=loading;
  button.setAttribute('aria-busy',loading?'true':'false');
}
async function api(path,opts={}){
  const version=viewVersion;
  // Sessions last eight hours, while the CSRF cookie is valid for fifteen
  // minutes. Refresh before a mutation, including login and logout.
  if(opts.method&&opts.method!=='GET'){
    const state=await session();
    if(version!==viewVersion)throw interrupted();
    if(path!=='/login'&&path!=='/logout'&&!state.authenticated){
      showLogin('Je sessie is verlopen. Log opnieuw in.');
      throw interrupted();
    }
  }
  const init={credentials:'same-origin',headers:{'Accept':'application/json'},...opts};
  if(opts.method&&opts.method!=='GET'){
    init.headers={...init.headers,'Content-Type':'application/json','X-Aura-CSRF':csrfToken};
  }
  const {response,result}=await request('/api/beheer'+path,init,version);
  if(!response.ok||!result.ok){
    if(response.status===401&&path!=='/login'){
      showLogin('Je sessie is verlopen. Log opnieuw in.');
      throw interrupted();
    }
    const error=new Error(result.message||'Er is iets misgegaan.');
    error.code=result.code;throw error;
  }
  return result;
}
async function request(path,init={},version=viewVersion){
  const controller=new AbortController();requests.add(controller);
  try{
    const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...init,signal:controller.signal});
    let result;
    try{result=await response.json();}catch(error){
      if(isInterrupted(error))throw error;
      throw new Error('De server reageert tijdelijk niet.');
    }
    if(version!==viewVersion)throw interrupted();
    return {response,result};
  }finally{requests.delete(controller);}
}
async function session(){
  const {response,result:data}=await request('/api/beheer/session',{headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('Beheer is nog niet beschikbaar.');
  if(!data.ok)throw new Error('Beheer is niet beschikbaar.');
  csrfToken=data.csrfToken;
  return data;
}
function showLogin(text=''){
  clearRequests();csrfToken=null;currentUser=null;currentPage=1;
  $('dashboardView').hidden=true;$('loginView').hidden=false;closeDetail();
  closeMailReview();outboxPage=1;setView('leads');
  $('leadRows').replaceChildren();lastItems=[];
  $('outboxItems').replaceChildren();$('mailCount').textContent='0';
  $('dueItems').replaceChildren();$('dueCount').textContent='0';$('dueCount').hidden=true;
  $('dueSummary').textContent='';$('dueLimitWarning').hidden=true;
  $('workbenchViews').hidden=true;
  $('currentUser').textContent='Beheerder';$('currentRole').textContent='Beheer';
  $('password').value='';$('statusFilter').value='';$('requestSearch').value='';currentSearch='';
  $('pageLabel').textContent='Pagina 1';
  $('outboxPageLabel').textContent='Pagina 1';
  message('dashboardMessage','');message('listMessage','');
  message('outboxMessage','');setLoading($('refreshButton'),false);
  for(const id of ['statTotal','statNew','statQuote','statMail'])$(id).textContent='—';
  message('loginError',text);
  if(text)$('email').focus();
}
function showDashboard(user){
  currentUser=user;
  $('loginView').hidden=true;$('dashboardView').hidden=false;
  $('currentUser').textContent=user.email||'Beheerder';
  $('currentRole').textContent=user.role==='admin'?'Beheerder':'Sales';
  $('workbenchViews').hidden=false;
  $('outboxTab').hidden=user.role!=='admin';
  if(user.role!=='admin')setView('leads');
}
function setView(name){
  activeView=name==='outbox'&&currentUser?.role==='admin'?'outbox':name==='followups'?'followups':'leads';
  $('leadsPanel').hidden=activeView!=='leads';
  $('followupsPanel').hidden=activeView!=='followups';
  $('outboxPanel').hidden=activeView!=='outbox';
  $('leadsTab').setAttribute('aria-pressed',String(activeView==='leads'));
  $('followupsTab').setAttribute('aria-pressed',String(activeView==='followups'));
  $('outboxTab').setAttribute('aria-pressed',String(activeView==='outbox'));
  $('dashboardTitle').textContent=activeView==='outbox'?'Mailcontrole':activeView==='followups'?'Vervolgacties':'Aanvragen';
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
  const version=++refreshVersion;
  setLoading($('refreshButton'),true);
  try{
    const data=await Promise.all([api('/summary'),loadLeads(version),
      currentUser?.role==='admin'?loadNotifications(version):Promise.resolve(),
      activeView==='followups'?loadDueFollowups(version):Promise.resolve(),
    ]);
    if(version!==refreshVersion||!currentUser)return;
    const s=data[0];$('statTotal').textContent=String(s.total);
    $('statNew').textContent=String(s.statuses?.new||0);
    $('statQuote').textContent=String(s.statuses?.quote_requested||0);
    $('statMail').textContent=String((s.notifications?.failed||0)+(s.notifications?.uncertain||0));
    message('dashboardMessage','');
  }catch(error){if(!isInterrupted(error)&&version===refreshVersion)message('dashboardMessage',error.message);}
  finally{if(version===refreshVersion)setLoading($('refreshButton'),false);}
}
async function loadLeads(version=refreshVersion){
  message('listMessage','Aanvragen laden…');
  const params=new URLSearchParams({page:String(currentPage)});
  if($('statusFilter').value)params.set('status',$('statusFilter').value);
  if(currentSearch)params.set('search',currentSearch);
  const data=await api('/leads?'+params.toString());
  if(version!==refreshVersion||!currentUser)return data;
  lastItems=data.items;
  const rows=$('leadRows');rows.replaceChildren();
  for(const lead of lastItems){
    const tr=document.createElement('tr');
    const refCell=makeCell(lead.requestId);
    if(lead.requestType==='quote'){
      const kind=document.createElement('small');kind.className='request-kind';kind.textContent=' · Offerte';refCell.append(kind);
    }
    tr.append(refCell,makeCell(formatDate(lead.createdAt)));
    const status=makeCell('');status.textContent='';status.append(makeBadge(lead.status));tr.append(status);
    const delivery=makeCell('');delivery.textContent='';delivery.append(makeBadge(lead.deliveryStatus));tr.append(delivery);
    const act=makeCell('');act.textContent='';const btn=document.createElement('button');
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
function formatDueDate(value){
  if(!/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(value||''))return 'Geen datum';
  return new Intl.DateTimeFormat('nl-NL',{timeZone:'UTC',day:'numeric',month:'short',year:'numeric'})
    .format(new Date(value+'T00:00:00Z'));
}
async function loadDueFollowups(version=refreshVersion){
  $('dueSummary').textContent='Vervolgacties laden…';
  const data=await api('/followups');
  if(version!==refreshVersion||!currentUser||activeView!=='followups')return data;
  $('dueItems').replaceChildren();
  const count=data.overdue+data.todayCount;
  $('dueCount').textContent=String(count);
  $('dueCount').hidden=count===0;
  const totals=data.overdue+' verlopen · '+data.todayCount+' voor vandaag';
  $('dueSummary').textContent=count?totals:'Geen vervolgacties die vandaag of eerder gepland staan.';
  $('dueLimitWarning').hidden=!data.limited;
  for(const item of data.items){
    const article=document.createElement('article');article.className='due-item';
    const content=document.createElement('div');content.className='due-copy';
    const head=document.createElement('div');head.className='due-item-head';
    const status=document.createElement('span');
    status.className='tag '+(item.priority==='overdue'?'failed':'contact_planned');
    status.textContent=item.priority==='overdue'?'Verlopen':'Vandaag';
    const time=document.createElement('time');
    time.dateTime=item.dueDate;time.textContent=formatDueDate(item.dueDate);
    head.append(status,time);
    const title=document.createElement('strong');title.className='due-item-id';title.textContent=item.requestId;
    const action=document.createElement('p');
    action.textContent=item.nextAction||'Vervolgactie zonder omschrijving';
    content.append(head,title,action);
    const open=document.createElement('button');open.className='secondary small due-open';open.type='button';
    open.textContent='Open dossier';open.setAttribute('aria-label','Bekijk vervolgactie '+item.requestId);
    open.addEventListener('click',()=>openDetail(item.requestId));
    article.append(content,open);$('dueItems').append(article);
  }
  if(count>data.items.length){
    const extra=document.createElement('p');extra.className='due-warning';
    extra.textContent='Toont de eerste '+data.items.length+' van '+count+' acties; voor de volledige werkvoorraad is een geïndexeerd overzicht nodig.';
    $('dueItems').append(extra);
  }
  return data;
}

async function loadNotifications(version=refreshVersion){
  message('outboxMessage','Mailnotificaties laden…');
  const data=await api('/outbox?page='+outboxPage);
  if(version!==refreshVersion||currentUser?.role!=='admin')return;
  $('outboxItems').replaceChildren();
  $('mailCount').textContent=String(data.total);
  for(const item of data.items){
    const card=document.createElement('article');card.className='outbox-item';
    const text=document.createElement('div'),heading=document.createElement('h3');
    heading.textContent=item.requestId;
    const state=document.createElement('div');state.className='outbox-state';
    const attempts=document.createElement('small');attempts.textContent=String(item.attempts)+' verzendpoging(en)';
    state.append(makeBadge(item.status),attempts);
    const time=document.createElement('p');time.textContent='Bijgewerkt '+formatDate(item.updatedAt);
    if(item.errorCode)time.textContent+=' · '+item.errorCode;
    text.append(heading,state,time);
    const button=document.createElement('button');button.type='button';button.className='secondary small review-mail';
    button.textContent='Controleer melding →';button.setAttribute('aria-label','Controleer melding voor '+item.requestId);
    button.addEventListener('click',()=>openMailReview(item));
    card.append(text,button);$('outboxItems').append(card);
  }
  message('outboxMessage',data.items.length?'':'Er staan geen mailnotificaties klaar voor controle.');
  $('outboxPageLabel').textContent='Pagina '+outboxPage+' · '+data.total+' melding(en)';
  $('outboxPrev').disabled=outboxPage===1;$('outboxNext').disabled=outboxPage*20>=data.total;
}
function openMailReview(item){
  currentNotification=item;$('mailReviewForm').reset();
  message('mailReviewMessage','');$('retryExplanation').hidden=true;
  $('resolveConfirmationText').textContent='Ik heb de ontvangende mailbox gecontroleerd.';
  setLoading($('resolveButton'),false);
  fillDetails('mailReviewFields',[
    ['Aanvraag',item.requestId],['Status',labels[item.status]],['Bericht-ID',item.mailMessageId],
  ]);
  $('mailDialog').showModal();$('closeMailDialog').focus();
}
function closeMailReview(){
  if($('mailDialog').open)$('mailDialog').close();
  currentNotification=null;$('mailReviewFields').replaceChildren();
  $('mailReviewForm').reset();message('mailReviewMessage','');
}
function fillDetails(container,rows){
  const dl=$(container);dl.replaceChildren();
  for(const [label,value] of rows){
    const dt=document.createElement('dt'),dd=document.createElement('dd');
    dt.textContent=label;dd.textContent=textOr(value);dl.append(dt,dd);
  }
}
function renderFollowup(value){
  const followup=value||{};
  $('nextAction').value=followup.nextAction||'';
  $('followupDate').value=followup.dueDate||'';
  const notes=$('followupNotes');notes.replaceChildren();
  const entries=Array.isArray(followup.notes)?followup.notes:[];
  for(const entry of entries.slice(-10).reverse()){
    const article=document.createElement('article');
    article.className='followup-note';
    const time=document.createElement('time');
    time.textContent=formatDate(entry.createdAt);time.dateTime=entry.createdAt||'';
    const content=document.createElement('p');
    content.textContent=entry.text||'';
    article.append(time,content);notes.append(article);
  }
  if(entries.length>10){
    const extra=document.createElement('p');extra.className='followup-hint';
    extra.textContent=(entries.length-10)+' oudere notities zijn niet in dit overzicht getoond.';
    notes.append(extra);
  }
}
function openPane(){
  previousFocus=document.activeElement;
  $('detailPane').hidden=false;$('detailBackdrop').hidden=false;
  $('detailPane').scrollTop=0;
  document.body.style.overflow='hidden';
  document.querySelector('.workspace').inert=true;
  document.querySelector('.sidebar').inert=true;
  $('closeDetail').focus();
}
function closeDetail(){
  detailVersion++;
  $('detailPane').hidden=true;$('detailBackdrop').hidden=true;
  document.body.style.overflow='';
  document.querySelector('.workspace').inert=false;
  document.querySelector('.sidebar').inert=false;
  for(const name of ['contactFields','profileFields','systemFields'])$(name).replaceChildren();
  $('detailContent').hidden=true;
  $('detailLoading').textContent='';message('statusMessage','');
  $('assignmentForm').hidden=true;$('assignee').replaceChildren();message('assignmentMessage','');
  $('editStatus').value='new';
  $('nextAction').value='';$('followupDate').value='';$('followupNote').value='';
  $('followupNotes').replaceChildren();message('followupMessage','');
  $('privacySection').hidden=true;$('privacyDeleteDetails').open=false;
  $('privacyDeleteForm').reset();message('privacyExportMessage','');message('privacyDeleteMessage','');
  currentLead=null;$('detailTitle').textContent='Aanvraag';
  const restore=previousFocus;previousFocus=null;
  if(!$('dashboardView').hidden){
    if(restore?.isConnected)restore.focus();
    else (document.querySelector('.open-lead')||$('refreshButton')).focus();
  }
}
async function openDetail(requestId){
  const version=++detailVersion;
  openPane();$('detailContent').hidden=true;$('detailLoading').hidden=false;
  $('detailLoading').textContent='Aanvraag ophalen…';
  $('detailTitle').textContent=requestId;message('statusMessage','');
  try{
    const [data,assignees]=await Promise.all([
      api('/leads/'+encodeURIComponent(requestId)),
      currentUser?.role==='admin'?api('/assignees'):Promise.resolve(null),
    ]);
    if(version!==detailVersion||$('detailPane').hidden||!currentUser)return;
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
      ['Aanvraagtype',r.requestType==='quote'?'Offerteaanvraag':'Adviesaanvraag'],
      ['Aanvullende wensen',r.projectDetails||'Niet opgegeven'],
    ]);
    fillDetails('systemFields',[
      ['Ontvangen',formatDate(r.createdAt)],['Website',r.source],['Mailstatus',labels[n.status]||n.status],
      ['Pogingen',n.attempts],['Foutcode',n.errorCode],
    ]);
    $('editStatus').value=r.status;
    renderFollowup(r.followUp);
    $('privacySection').hidden=currentUser?.role!=='admin';
    $('assignmentForm').hidden=!assignees;
    $('assignee').replaceChildren();message('assignmentMessage','');
    if(assignees){
      const nobody=document.createElement('option');nobody.value='';nobody.textContent='Nog niet toegewezen';$('assignee').append(nobody);
      for(const user of assignees.items){
        const option=document.createElement('option');option.value=user.id;
        option.textContent=user.email+' · '+(user.role==='admin'?'Beheerder':'Sales');$('assignee').append(option);
      }
      if(r.assignedTo&&!assignees.items.some(user=>user.id===r.assignedTo)){
        const inactive=document.createElement('option');inactive.value=r.assignedTo;
        inactive.textContent='Huidige medewerker (niet actief)';inactive.disabled=true;$('assignee').append(inactive);
      }
      $('assignee').value=r.assignedTo||'';
    }
    $('detailLoading').hidden=true;$('detailContent').hidden=false;
  }catch(error){if(!isInterrupted(error)&&version===detailVersion)$('detailLoading').textContent=error.message;}
}
$('loginForm').addEventListener('submit',async event=>{
  event.preventDefault();const button=$('loginButton');setLoading(button,true);message('loginError','');
  try{
    const result=await api('/login',{method:'POST',body:JSON.stringify({
      email:$('email').value.trim(),password:$('password').value,
    })});
    $('password').value='';
    const state=await session();
    await enterDashboard(state.user||result.user);
  }catch(error){if(!isInterrupted(error))message('loginError',error.message);}
  finally{setLoading(button,false);}
});
$('logoutButton').addEventListener('click',async()=>{
  const button=$('logoutButton');setLoading(button,true);
  try{
    await api('/logout',{method:'POST',body:'{}'});
    showLogin();$('email').focus();
  }catch(error){
    if(!isInterrupted(error))message('dashboardMessage','Uitloggen is niet bevestigd. Probeer opnieuw of sluit het browservenster.');
  }finally{setLoading(button,false);}
});
$('refreshButton').addEventListener('click',refreshAll);
$('leadsTab').addEventListener('click',()=>setView('leads'));
$('followupsTab').addEventListener('click',()=>{setView('followups');refreshAll();});
$('outboxTab').addEventListener('click',()=>setView('outbox'));
$('outboxPrev').addEventListener('click',()=>{if(outboxPage>1){outboxPage--;refreshAll();}});
$('outboxNext').addEventListener('click',()=>{outboxPage++;refreshAll();});
$('closeMailDialog').addEventListener('click',closeMailReview);
$('mailDialog').addEventListener('cancel',event=>{event.preventDefault();closeMailReview();});
$('resolveAction').addEventListener('change',()=>{
  const retry=$('resolveAction').value==='retry';$('resolveConfirmed').checked=false;
  $('retryExplanation').hidden=!retry;
  $('resolveConfirmationText').textContent=retry
    ?'Ik heb gecontroleerd dat deze notificatie niet is ontvangen en wil opnieuw laten verzenden.'
    :'Ik heb deze notificatie in de ontvangende mailbox teruggevonden.';
});
$('mailReviewForm').addEventListener('submit',async event=>{
  event.preventDefault();const item=currentNotification;
  if(!item||!$('resolveAction').value||!$('resolveConfirmed').checked)return;
  const button=$('resolveButton');setLoading(button,true);message('mailReviewMessage','');
  let stateChanged=false;
  try{
    await api('/outbox/'+encodeURIComponent(item.id)+'/resolve',{method:'POST',body:JSON.stringify({
      action:$('resolveAction').value,expectedStatus:item.status,expectedAttempt:item.attempts,confirmed:true,
    })});
    if(currentNotification===item)closeMailReview();
    await refreshAll();
    if(currentUser)message('dashboardMessage','De mailcontrole is opgeslagen.');
  }catch(error){
    if(!isInterrupted(error)&&currentNotification===item){
      message('mailReviewMessage',error.message);
      if(error.code==='STATE_CHANGED'){
        stateChanged=true;$('resolveConfirmed').checked=false;
        message('mailReviewMessage','Deze melding is inmiddels gewijzigd. Sluit dit venster en vernieuw het overzicht.');
      }
    }
  }finally{setLoading(button,false);if(stateChanged)button.disabled=true;}
});
$('statusFilter').addEventListener('change',()=>{currentPage=1;refreshAll();});
$('requestSearchForm').addEventListener('submit',event=>{
  event.preventDefault();currentSearch=$('requestSearch').value.trim();
  currentPage=1;refreshAll();
});
$('requestSearch').addEventListener('search',()=>{
  if($('requestSearch').value===''){currentSearch='';currentPage=1;refreshAll();}
});
$('prevPage').addEventListener('click',()=>{if(currentPage>1){currentPage--;refreshAll();}});
$('nextPage').addEventListener('click',()=>{if(lastItems.length===20){currentPage++;refreshAll();}});
$('closeDetail').addEventListener('click',closeDetail);
$('detailBackdrop').addEventListener('click',closeDetail);
document.addEventListener('keydown',event=>{
  if($('detailPane').hidden)return;
  if(event.key==='Escape'){event.preventDefault();closeDetail();return;}
  if(event.key!=='Tab')return;
  const focusable=[...$('detailPane').querySelectorAll('button:not([disabled]),select:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),summary')].filter(node=>node.getClientRects().length>0);
  if(!focusable.length)return;
  const first=focusable[0],last=focusable.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
$('privacyExportButton').addEventListener('click',async()=>{
  const lead=currentLead,version=detailVersion;
  if(!lead||currentUser?.role!=='admin')return;
  const button=$('privacyExportButton');
  setLoading(button,true);message('privacyExportMessage','');
  try{
    const data=await api('/leads/'+encodeURIComponent(lead.requestId)+'/privacy-export',{
      method:'POST',body:'{}',
    });
    if(version!==detailVersion||currentLead!==lead)return;
    // Sensitive JSON stays in this authenticated browser; no analytics/storage/URL parameters.
    const file=new Blob([JSON.stringify(data.dossier,null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(file);
    const link=document.createElement('a');
    link.href=url;link.download=lead.requestId+'-privacy.json';
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    message('privacyExportMessage','Export aangemaakt. Bewaar veilig en controleer interne notities voordat je informatie deelt.');
  }catch(error){
    if(!isInterrupted(error)&&version===detailVersion)message('privacyExportMessage',error.message);
  }finally{setLoading(button,false);}
});
$('privacyDeleteForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const lead=currentLead,version=detailVersion;
  if(!lead||currentUser?.role!=='admin')return;
  const requestId=$('privacyDeleteId').value.trim();
  if(requestId!==lead.requestId){
    message('privacyDeleteMessage','Het aanvraagnummer moet exact overeenkomen.');return;
  }
  const button=$('privacyDeleteButton');
  setLoading(button,true);message('privacyDeleteMessage','');
  try{
    const result=await api('/leads/'+encodeURIComponent(lead.requestId)+'/privacy-delete',{
      method:'POST',body:JSON.stringify({
        reason:$('privacyDeleteReason').value,confirmedRequestId:requestId,
        legalReviewConfirmed:$('privacyLegalReview').checked,
        acknowledgedExternalCopies:$('privacyExternalCopies').checked,
      }),
    });
    if(!result.deleted||version!==detailVersion||currentLead!==lead)return;
    closeDetail();
    await refreshAll();
    if(currentUser)message('dashboardMessage','Het dossier is uit de HYXI-database verwijderd. Controleer mailbox- en Odoo-kopieën afzonderlijk.');
  }catch(error){
    if(!isInterrupted(error)&&version===detailVersion)message('privacyDeleteMessage',error.message);
  }finally{setLoading(button,false);}
});
$('statusForm').addEventListener('submit',async event=>{
  event.preventDefault();if(!currentLead)return;
  const lead=currentLead,version=detailVersion;
  const button=$('statusForm').querySelector('button[type=submit]');setLoading(button,true);
  message('statusMessage','');
  try{
    const result=await api('/leads/'+encodeURIComponent(lead.requestId)+'/status',{
      method:'PATCH',body:JSON.stringify({status:$('editStatus').value}),
    });
    if(version===detailVersion&&currentLead===lead){
      currentLead.status=result.status;
      message('statusMessage',result.changed?'Status bijgewerkt.':'Status was al bijgewerkt.');
    }
    await refreshAll();
  }catch(error){if(!isInterrupted(error)&&version===detailVersion)message('statusMessage',error.message);}
  finally{setLoading(button,false);}
});
$('followupForm').addEventListener('submit',async event=>{
  event.preventDefault();if(!currentLead)return;
  const lead=currentLead,version=detailVersion;
  const button=$('followupForm').querySelector('button[type=submit]');
  setLoading(button,true);message('followupMessage','');
  try{
    const nextAction=$('nextAction').value.trim();
    const dueDate=$('followupDate').value||null;
    const note=$('followupNote').value.trim();
    const result=await api('/leads/'+encodeURIComponent(lead.requestId)+'/followup',{
      method:'PATCH',body:JSON.stringify({nextAction,dueDate,note}),
    });
    if(version===detailVersion&&currentLead===lead){
      lead.followUp=result.followUp;
      $('followupNote').value='';
      renderFollowup(result.followUp);
      message('followupMessage',result.changed?'Opvolging opgeslagen.':'Geen wijzigingen.');
    }
  }catch(error){if(!isInterrupted(error)&&version===detailVersion)message('followupMessage',error.message);}
  finally{setLoading(button,false);}
});
$('assignmentForm').addEventListener('submit',async event=>{
  event.preventDefault();if(!currentLead||currentUser?.role!=='admin')return;
  const lead=currentLead,version=detailVersion;
  const button=$('assignmentForm').querySelector('button[type=submit]');setLoading(button,true);
  message('assignmentMessage','');
  try{
    const result=await api('/leads/'+encodeURIComponent(lead.requestId)+'/assignee',{
      method:'PATCH',body:JSON.stringify({userId:$('assignee').value||null}),
    });
    if(version===detailVersion&&currentLead===lead){
      lead.assignedTo=result.assignedTo;
      message('assignmentMessage',result.changed?'Toewijzing bijgewerkt.':'Toewijzing was al bijgewerkt.');
    }
    await refreshAll();
  }catch(error){if(!isInterrupted(error)&&version===detailVersion)message('assignmentMessage',error.message);}
  finally{setLoading(button,false);}
});
(async()=>{
  try{
    const s=await session();
    if(s.authenticated)await enterDashboard(s.user);
    else showLogin();
  }catch(error){showLogin(error.message);}
})();
