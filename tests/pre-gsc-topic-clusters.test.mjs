import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PUBLIC_CANONICAL_PATHS } from '../server/app.mjs';

const origin = 'https://hyxi-aura.nl';
const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const urls = [
  '/', '/modellen/', '/datasheet/', '/kennis/prijs-en-installatie/',
  '/kennis/bestaande-zonnepanelen/', '/kennis/garantie/', '/bronnen/',
  '/offerte/', '/kennis/bat-q7-vs-bat-q9/', '/kennis/noodstroom/',
  '/kennis/installatiecheck/', '/kennis/1-fase-of-3-fasen/',
  '/kennis/salderingsregeling-2027/', '/kennis/btw-subsidie/', '/kennis/dynamisch-energiecontract/', '/kennis/uitbreiden/', '/kennis/buiten-plaatsen/', '/privacy/'
];
const topics = urls.slice(1,6);
const readRoute = async url => readFile(resolve(dist, '.' + url, 'index.html'), 'utf8');
const strip = html => html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ')
  .replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|mdash);/g,' ')
  .replace(/\s+/g,' ').trim();
const structured = html => [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .flatMap(match => {const obj=JSON.parse(match[1]);return obj['@graph']||[obj]});
const titleOf = html => html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
const descriptionOf = html => html.match(/<meta name="description" content="([^"]+)"/)?.[1];

test('all eighteen canonical public URLs are unique and configured as separate build entries',async()=>{
  const [sitemap,vite] = await Promise.all([
    readFile(resolve(dist,'sitemap.xml'),'utf8'),
    readFile(resolve(root,'vite.config.mjs'),'utf8')
  ]);
  const urlsInMap=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
  assert.equal(urlsInMap.length,18);
  assert.deepEqual(new Set(urlsInMap),new Set(urls.map(x=>origin+x)));
  assert.equal(new Set(urlsInMap).size,18);
  assert.deepEqual(new Set(PUBLIC_CANONICAL_PATHS),new Set(urls),'Express 308 alias redirects must track the whole live sitemap');
  for(const target of topics){
    const path = target.substring(1)+'index.html';
    assert.ok(vite.includes("'"+path+"'"),'Vite static entry '+target);
  }
});
test('the entire public website has distinct intent metadata, real H1 and correct organization-linked identity',async()=>{
  const titles=new Set(),descs=new Set();
  for(const url of urls){
    const html=await readRoute(url);
    const title=titleOf(html),desc=descriptionOf(html);
    assert.ok(title && title.length>=15 && title.length<=75,url+' useful title');
    assert.ok(desc && desc.length>=80 && desc.length<=200,url+' useful description');
    assert.ok(!titles.has(title),url+' unique title');titles.add(title);
    assert.ok(!descs.has(desc),url+' unique description');descs.add(desc);
    assert.equal((html.match(/<h1(?:\s|>)/gi)||[]).length,1,url+' one h1');
    assert.ok(html.includes(`<link rel="canonical" href="${origin+url}">`),url+' own canonical');
    assert.ok(html.includes(`<meta property="og:url" content="${origin+url}">`),url+' OG URL');
    assert.ok(!/<meta name="robots" content="[^"]*noindex/i.test(html),url+' indexable');
    assert.ok(html.includes('Thuisbatterij'),url+' commercial origin clear');
  }
});
test('five new guides answer different substantive buyer questions with proper author and source schema',async()=>{
  for(const url of topics){
    const html=await readRoute(url);
    const visible=strip(html);
    assert.ok(visible.split(' ').length>=690,url+' unique editorial depth');
    assert.ok(html.includes('href="/offerte/"'),url+' actual conversion action');
    assert.ok(html.includes('href="/bronnen/"'),url+' provenance link');
    assert.ok(html.includes('Preliminary'),url+' preliminary source caveat');
    assert.ok(html.includes('NIVO Groep Holland B.V.'),url+' responsible website operator');
    assert.ok(html.includes('href="/datasheet/"') || url==='/datasheet/',url+' supported spec discovery');
    const graph=structured(html);
    assert.ok(graph.find(x=>x['@type']==='BreadcrumbList'),url+' breadcrumbs');
    const page=graph.find(x=>['Article','WebPage'].includes(x['@type']));
    assert.ok(page,url+' main page schema');
    assert.equal(page.mainEntityOfPage?.['@id'],origin+url);
    assert.equal(page.publisher?.name,'NIVO Groep Holland B.V.');
    assert.ok(!JSON.stringify(graph).match(/"@type":"(?:Offer|AggregateOffer|Review|AggregateRating)"/));
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
    assert.equal(new Set(ids).size,ids.length,url+' no duplicate ids');
    for(const a of html.matchAll(/<a[^>]+href="#([^"]+)"/g))
      assert.ok(ids.includes(a[1]),url+' local anchor '+a[1]);
    const related=[...html.matchAll(/<a[^>]+href="\/(?:kennis\/|modellen\/|datasheet\/|offerte\/|bronnen\/)[^"#?]*"/g)].length;
    assert.ok(related>=6,url+' helpful link graph');
  }
});
test('datasheet discovery preserves original documents, Preliminary ambiguity and honest purchase path',async()=>{
  const html=await readRoute('/datasheet/');
  for(const path of [
    '/downloads/hyxi-aura-1-fase-datasheet.pdf',
    '/downloads/hyxi-aura-3-fasen-datasheet.pdf',
    '/downloads/hyxi-eu-garantievoorwaarden.pdf'
  ]) assert.ok(html.includes('href="'+path+'"'),path);
  for(const term of ['HSA2','HTA2','BAT-Q7','BAT-Q9','160000 W','26 oktober 2026','Preliminary','6,7 kWh','8,6 kWh'])
    assert.ok(html.includes(term),'source-driven '+term);
  assert.match(html,/Download HSA2 datasheet \(PDF\)/);
  assert.match(html,/Download HTA2 datasheet \(PDF\)/);
  assert.match(html,/geen account, e-mailadres of marketingtoestemming/i);
});
test('warranty article does not invent BAT-Q7 coverage, savings or 15-year warranty',async()=>{
  const html=await readRoute('/kennis/garantie/');
  assert.match(html,/BAT-Q9/);
  assert.match(html,/50,7 MWh/);
  assert.match(html,/HSA2/);
  assert.match(html,/HTA2/);
  assert.match(html,/BAT-Q7.{0,150}(?:niet|bevestig)/i);
  assert.match(html,/vroegste/);
  assert.match(html,/arbeidskosten/);
  assert.match(html,/niet hetzelfde als 15 jaar fabrieksgarantie/);
  assert.doesNotMatch(html,/BAT-Q7<\/th><td>10 jaar/);
});
test('model overview keeps kW and kWh separate and does not fabricate exact variant availability',async()=>{
  const html=await readRoute('/modellen/');
  for(const term of ['HSA2','HTA2','3–12 kW','5–30 kW','7,03 kWh','9,04 kWh','6,7 kWh','8,6 kWh','160000 W'])
    assert.ok(html.includes(term),term);
  assert.match(html,/geen belofte dat elke individuele variant in Nederland leverbaar is/i);
  assert.match(html,/Preliminary/);
});
test('pricing and existing-PV guides describe evidence boundaries and support useful quote preparation',async()=>{
  const price=await readRoute('/kennis/prijs-en-installatie/');
  const solar=await readRoute('/kennis/bestaande-zonnepanelen/');
  assert.match(price,/geen onbevestigde vanafprijs/i);
  assert.match(price,/inclusief installatie/i);
  assert.match(price,/meterkast/i);
  assert.match(price,/offerte/i);
  assert.doesNotMatch(price,/€\s*\d+|\b\d+[.,]\d{2}\s*euro/i,'unapproved public selling price');
  assert.match(solar,/stringomvormer/);
  assert.match(solar,/micro-omvormers/);
  assert.match(solar,/geen voldoende compatibiliteitsbewijs/i);
  assert.match(solar,/geen.*aansluitschema/i);
});
test('homepage and existing knowledge routes link editorially to the new topical documents',async()=>{
  const home=await readRoute('/');
  for(const topic of topics){
    assert.ok(home.includes('href="'+topic+'"'),'home discovers '+topic);
  }
  for(const old of [
    '/kennis/bat-q7-vs-bat-q9/', '/kennis/noodstroom/',
    '/kennis/1-fase-of-3-fasen/', '/kennis/installatiecheck/'
  ]){
    const html=await readRoute(old);
    const count=topics.filter(p=>html.includes('href="'+p+'"')).length;
    assert.ok(count>=2,old+' at least 2 contextual links to new guides');
  }
  const sources=await readRoute('/bronnen/');
  const quote=await readRoute('/offerte/');
  assert.ok(sources.includes('href="/datasheet/"'));
  assert.ok(sources.includes('href="/kennis/garantie/"'));
  assert.ok(quote.includes('href="/kennis/prijs-en-installatie/"'));
  assert.ok(quote.includes('href="/kennis/bestaande-zonnepanelen/"'));
});
