import express from 'express';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const prefix = '/api/beheer';
const cookieSession = 'aura_beheer_session';
const cookieCsrf = 'aura_beheer_csrf';
const csrfMaxMs = 15 * 60 * 1000;
const sessionMaxMs = 8 * 60 * 60 * 1000;

function fail(res,status,code,message) {
  res.status(status).json({ok:false,code,message});
}
function readCookie(req,name) {
  const header = String(req.headers.cookie || '');
  if(header.length > 8192)return null;
  const part = header.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));
  return part ? part.slice(name.length+1) : null;
}
function equal(a,b) {
  if(typeof a!=='string'||typeof b!=='string')return false;
  const x=Buffer.from(a),y=Buffer.from(b);
  return x.length===y.length&&timingSafeEqual(x,y);
}

export function mountAdminRoutes(app,{adminStore,config,now=Date.now}) {
  // A disabled /beheer never exposes a login surface or personal data.
  if(!adminStore||!config?.adminEnabled){
    app.all('/beheer',(_req,res)=>res.status(404).end());
    app.all('/beheer/*splat',(_req,res)=>res.status(404).end());
    app.all(prefix,(_req,res)=>res.status(404).end());
    app.all(prefix+'/*splat',(_req,res)=>res.status(404).end());
    return;
  }
  const sign = text => createHmac('sha256',config.adminSessionSecret).update('csrf:v1:').update(text).digest('hex');
  const freshToken = () => {
    const body=String(now())+'.'+randomBytes(24).toString('hex');
    return body+'.'+sign(body);
  };
  function validCsrfToken(token) {
    if(typeof token!=='string'||token.length>180)return false;
    const [time,rand,mac,more]=token.split('.');
    if(more||!/^\d{13}$/.test(time||'')||!/^[a-f0-9]{48}$/.test(rand||'')||!/^[a-f0-9]{64}$/.test(mac||''))return false;
    const age=now()-Number(time);
    return age>=0&&age<=csrfMaxMs&&equal(mac,sign(time+'.'+rand));
  }
  function writeCookie(res,name,value,maxAge) {
    res.cookie(name,value,{
      path:prefix,httpOnly:true,secure:config.production,sameSite:'strict',
      maxAge,
    });
  }
  function clearCookie(res,name) {
    res.clearCookie(name,{path:prefix,httpOnly:true,secure:config.production,sameSite:'strict'});
  }
  function csrfOk(req) {
    const origin=req.get('Origin');
    if(!origin||!config.allowedOrigins.has(origin))return false;
    const header=req.get('X-Aura-CSRF');
    const cookie=readCookie(req,cookieCsrf);
    return validCsrfToken(header)&&equal(header,cookie);
  }
  async function userFromRequest(req) {
    return adminStore.currentSession(readCookie(req,cookieSession));
  }
  async function authenticated(req,res,next) {
    try {
      const user=await userFromRequest(req);
      if(!user)return fail(res,401,'LOGIN_REQUIRED','Log opnieuw in om dit te bekijken.');
      req.beheerUser=user;
      next();
    } catch {
      fail(res,503,'AUTH_UNAVAILABLE','Inloggen is tijdelijk niet beschikbaar.');
    }
  }
  function bodyOk(req,res,next) {
    if(!req.is('application/json'))return fail(res,415,'CONTENT_TYPE','Dit verzoek kan niet worden verwerkt.');
    if(!csrfOk(req))return fail(res,403,'INVALID_SESSION','Vernieuw de pagina en probeer opnieuw.');
    next();
  }
  function backendError(res,error) {
    if(error?.code==='NOT_FOUND')return fail(res,404,'NOT_FOUND','Deze aanvraag is niet beschikbaar.');
    if(error?.code==='BAD_STATUS')return fail(res,422,'BAD_STATUS','Kies een geldige status.');
    if(error?.code==='FORBIDDEN')return fail(res,403,'FORBIDDEN','Deze actie is alleen beschikbaar voor beheerders.');
    if(error?.code==='BAD_ASSIGNEE')return fail(res,422,'BAD_ASSIGNEE','Kies een actieve medewerker.');
    if(error?.code==='BAD_FILTER')return fail(res,422,'BAD_FILTER','Kies geldige filters.');
    if(error?.code==='BAD_NOTIFICATION_ACTION')return fail(res,422,'BAD_NOTIFICATION_ACTION','Controleer de ontvangst en bevestig je keuze.');
    if(error?.code==='STATE_CHANGED')return fail(res,409,'STATE_CHANGED','Deze melding is inmiddels gewijzigd. Vernieuw het overzicht.');
    // Never disclose database error text or personal data.
    console.error('HYXI AURA Beheer database operation failed.');
    return fail(res,503,'BACKEND_UNAVAILABLE','Deze actie is tijdelijk niet beschikbaar.');
  }

  app.use('/beheer',(_req,res,next)=>{res.set({'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'});next();});
  app.use(prefix,(_req,res,next)=>{res.set({'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'});next();});
  app.get(['/beheer','/beheer/'],(_req,res)=>{
    res.sendFile(resolve(root,'admin/beheer.html'));
  });
  app.get('/beheer/beheer.css',(_req,res)=>res.type('css').sendFile(resolve(root,'admin/beheer.css')));
  app.get('/beheer/beheer.mjs',(_req,res)=>res.type('js').sendFile(resolve(root,'admin/beheer.mjs')));

  app.get(prefix+'/session',async(req,res)=>{
    const old=readCookie(req,cookieCsrf);
    const token=validCsrfToken(old)?old:freshToken();
    writeCookie(res,cookieCsrf,token,csrfMaxMs);
    try{
      const user=await userFromRequest(req);
      res.json({ok:true,authenticated:Boolean(user),user:user?{email:user.email,role:user.role}:null,csrfToken:token});
    }catch{
      fail(res,503,'AUTH_UNAVAILABLE','Beheer is tijdelijk niet beschikbaar.');
    }
  });

  const json = express.json({limit:'4kb',type:'application/json',strict:true});
  app.post(prefix+'/login',json,bodyOk,async(req,res)=>{
    const body=req.body || {};
    if(typeof body.email!=='string'||typeof body.password!=='string'||typeof body.code!=='string'||
       body.email.length>254||body.password.length>1024||body.code.length!==6){
      return fail(res,401,'INVALID_LOGIN','De inloggegevens zijn niet geldig.');
    }
    try{
      const result=await adminStore.login({
        email:body.email,password:body.password,code:body.code,
        address:req.ip||req.socket.remoteAddress||'unknown',
      });
      if(!result)return fail(res,401,'INVALID_LOGIN','De inloggegevens zijn niet geldig.');
      writeCookie(res,cookieSession,result.token,sessionMaxMs);
      res.json({ok:true,user:{email:result.user.email,role:result.user.role}});
    }catch(error){
      if(error?.code==='RATE_LIMIT'){
        res.set('Retry-After','900');
        return fail(res,429,'RATE_LIMIT','Te veel pogingen. Probeer het later opnieuw.');
      }
      backendError(res,error);
    }
  });

  app.post(prefix+'/logout',json,bodyOk,async(req,res)=>{
    const token=readCookie(req,cookieSession);
    try{
      await adminStore.logout(token);
      clearCookie(res,cookieSession);
      clearCookie(res,cookieCsrf);
      res.json({ok:true});
    }catch(error){ backendError(res,error); }
  });
  app.get(prefix+'/summary',authenticated,async(req,res)=>{
    try {res.json({ok:true,...await adminStore.summary(req.beheerUser)});}
    catch(error){backendError(res,error);}
  });
  function administrator(req,res,next) {
    if(req.beheerUser?.role!=='admin')return fail(res,403,'FORBIDDEN','Deze actie is alleen beschikbaar voor beheerders.');
    next();
  }
  app.get(prefix+'/assignees',authenticated,administrator,async(req,res)=>{
    try{res.json({ok:true,...await adminStore.listAssignees(req.beheerUser)});}
    catch(error){backendError(res,error);}
  });
  app.get(prefix+'/outbox',authenticated,administrator,async(req,res)=>{
    const page=Number(req.query.page||1);
    if(!Number.isSafeInteger(page)||page<1||page>1000)return fail(res,422,'BAD_FILTER','Ongeldige pagina.');
    try{res.json({ok:true,...await adminStore.listNotifications(req.beheerUser,{page})});}
    catch(error){backendError(res,error);}
  });
  app.post(prefix+'/outbox/:id/resolve',authenticated,administrator,json,bodyOk,async(req,res)=>{
    const body=req.body;
    if(!body||Object.keys(body).length!==4||!['retry','confirm_received'].includes(body.action)||
       !['failed','uncertain'].includes(body.expectedStatus)||body.confirmed!==true||
       !Number.isSafeInteger(body.expectedAttempt)||body.expectedAttempt<1){
      return fail(res,422,'BAD_NOTIFICATION_ACTION','Controleer de ontvangst en bevestig je keuze.');
    }
    try{res.json({ok:true,...await adminStore.resolveNotification(req.beheerUser,req.params.id,body)});}
    catch(error){backendError(res,error);}
  });
  app.get(prefix+'/leads',authenticated,async(req,res)=>{
    const page=Number(req.query.page||1),status=String(req.query.status||'');
    if(!Number.isSafeInteger(page)||page<1||page>100||status.length>40)return fail(res,422,'BAD_FILTER','Ongeldige filters.');
    try{res.json({ok:true,...await adminStore.listLeads(req.beheerUser,{status,page})});}
    catch(error){backendError(res,error);}
  });
  app.get(prefix+'/leads/:requestId',authenticated,async(req,res)=>{
    try{res.json({ok:true,lead:await adminStore.getLead(req.beheerUser,req.params.requestId)});}
    catch(error){backendError(res,error);}
  });
  app.patch(prefix+'/leads/:requestId/status',authenticated,json,bodyOk,async(req,res)=>{
    if(!req.body||Object.keys(req.body).length!==1||typeof req.body.status!=='string'){
      return fail(res,422,'BAD_STATUS','Kies een geldige status.');
    }
    try{res.json({ok:true,...await adminStore.changeStatus(req.beheerUser,req.params.requestId,req.body.status)});}
    catch(error){backendError(res,error);}
  });
  app.patch(prefix+'/leads/:requestId/assignee',authenticated,administrator,json,bodyOk,async(req,res)=>{
    const body=req.body;
    if(!body||Object.keys(body).length!==1||!Object.hasOwn(body,'userId')||
       (body.userId!==null&&typeof body.userId!=='string')){
      return fail(res,422,'BAD_ASSIGNEE','Kies een actieve medewerker.');
    }
    try{res.json({ok:true,...await adminStore.assignLead(req.beheerUser,req.params.requestId,body.userId)});}
    catch(error){backendError(res,error);}
  });
  app.all(prefix+'/*splat',(_req,res)=>fail(res,404,'NOT_FOUND','Niet gevonden.'));
}
