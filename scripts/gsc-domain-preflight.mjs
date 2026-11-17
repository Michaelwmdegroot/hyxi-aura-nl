/**
 * HYXI AURA — public, read-only indexing and host preflight.
 *
 * Checks the canonical production website and possible alternative public
 * hosts from GitHub Actions, which has external DNS/HTTPS connectivity.
 * This does NOT log in to Search Console, submit URLs, mutate DNS, send
 * form submissions or access client/lead data.
 */
import { appendFile } from 'node:fs/promises';

const CANONICAL = 'https://hyxi-aura.nl';
const EXPECTED_URLS = 13;
const checks = [
  { id: 'Canonical homepage', url: CANONICAL + '/', method: 'HEAD', required: true },
  { id: 'Sitemap XML', url: CANONICAL + '/sitemap.xml', method: 'GET', required: true },
  { id: 'Robots TXT', url: CANONICAL + '/robots.txt', method: 'GET', required: true },
  { id: 'Canonical index.html alias', url: CANONICAL + '/index.html', method: 'HEAD', required: true },
  { id: 'HTTP to HTTPS', url: 'http://hyxi-aura.nl/', method: 'HEAD', required: false },
  { id: 'WWW canonical', url: 'https://www.hyxi-aura.nl/', method: 'HEAD', required: false },
  { id: 'Alias hyxiaura.nl', url: 'https://hyxiaura.nl/', method: 'HEAD', required: false },
  { id: 'Alias hyxi-aura.com', url: 'https://hyxi-aura.com/', method: 'HEAD', required: false },
  { id: 'Alias hyxiaura.com', url: 'https://hyxiaura.com/', method: 'HEAD', required: false },
];
const positiveRedirect = code => [301, 308].includes(code);

async function inspect(check) {
  const report = { id:check.id, url:check.url, required:check.required, status:null, location:null, result:'not-run' };
  try {
    const response=await fetch(check.url,{
      method: check.method,
      redirect: 'manual',
      headers: {Accept: 'text/html, application/xml, text/plain, */*', 'Cache-Control': 'no-cache'},
      signal: AbortSignal.timeout(15000),
    });
    report.status=response.status;
    report.location=response.headers.get('location') ? new URL(response.headers.get('location'),check.url).href : null;
    const isCanonical=check.url===CANONICAL+'/';
    const isSitemap=check.id==='Sitemap XML';
    const isRobots=check.id==='Robots TXT';
    const isIndex=check.id==='Canonical index.html alias';
    if(isCanonical) report.result=response.status===200 ? 'PASS' : 'FAIL';
    else if(isSitemap){
      const content=await response.text();
      const urls=[...content.matchAll(/<loc>\s*(https?:\/\/[^<]+)<\/loc>/g)].map(x=>x[1]);
      const noDuplicates=new Set(urls).size===urls.length;
      const canonicalOnly=urls.every(x=>x.startsWith(CANONICAL+'/'));
      report.urlCount=urls.length;
      report.result=response.status===200 && urls.length===EXPECTED_URLS && noDuplicates && canonicalOnly ? 'PASS' : 'FAIL';
    }else if(isRobots){
      const content=await response.text();
      report.result=response.status===200 && content.includes('Sitemap: '+CANONICAL+'/sitemap.xml') && !/Disallow:\s*\//.test(content.replace('Disallow: /api/','')) ? 'PASS' : 'FAIL';
    }else if(isIndex){
      report.result=response.status===308 && report.location===CANONICAL+'/' ? 'PASS' : 'FAIL';
    }else if(positiveRedirect(response.status)){
      report.result=report.location?.startsWith(CANONICAL+'/') ? 'CANONICAL_REDIRECT' : 'OTHER_REDIRECT';
    }else if(response.status===200) {
      report.result='200_NOT_REDIRECTED';
    }else{
      report.result='NOT_CANONICAL_OR_UNAVAILABLE';
    }
  } catch(error) {
    report.result='UNREACHABLE';
    report.errorCode=String(error?.cause?.code||error?.name||'UNKNOWN').slice(0,80);
  }
  return report;
}

const results=await Promise.all(checks.map(inspect));
let fail=false, warnings=0;
console.log('HYXI AURA — public pre-indexing canonical, DNS and alternative-host snapshot');
for(const r of results){
  const status=r.status??r.errorCode??'none';
  const loc=r.location? ' → '+r.location:'';
  console.log((r.required ? 'REQUIRED ' : 'OPTIONAL ')+r.id+': '+r.result+' ('+status+')'+loc);
  if(r.required && r.result!=='PASS')fail=true;
  if(!r.required && r.result!=='CANONICAL_REDIRECT')warnings++;
}
console.log('RESULT required='+(fail?'NO_GO':'GO')+', optional_host_review='+warnings+', external indexing status NOT VERIFIED. GSC property/URL inspections require account ownership.');

if(process.env.GITHUB_STEP_SUMMARY){
  const cells=results.map(r=>'| '+r.id+' | '+(r.required?'Required':'Optional')+' | '+(r.status??r.errorCode??'-')+' | '+r.result+' | '+(r.location??'-')+' |').join('\n');
  const text='## HYXI AURA — publieke domeincontrole\n\n| Endpoint | Gate | HTTP / fout | Status | Redirect |\n|---|---|---|---|---|\n'+cells+'\n\n**Required:** '+(fail?'NO GO':'GO')+'. **Belangrijk:** dit is geen Google Search Console-verificatie of bewijs van indexatie. Niet-bereikbare optionele domeinen zijn niet automatisch fout; DNS/ownership moet apart worden bevestigd.\n';
  await appendFile(process.env.GITHUB_STEP_SUMMARY,text);
}
if(fail)process.exitCode=1;
