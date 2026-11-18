import test from 'node:test';
import assert from 'node:assert/strict';
import { probeProduction } from '../scripts/probe-production.mjs';

const good = {
  '/index.html': [308, ''],
  '/': [200, '<link rel="icon" type="image/png" sizes="48x48" href="/favicon.png"><link rel="manifest" href="/site.webmanifest"><img class="site-brand-icon" src="/icons/brand-192.png" width="32" height="32" alt=""><link rel="canonical" href="https://hyxi-aura.nl/"><title>HYXI AURA thuisbatterij</title><header class="presenter-brand"><span class="presenter-owner">Thuisbatterij Team</span><span class="presenter-subline"><span class="presenter-verb">presenteert</span><span class="presenter-product">HYXI AURA</span></span></header><script defer src="/vendor/gsap.min.js"></script><div data-product-gallery><div id="hero-product-stage" data-aura-zone-viewer><div id="hero-product-pivot"></div></div><span id="aura-viewer-help">Kijkhoeken</span><div id="backup-usp">Automatische ATS-omschakeling</div><h3>Back-up is ingebouwd.</h3><a href="/kennis/noodstroom/">Techniek</a><a href="/kennis/salderingsregeling-2027/">SEO gids</a><a href="/kennis/btw-subsidie/">SEO gids</a><a href="/kennis/dynamisch-energiecontract/">SEO gids</a><a href="/kennis/uitbreiden/">SEO gids</a><a href="/kennis/buiten-plaatsen/">SEO gids</a><footer class="footer-presenter">Thuisbatterij Team</footer></div>'],
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
  '/modellen/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/modellen/"><title>HYXI AURA modellen</title><p>HSA2 BAT-Q9</p><a href="/datasheet/">PDF</a><a href="/offerte/">Offerte</a>'],
  '/datasheet/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/datasheet/"><title>HYXI AURA datasheet</title><p>Preliminary HTA2 HSA2 160000 W</p><a href="/downloads/hyxi-aura-1-fase-datasheet.pdf">HSA2 PDF</a><a href="/downloads/hyxi-aura-3-fasen-datasheet.pdf">HTA2 PDF</a>'],
  '/kennis/prijs-en-installatie/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/prijs-en-installatie/"><title>HYXI AURA prijs</title><p>geen onbevestigde vanafprijs</p><a href="/offerte/">Offerte</a>'],
  '/kennis/bestaande-zonnepanelen/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/bestaande-zonnepanelen/"><title>HYXI AURA bij bestaande zonnepanelen</title><p>micro-omvormers</p><a href="/offerte/">Offerte</a>'],
  '/kennis/salderingsregeling-2027/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/salderingsregeling-2027/"><title>HYXI AURA na salderen in 2027</title><p>1 januari 2027</p><a href="/kennis/bestaande-zonnepanelen/">Further</a><a href="/offerte/">Offerte</a>'],
  '/kennis/btw-subsidie/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/btw-subsidie/"><title>HYXI AURA btw terugvragen</title><p>Belastingdienst</p><a href="/kennis/prijs-en-installatie/">Further</a><a href="/offerte/">Offerte</a>'],
  '/kennis/dynamisch-energiecontract/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/dynamisch-energiecontract/"><title>HYXI AURA met dynamisch energiecontract</title><p>EMS</p><a href="/kennis/noodstroom/">Further</a><a href="/offerte/">Offerte</a>'],
  '/kennis/uitbreiden/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/uitbreiden/"><title>HYXI AURA uitbreiden</title><p>BAT-Q9</p><a href="/kennis/garantie/">Further</a><a href="/offerte/">Offerte</a>'],
  '/kennis/buiten-plaatsen/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/buiten-plaatsen/"><title>HYXI AURA buiten plaatsen</title><p>IP66</p><a href="/kennis/garantie/">Further</a><a href="/offerte/">Offerte</a>'],
  '/kennis/garantie/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/garantie/"><title>HYXI AURA garantie</title><p>BAT-Q7 BAT-Q9 50,7 MWh</p><a href="/downloads/hyxi-eu-garantievoorwaarden.pdf">Garantie PDF</a>'],
  '/kennis/1-fase-of-3-fasen/': [200, '<link rel="canonical" href="https://hyxi-aura.nl/kennis/1-fase-of-3-fasen/"><title>HYXI AURA 1 fase of 3 fasen</title><a href="/offerte/">'],
  '/sitemap.xml': [200, '<?xml-stylesheet type="text/css" href="/sitemap.css"?>' + "<loc>https://hyxi-aura.nl/</loc><loc>https://hyxi-aura.nl/modellen/</loc><loc>https://hyxi-aura.nl/datasheet/</loc><loc>https://hyxi-aura.nl/kennis/prijs-en-installatie/</loc><loc>https://hyxi-aura.nl/kennis/bestaande-zonnepanelen/</loc><loc>https://hyxi-aura.nl/kennis/garantie/</loc><loc>https://hyxi-aura.nl/bronnen/</loc><loc>https://hyxi-aura.nl/offerte/</loc><loc>https://hyxi-aura.nl/kennis/bat-q7-vs-bat-q9/</loc><loc>https://hyxi-aura.nl/kennis/noodstroom/</loc><loc>https://hyxi-aura.nl/kennis/installatiecheck/</loc><loc>https://hyxi-aura.nl/kennis/1-fase-of-3-fasen/</loc><loc>https://hyxi-aura.nl/privacy/</loc><loc>https://hyxi-aura.nl/kennis/salderingsregeling-2027/</loc><loc>https://hyxi-aura.nl/kennis/btw-subsidie/</loc><loc>https://hyxi-aura.nl/kennis/dynamisch-energiecontract/</loc><loc>https://hyxi-aura.nl/kennis/uitbreiden/</loc><loc>https://hyxi-aura.nl/kennis/buiten-plaatsen/</loc>"],
  '/sitemap.css': [200, '@namespace "http://www.sitemaps.org/schemas/sitemap/0.9"; urlset::before {content:"XML-sitemap"} loc {display:block}'],
  '/robots.txt': [200, 'Sitemap: https://hyxi-aura.nl/sitemap.xml'],
  '/api/beheer/leads': [401, '{}'],
};
const mock = (data) => async url => {
  const path = new URL(url).pathname;
  const [status,body] = data[path] ?? [404,''];
  return {status,text:async()=>body,headers:{get:name=>name.toLowerCase()==='location' && path==='/index.html' ? 'https://hyxi-aura.nl/' : null}};
};

test('productieprobe leest uitsluitend publieke metadata en rapporteert alle P0-beveiligingschecks',async()=>{
  const result=await probeProduction(mock(good));
  assert.equal(result.ok,true);
  assert.equal(Object.keys(result.checks).length,27);
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

test('five topic-cluster pages must be live, canonical, source-aware and covered by the sitemap',async()=>{
  const checks=[
    ['/modellen/','modelsGuideDeployed'],
    ['/datasheet/','datasheetGuideDeployed'],
    ['/kennis/prijs-en-installatie/','priceGuideDeployed'],
    ['/kennis/bestaande-zonnepanelen/','solarGuideDeployed'],
    ['/kennis/garantie/','warrantyGuideDeployed']
  ];
  for(const [url,key] of checks){
    const noPage=await probeProduction(mock({...good,[url]:[404,'']}));
    assert.equal(noPage.checks[key],false,key+' must fail on absent page');
    assert.equal(noPage.ok,false,key+' prevents false release acceptance');
    const map=good['/sitemap.xml'][1].replace('<loc>https://hyxi-aura.nl'+url+'</loc>','');
    const noSitemap=await probeProduction(mock({...good,'/sitemap.xml':[200,map]}));
    assert.equal(noSitemap.checks.sitemapPresent,false,'Missing '+url+' in sitemap');
  }
  const stale=await probeProduction(mock({...good,
    '/kennis/garantie/':[200,good['/kennis/garantie/'][1].replace('50,7 MWh','onbeperkte cycli')]
  }));
  assert.equal(stale.checks.warrantyGuideDeployed,false);
  const typo=await probeProduction(mock({...good,
    '/datasheet/':[200,good['/datasheet/'][1].replace('160000 W','corrected 16000W')]
  }));
  assert.equal(typo.checks.datasheetGuideDeployed,false);
});

test('canonical HTML alias must permanently redirect to the preferred home URL',async()=>{
  const aliasNotFound=await probeProduction(mock({...good,'/index.html':[404,'']}));
  assert.equal(aliasNotFound.checks.canonicalHtmlAliasRedirected,false);
  assert.equal(aliasNotFound.ok,false);
  const duplicate=await probeProduction(mock({...good,'/index.html':[200,'<title>Duplicate homepage</title>']}));
  assert.equal(duplicate.checks.canonicalHtmlAliasRedirected,false);
  assert.equal(duplicate.ok,false);
});

test('styled sitemap deployment gate rejects missing XML PI and missing browser CSS', async()=>{
  const missingCss=await probeProduction(mock({...good,'/sitemap.css':[404,'']}));
  assert.equal(missingCss.checks.styledSitemapDeployed,false);
  assert.equal(missingCss.ok,false);
  const noStylePI=await probeProduction(mock({...good,
    '/sitemap.xml':[200,good['/sitemap.xml'][1].replace('<?xml-stylesheet type="text/css" href="/sitemap.css"?>','')]
  }));
  assert.equal(noStylePI.checks.styledSitemapDeployed,false);
  assert.equal(noStylePI.ok,false);
  const wrongNamespace=await probeProduction(mock({...good,
    '/sitemap.css':[200,'@namespace "https://wrong.example"; urlset::before { } loc { }']
  }));
  assert.equal(wrongNamespace.checks.styledSitemapDeployed,false);
});

test('five longtail guides are required in the actual live release',async()=>{
  const targets=[
    ['/kennis/salderingsregeling-2027/','salderen2027GuideDeployed'],
    ['/kennis/btw-subsidie/','btwSubsidyGuideDeployed'],
    ['/kennis/dynamisch-energiecontract/','dynamicContractGuideDeployed'],
    ['/kennis/uitbreiden/','batteryExpansionGuideDeployed'],
    ['/kennis/buiten-plaatsen/','outdoorPlacementGuideDeployed']
  ];
  for(const [route,key] of targets){
    const notDeployed=await probeProduction(mock({...good,[route]:[404,'']}));
    assert.equal(notDeployed.checks[key],false,key+' absent');
    assert.equal(notDeployed.ok,false,key+' must block release');
    const noIndex=await probeProduction(mock({...good,
      '/sitemap.xml':[200,good['/sitemap.xml'][1].replace('<loc>https://hyxi-aura.nl'+route+'</loc>','')]
    }));
    assert.equal(noIndex.checks.sitemapPresent,false,route+' sitemap missing');
  }
});
