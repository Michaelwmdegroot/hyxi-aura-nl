import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'https://hyxi-aura.nl';
const root = resolve(import.meta.dirname, '..');
const routes = [
  '/kennis/salderingsregeling-2027/',
  '/kennis/btw-subsidie/',
  '/kennis/dynamisch-energiecontract/',
  '/kennis/uitbreiden/',
  '/kennis/buiten-plaatsen/'
];
const htmlAt = async url => readFile(resolve(root, 'dist', url.substring(1), 'index.html'), 'utf8');
const text = source => source.replace(/<script\b[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi,' ')
  .replace(/<[^>]*>/g,' ')
  .replace(/&(?:nbsp|amp|mdash|rsquo);/g,' ')
  .replace(/\s+/g,' ').trim();
const schemaOf = source => {
  const scripts = [...source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  return scripts.flatMap(m=>{ const obj=JSON.parse(m[1]); return obj['@graph']||[obj]; });
};

test('new longtail cluster consists of five complete, distinct, directly discoverable pages',async()=>{
  const home = await htmlAt('/');
  const sitemap = await readFile(resolve(root,'dist/sitemap.xml'),'utf8');
  assert.equal((sitemap.match(/<loc>/g)||[]).length,31);
  const titles = new Set(), descriptions = new Set();
  for(const url of routes) {
    const html = await htmlAt(url);
    const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
    const desc=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title && title.length>=20 && title.length<=75,url+' accurate title');
    assert.ok(desc && desc.length>=90 && desc.length<=195,url+' useful summary');
    assert.ok(!titles.has(title) && !descriptions.has(desc),url+' no copied SEO metadata');
    titles.add(title); descriptions.add(desc);
    assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,url+' H1');
    assert.ok(html.includes('<link rel="canonical" href="'+origin+url+'">'),url+' canonical');
    assert.ok(html.includes('<meta property="og:url" content="'+origin+url+'">'),url+' OG URL');
    assert.ok(html.includes('<meta name="robots" content="index, follow, max-image-preview:large">'),url+' indexable');
    assert.ok(sitemap.includes('<loc>'+origin+url+'</loc>'),url+' listed in XML sitemap');
    assert.ok(home.includes('href="'+url+'"'),url+' linked from the pillar homepage');
    assert.ok(html.includes('href="/offerte/"'),url+' human-led conversion');
    assert.ok(html.includes('href="/bronnen/"'),url+' sources');
    assert.ok(html.includes('href="/datasheet/"'),url+' original technical specifications');
    assert.ok(html.includes('Preliminary'),url+' provisional manufacturer disclosure');
    assert.ok(html.includes('NIVO Groep Holland B.V.'),url+' operator identity');
    assert.ok(text(html.slice(html.indexOf('<main'),html.indexOf('</main>'))).split(' ').length>700,url+' substantial visible article');
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
    assert.equal(ids.length,new Set(ids).size,url+' unique element IDs');
    const graph=schemaOf(html);
    const article=graph.find(x=>x['@type']==='Article');
    const breadcrumb=graph.find(x=>x['@type']==='BreadcrumbList');
    assert.ok(article && breadcrumb,url+' structured Article and breadcrumb');
    assert.equal(article.mainEntityOfPage?.['@id'],origin+url);
    assert.equal(article.publisher?.name,'NIVO Groep Holland B.V.');
    assert.ok(!JSON.stringify(graph).match(/"@type":"(?:Offer|Review|AggregateRating|AggregateOffer)"/),url+' no fake testimonials or price structured data');
    assert.equal(article.datePublished,'2026-11-18');
  }
});

test('saldering guide uses real 2027 rules and does not promise battery savings',async()=>{
  const html=await htmlAt('/kennis/salderingsregeling-2027/');
  for(const v of ['1 januari 2027','50% van het kale leveringstarief','Rijksoverheid','eigen verbruik','BAT-Q7','BAT-Q9'])
    assert.ok(html.includes(v),'source-based '+v);
  assert.match(html,/Geen gegarandeerde terugverdientijd|geen gegarandeerde terugverdientijd/i);
  assert.ok(html.includes('rijksoverheid.nl'));
});

test('VAT and subsidy article separates no national grant from conditional input VAT and loan',async()=>{
  const html=await htmlAt('/kennis/btw-subsidie/');
  for(const v of ['Belastingdienst','dynamisch energiecontract','EMS','KOR','Nationaal Warmtefonds','maximaal € 8.500','geen rijkssubsidie','privégebruik'])
    assert.ok(html.toLowerCase().includes(v.toLowerCase()),'source-based '+v);
  assert.ok(html.includes('belastingdienst.nl'));
  assert.ok(html.includes('warmtefonds.nl'));
  assert.ok(!html.includes('€ 8.500 subsidie'),'Warmtefonds loan must not be presented as a grant');
});

test('dynamic tariff guide distinguishes capability from guaranteed trading integrations',async()=>{
  const html=await htmlAt('/kennis/dynamisch-energiecontract/');
  assert.match(html,/AI-modus/);
  assert.match(html,/VPP-ready/);
  assert.match(html,/niet.*automatisch.*gekoppeld/is);
  assert.match(html,/niet.*over als gegarandeerde besparing of terugverdientijd/is);
  assert.ok(html.includes('href="/kennis/btw-subsidie/"'));
});

test('expansion guide and outdoor guide preserve provisional specification boundaries',async()=>{
  const expand=await htmlAt('/kennis/uitbreiden/');
  for(const v of ['7,03 kWh','6,7 kWh','9,04 kWh','8,6 kWh','51,6 kWh','BAT-Q7-garantie'])assert.ok(expand.includes(v),'expansion '+v);
  assert.match(expand,/niet hetzelfde als een onbeperkte garantie dat elke oude en nieuwe batterij/is);
  const outside=await htmlAt('/kennis/buiten-plaatsen/');
  for(const v of ['IP66','−20 tot +55 °C','−30 tot +60 °C','68 kg','79 kg'])assert.ok(outside.includes(v),'placement '+v);
  assert.match(outside,/IP66 is geen locatievergunning|IP66 is geen algemene garantie/i);
});

test('old pillar guides provide logical two-way contextual links to new topics',async()=>{
  const checks=[
    ['/kennis/prijs-en-installatie/',['/kennis/salderingsregeling-2027/','/kennis/btw-subsidie/','/kennis/dynamisch-energiecontract/']],
    ['/kennis/bestaande-zonnepanelen/',['/kennis/salderingsregeling-2027/','/kennis/buiten-plaatsen/']],
    ['/modellen/',['/kennis/uitbreiden/','/kennis/buiten-plaatsen/']],
    ['/datasheet/',['/kennis/uitbreiden/','/kennis/buiten-plaatsen/']],
    ['/kennis/garantie/',['/kennis/uitbreiden/']]
  ];
  for(const [route,links] of checks){
    const html=await htmlAt(route);
    for(const target of links)assert.ok(html.includes('href="'+target+'"'),route+' context-link to '+target);
  }
});
