import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {MARKET_MODELS,MARKET_CATEGORIES,COMPARE_SLUGS} from '../src/market-models.mjs';
import {PUBLIC_CANONICAL_PATHS} from '../server/app.mjs';

const root=resolve(import.meta.dirname,'..');
const origin='https://hyxi-aura.nl';
const detailSlugs=['sigenergy','alphaess','tesla-powerwall','enphase','huawei','byd','solaredge','ecoflow','sessy'];
const extra=[
  '/vergelijken/','/hyxi-power/','/kennis/hoeveel-kwh-nodig/','/kennis/app-monitoring/',
  ...detailSlugs.map(s=>'/vergelijken/hyxi-aura-vs-'+s+'/')
];
const htmlAt=url=>readFile(resolve(root,'dist',url.substring(1),'index.html'),'utf8');
const text=s=>s.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&(?:nbsp|amp|mdash);/g,' ').replace(/\s+/g,' ').trim();
const ld=s=>[...s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(x=>{const o=JSON.parse(x[1]);return o['@graph']||[o]});

test('market registry contains 21 real series, official product links, unique IDs and truthful categories',()=>{
  assert.equal(MARKET_MODELS.length,21);
  assert.equal(new Set(MARKET_MODELS.map(x=>x.id)).size,21);
  assert.equal(new Set(Object.values(COMPARE_SLUGS)).size,9);
  for(const m of MARKET_MODELS){
    assert.ok(m.brand.length>1 && m.model.length>2);
    assert.ok(['hybride','ac','modulair','plug-in'].includes(m.category));
    assert.ok(MARKET_CATEGORIES[m.category]);
    assert.match(m.source,/^https:\/\/(?:www\.|solar\.|nl\.|energy\.|en\.)?[a-z0-9.-]+\.[a-z]{2,}\//i,'factory origin');
    assert.ok(m.identity.length>30 && m.capacity.length>=12 && m.limits.length>24,`Substantive source/context for ${m.id}`);
    assert.ok(!m.price && !m.rating && !m.stock && !m.buyUrl,'No fabricated price, star rating or inventory');
  }
});

test('all thirteen new longtail URLs build as valuable indexable independent pages',async()=>{
  const urls=new Set(),titles=new Set(),descs=new Set();
  const sitemap=await readFile(resolve(root,'dist/sitemap.xml'),'utf8');
  const sitemapUrls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
  assert.equal(sitemapUrls.length,31);
  assert.equal(new Set(sitemapUrls).size,31);
  assert.deepEqual(new Set(sitemapUrls),new Set([...PUBLIC_CANONICAL_PATHS].map(x=>origin+x)));
  for(const route of extra){
    const html=await htmlAt(route),main=html.slice(html.indexOf('<main'),html.indexOf('</main>'));
    assert.ok(sitemapUrls.includes(origin+route),'sitemap route '+route);
    const title=html.match(/<title>([^<]+)<\/title>/)?.[1]||'';
    const desc=html.match(/<meta name="description" content="([^"]+)"/)?.[1]||'';
    assert.ok(title.length>20 && title.length<76,'helpful meta title '+route);
    assert.ok(desc.length>80 && desc.length<201,'useful summary '+route);
    assert.ok(!titles.has(title) && !descs.has(desc),'unique meta '+route);
    titles.add(title);descs.add(desc);
    assert.ok(!urls.has(route));urls.add(route);
    assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,route+' single H1');
    assert.ok(html.includes('<link rel="canonical" href="'+origin+route+'">'),route+' canonical');
    assert.ok(html.includes('index, follow, max-image-preview:large'),route+' indexability');
    assert.ok(html.includes('<meta property="og:url" content="'+origin+route+'">'),route+' OG URL');
    assert.ok(html.includes('href="/vergelijken/"') || route==='/vergelijken/',route+' navigable comparisons');
    assert.ok(html.includes('href="/offerte/"'),route+' existing human advice');
    assert.ok(html.includes('NIVO Groep Holland B.V.'),route+' accountable operator');
    assert.ok(main.includes('fabrikant') || main.includes('Fabrikant'),route+' source disclosure');
    assert.ok(text(main).split(' ').length>=700,'substantial source-driven content '+route);
    const graph=ld(html);
    assert.ok(graph.find(x=>x['@type']==='BreadcrumbList'),route+' breadcrumbs');
    assert.ok(graph.find(x=>['Article','WebPage'].includes(x['@type'])),route+' article/webpage schema');
    assert.ok(!JSON.stringify(graph).match(/"@type":"(?:Offer|AggregateOffer|Review|AggregateRating)"/),route+' no fake e-commerce data');
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
    assert.equal(ids.length,new Set(ids).size,'no duplicate anchors '+route);
    for(const href of html.matchAll(/href="(\/[^?#"]*\/)"/g)){
      assert.ok(PUBLIC_CANONICAL_PATHS.has(href[1]),route+' internal link '+href[1]+' must exist');
    }
  }
});

test('market hub visibly exposes manufacturer sources for all 21 series, not fictional winners',async()=>{
  const h=await htmlAt('/vergelijken/');
  for(const x of MARKET_MODELS){
    assert.ok(h.includes('>'+x.brand+'<'),x.brand+' visible');
    assert.ok(h.includes(x.model),x.model+' visible');
    assert.ok(h.includes('href="'+x.source+'"'),x.id+' real manufacturer URL');
  }
  for(const slug of detailSlugs) assert.ok(h.includes('href="/vergelijken/hyxi-aura-vs-'+slug+'/"'));
  assert.ok(h.includes('Wij verkopen HYXI AURA.') && h.includes('niet onafhankelijk'));
  assert.ok(h.includes('niet ieder model') || h.includes('niet ieder model'.replace('niet','niet')),'scope limits');
  assert.ok(!/beste\s+thuisbatterij\s+(?:van|in)\s+2026/i.test(h),'no fake 2026 title win');
});

test('the nine comparison pages disclose conflicts, avoid system-level shortcuts and link to original sources',async()=>{
  for(const slug of detailSlugs){
    const page=await htmlAt('/vergelijken/hyxi-aura-vs-'+slug+'/');
    assert.match(page,/HYXI AURA of /);
    assert.match(page,/niet onafhankelijk|geen onafhankelijke testinstantie/i);
    assert.match(page,/geen gegarandeerd|geen fictieve|geen niet-bevestigde prijzen/i);
    assert.ok(page.includes('href="/datasheet/"'),'original HYXI pdf');
    assert.ok(page.includes('href="/bronnen/"'),'preliminary source status');
    assert.ok(page.includes('href="/kennis/prijs-en-installatie/"'),'pricing nuance');
    assert.ok(page.includes('class="compare-table comparison-matrix"'),'accessible comparison table');
    assert.ok(page.includes('aria-label="HYXI AURA versus'),'real comparison table');
    assert.ok(page.includes('target="_blank" rel="noopener"'),'official competitor source');
    const otherSources=MARKET_MODELS.filter(x=>x.scope==='vergelijking' && x.id!=='hyxi-aura');
    assert.ok(otherSources.some(x=>page.includes('href="'+x.source+'"')),'official comparator cited');
  }
});

test('HYXI short keywords, smart monitoring and independent sizing keep unique intent',async()=>{
  const brand=await htmlAt('/hyxi-power/');
  assert.match(brand,/HYXI Halo/);
  assert.match(brand,/HYXI AURA/);
  assert.match(brand,/HYXI Cloud/);
  assert.ok(brand.includes('hyxipower.com/nl/ProductsDetail/hyxi-halo'));
  const cap=await htmlAt('/kennis/hoeveel-kwh-nodig/');
  assert.match(cap,/twaalf zonnepanelen|twaalf panelen/i);
  assert.match(cap,/6,7 kWh/);
  assert.match(cap,/8,6 kWh/);
  assert.match(cap,/geen gegarandeerde/i);
  const app=await htmlAt('/kennis/app-monitoring/');
  assert.match(app,/HYXI Cloud/);
  assert.match(app,/softwareversie|firmware/);
  assert.match(app,/dynamisch energiecontract/i);
  assert.ok(app.includes('hyxipower.com/nl/ServiceSupport/DownloadCenter'));
  const home=await htmlAt('/');
  for(const route of ['/vergelijken/','/hyxi-power/','/kennis/hoeveel-kwh-nodig/','/kennis/app-monitoring/']){
    assert.ok(home.includes('href="'+route+'"'),'direct pillar link '+route);
  }
});
