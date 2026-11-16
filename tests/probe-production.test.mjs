import test from 'node:test';
import assert from 'node:assert/strict';
import { probeProduction } from '../scripts/probe-production.mjs';

const good = {
  '/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/"><title>HYXI AURA thuisbatterij</title><header class="presenter-brand"><span class="presenter-owner">Thuisbatterij Team</span><span class="presenter-subline"><span class="presenter-verb">presenteert</span><span class="presenter-product">HYXI AURA</span></span></header><script defer src="/vendor/gsap.min.js"></script><div data-product-gallery><div id="hero-product-stage"><div id="hero-product-pivot"></div></div><button data-aura-view="front"></button><button data-aura-view="angle"></button><button data-aura-view="side"></button></div>'],
  '/api/health': [200, JSON.stringify({ok:true,leadEnabled:true})],
  '/api/config': [200, JSON.stringify({leadEnabled:true,csrfToken:'DO-NOT-LOG'})],
  '/privacy/': [200, 'Privacyverklaring · versie 15 november 2026; versleuteld op in een beveiligde database'],
  '/offerte/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/offerte/"><form id="quoteForm"></form>'],
  '/kennis/bat-q7-vs-bat-q9/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/bat-q7-vs-bat-q9/"><title>HYXI AURA BAT-Q7 vs BAT-Q9</title><a href="/offerte/">'],
  '/kennis/noodstroom/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/noodstroom/"><title>HYXI AURA bij stroomuitval</title><a href="/offerte/">'],
  '/kennis/installatiecheck/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/installatiecheck/"><title>HYXI AURA installatiecheck</title><form id="installation-check-form" action="/offerte/" method="get">'],
  '/sitemap.xml': [200, '<loc>https://hyxi-aura.nl/offerte/</loc><loc>https://hyxi-aura.nl/kennis/bat-q7-vs-bat-q9/</loc><loc>https://hyxi-aura.nl/kennis/noodstroom/</loc><loc>https://hyxi-aura.nl/kennis/installatiecheck/</loc>'],
  '/robots.txt': [200, 'Sitemap: https://hyxi-aura.nl/sitemap.xml'],
  '/api/beheer/leads': [401, '{}'],
};
const mock = (data) => async url => {
  const path = new URL(url).pathname;
  const [status,body] = data[path] ?? [404,''];
  return {status,text:async()=>body};
};

test('productieprobe leest uitsluitend publieke metadata en rapporteert alle P0-beveiligingschecks',async()=>{
  const result=await probeProduction(mock(good));
  assert.equal(result.ok,true);
  assert.equal(Object.keys(result.checks).length,11);
  assert.doesNotMatch(JSON.stringify(result),/DO-NOT-LOG/);
});

test('productieprobe faalt gesloten leadintake zonder details van cookies te tonen',async()=>{
  const result=await probeProduction(mock({
    ...good,
    '/api/health':[200,JSON.stringify({ok:true,leadEnabled:false})],
  }));
  assert.equal(result.ok,false);
  assert.equal(result.checks.healthReachable,true);
  assert.equal(result.checks.publicIntakeEnabled,false);
});

test('productieprobe detecteert ontbrekende publieke offertepagina',async()=>{
  const result=await probeProduction(mock({...good,'/offerte/':[404,'']}));
  assert.equal(result.checks.quotePageReady,false);
  assert.equal(result.ok,false);
});

test('public readiness detects missing or mismatched live knowledge content', async () => {
  const missing = await probeProduction(mock({...good,'/kennis/noodstroom/':[404,'']}));
  assert.equal(missing.checks.backupGuideDeployed,false);
  assert.equal(missing.ok,false);
  const wrong = await probeProduction(mock({...good,'/kennis/bat-q7-vs-bat-q9/':[200,good['/offerte/'][1]]}));
  assert.equal(wrong.checks.q7ComparisonDeployed,false);
  assert.equal(wrong.ok,false);
});
test('public readiness checks that both distinct guide URLs occur in live sitemap', async () => {
  const old = await probeProduction(mock({...good,'/sitemap.xml':[200,'<loc>https://hyxi-aura.nl/offerte/</loc>']}));
  assert.equal(old.checks.sitemapPresent,false);
  assert.equal(old.ok,false);
});

test('public installation check must be deployed, canonical and in sitemap',async()=>{
  const unavailable=await probeProduction(mock({...good,'/kennis/installatiecheck/':[404,'']}));
  assert.equal(unavailable.checks.installationCheckDeployed,false);
  assert.equal(unavailable.ok,false);
  const oldSitemap=await probeProduction(mock({...good,'/sitemap.xml':[200,'<loc>https://hyxi-aura.nl/offerte/</loc><loc>https://hyxi-aura.nl/kennis/bat-q7-vs-bat-q9/</loc><loc>https://hyxi-aura.nl/kennis/noodstroom/</loc>']}));
  assert.equal(oldSitemap.checks.sitemapPresent,false);
});

test('public production readiness verifies the TBT-first hero actually deployed without requesting private data', async () => {
  const ok = await probeProduction(mock(good));
  assert.equal(ok.checks.heroTbtShowroomDeployed,true);
  const oldHero=await probeProduction(mock({...good,'/':[200,'<title>HYXI AURA thuisbatterij</title><h1>HYXI AURA</h1>']}));
  assert.equal(oldHero.checks.heroTbtShowroomDeployed,false);
  assert.equal(oldHero.ok,false);
  const missing=await probeProduction(mock({...good,'/':[404,'']}));
  assert.equal(missing.checks.heroTbtShowroomDeployed,false);
  assert.equal(missing.ok,false);
});

test('production readiness rejects V3 when locally hosted GSAP V4 markup is not deployed',async()=>{
  const previous=good['/'][1].replace('presenter-subline','old-three-line-brand').replace('id="hero-product-pivot"','id="old-photos"').replace('src="/vendor/gsap.min.js"','src="/legacy/gallery.js"');
  const stale=await probeProduction(mock({...good,'/':[200,previous]}));
  assert.equal(stale.checks.heroTbtShowroomDeployed,false);
  assert.equal(stale.ok,false);
});
