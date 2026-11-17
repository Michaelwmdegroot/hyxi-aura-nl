import test from 'node:test';
import assert from 'node:assert/strict';
import { probeProduction } from '../scripts/probe-production.mjs';

const good = {
  '/': [200, '<link rel="icon" type="image/png" sizes="48x48" href="/favicon.png"><link rel="manifest" href="/site.webmanifest"><img class="site-brand-icon" src="/icons/brand-192.png" width="32" height="32" alt=""><link rel="canonical" href="https://hyxi-aura.nl/"><title>HYXI AURA thuisbatterij</title><header class="presenter-brand"><span class="presenter-owner">Thuisbatterij Team</span><span class="presenter-subline"><span class="presenter-verb">presenteert</span><span class="presenter-product">HYXI AURA</span></span></header><script defer src="/vendor/gsap.min.js"></script><div data-product-gallery><div id="hero-product-stage" data-aura-zone-viewer><div id="hero-product-pivot"></div></div><span id="aura-viewer-help">Kijkhoeken</span><div id="backup-usp">Automatische ATS-omschakeling</div><h3>Back-up is ingebouwd.</h3><a href="/kennis/noodstroom/">Techniek</a><footer class="footer-presenter">Thuisbatterij Team</footer></div>'],
  '/favicon.png': [200, 'PNG binary payload fixture - this is a public static icon, never user data, 48x48 pixels'],
  '/apple-touch-icon.png': [200, 'PNG binary payload fixture - this is a public static icon, never user data, 192x192 pixels'],
  '/icons/brand-192.png': [200, 'PNG binary payload fixture - this is a public static icon, never user data, 192x192 pixels'],
  '/icons/brand-512.png': [200, 'PNG binary payload fixture - this is a public static icon, never user data, 512x512 pixels'],
  '/site.webmanifest': [200, JSON.stringify({ name: 'HYXI AURA — Thuisbatterij Team', icons: [{sizes:'192x192'}, {sizes:'512x512'}] })],
  '/api/health': [200, JSON.stringify({ok:true,leadEnabled:true})],
  '/api/config': [200, JSON.stringify({leadEnabled:true,csrfToken:'DO-NOT-LOG'})],
  '/privacy/': [200, 'Privacyverklaring · versie 16 november 2026; versleuteld op in een beveiligde database; Odoo CRM'],
  '/bronnen/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/bronnen/"><p>Bronnen gecontroleerd op 16 november 2026</p><a class="secondary-presenter" href="/">Thuisbatterij Team</a><p>De HTA2-datasheet vermeldt onterecht HSA2 en 160000 W</p><a href="/kennis/1-fase-of-3-fasen/">Faseuitleg</a>'],
  '/offerte/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/offerte/"><form id="quoteForm"></form>'],
  '/kennis/bat-q7-vs-bat-q9/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/bat-q7-vs-bat-q9/"><title>HYXI AURA BAT-Q7 vs BAT-Q9</title><a href="/offerte/">'],
  '/kennis/noodstroom/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/noodstroom/"><title>HYXI AURA bij stroomuitval</title><a href="/offerte/">'],
  '/kennis/installatiecheck/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/installatiecheck/"><title>HYXI AURA installatiecheck</title><form id="installation-check-form" action="/offerte/" method="get">'],
  '/kennis/1-fase-of-3-fasen/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/1-fase-of-3-fasen/"><title>HYXI AURA 1 fase of 3 fasen</title><a href="/offerte/">'],
  '/sitemap.xml': [200, '<loc>https://hyxi-aura.nl/offerte/</loc><loc>https://hyxi-aura.nl/kennis/bat-q7-vs-bat-q9/</loc><loc>https://hyxi-aura.nl/kennis/noodstroom/</loc><loc>https://hyxi-aura.nl/kennis/installatiecheck/</loc><loc>https://hyxi-aura.nl/kennis/1-fase-of-3-fasen/</loc>'],
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
  assert.equal(Object.keys(result.checks).length,15);
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

test('V5 public readiness rejects the old left floating angle selector and missing product zone',async()=>{
  const previous=good['/'][1].replace('data-aura-zone-viewer','data-old-gallery').replace('<span id="aura-viewer-help">Kijkhoeken</span>','<div class="hero-view-switcher">Voorzijde / Schuin / Andere hoek</div>');
  const stale=await probeProduction(mock({...good,'/':[200,previous]}));
  assert.equal(stale.checks.heroTbtShowroomDeployed,false);
  assert.equal(stale.ok,false);
});

test('read-only public probe detects editorial regression, old corporate footer and missing ATS',async()=>{
  const v5=good['/'][1].replace('footer-presenter','old-hyxi-footer').replace('id="backup-usp"','id="old-card"');
  const result=await probeProduction(mock({...good,'/':[200,v5]}));
  assert.equal(result.checks.editorialBrandAndBackupDeployed,false);
  assert.equal(result.ok,false);
  assert.equal(result.checks.heroTbtShowroomDeployed,true);
  const generic=good['/'][1].replace('id="backup-usp"','id="backup-usp" class="hero-eyebrow"');
  const oldEyebrow=await probeProduction(mock({...good,'/':[200,generic]}));
  assert.equal(oldEyebrow.checks.editorialBrandAndBackupDeployed,false);
});

test('the source-backed one-/three-phase guide is live and in the sitemap',async()=>{
  const missing=await probeProduction(mock({...good,'/kennis/1-fase-of-3-fasen/':[404,'']}));
  assert.equal(missing.checks.phaseComparisonDeployed,false);
  assert.equal(missing.ok,false);
  const oldMap=await probeProduction(mock({...good,'/sitemap.xml':[200,good['/sitemap.xml'][1].replace('<loc>https://hyxi-aura.nl/kennis/1-fase-of-3-fasen/</loc>','')]}));
  assert.equal(oldMap.checks.sitemapPresent,false);
  assert.equal(oldMap.ok,false);
});
test('public privacy page must name the actual Odoo CRM email-import processor',async()=>{
  const stale=await probeProduction(mock({...good,'/privacy/':[200,'Privacyverklaring · versie 15 november 2026; versleuteld op in een beveiligde database']}));
  assert.equal(stale.checks.privacyDeployed,false);
});

test('manufacturer source page is public, canonical and transparent about Preliminary HTA2 errors',async()=>{
  const missing=await probeProduction(mock({...good,'/bronnen/':[404,'']}));
  assert.equal(missing.checks.sourceDocumentationDeployed,false);
  assert.equal(missing.ok,false);
  const old=await probeProduction(mock({...good,'/bronnen/':[200,good['/bronnen/'][1].replace('160000 W','fabrikantspecificatie')]}));
  assert.equal(old.checks.sourceDocumentationDeployed,false);
  assert.equal(old.ok,false);
  const wrongBrand=await probeProduction(mock({...good,'/bronnen/':[200,good['/bronnen/'][1].replace('secondary-presenter','legacy-hyxi')] }));
  assert.equal(wrongBrand.checks.sourceDocumentationDeployed,false);
});

test('public readiness detects incomplete or stale HYXI AURA favicon/PWA installation',async()=>{
  const missing = await probeProduction(mock({...good,'/favicon.png':[404,'']}));
  assert.equal(missing.checks.brandAssetsDeployed,false);
  assert.equal(missing.ok,false);
  const partial = await probeProduction(mock({...good,'/site.webmanifest':[200,'{"name":"Old orange A"}']}));
  assert.equal(partial.checks.brandAssetsDeployed,false);
  assert.equal(partial.ok,false);
  const oldHome = await probeProduction(mock({...good,'/':[200,good['/'][1].replace('href="/favicon.png"','href="/favicon.svg"')]}));
  assert.equal(oldHome.checks.brandAssetsDeployed,false);
  assert.equal(oldHome.ok,false);
});
