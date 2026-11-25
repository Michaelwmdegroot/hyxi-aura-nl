// Public, read-only probe. Never submit a lead, sign in, log cookies or handle PII.
import { fileURLToPath } from 'node:url';

const BASE = 'https://hyxi-aura.nl';
const KNOWLEDGE = [
  { path: '/kennis/noodstroom/', title: 'HYXI AURA bij stroomuitval' },
  { path: '/kennis/installatiecheck/', title: 'HYXI AURA installatiecheck' },
  { path: '/kennis/1-fase-of-3-fasen/', title: 'HYXI AURA 1 fase of 3 fasen' },
  { path: '/modellen/', title: 'HYXI AURA modellen' },
  { path: '/datasheet/', title: 'HYXI AURA datasheet' },
  { path: '/kennis/prijs-en-installatie/', title: 'HYXI AURA prijs' },
  { path: '/kennis/bestaande-zonnepanelen/', title: 'HYXI AURA bij bestaande zonnepanelen' },
  { path: '/kennis/garantie/', title: 'HYXI AURA garantie' },
  { path: '/kennis/salderingsregeling-2027/', title: 'HYXI AURA na salderen in 2027' },
  { path: '/kennis/btw-subsidie/', title: 'HYXI AURA btw terugvragen' },
  { path: '/kennis/dynamisch-energiecontract/', title: 'HYXI AURA met dynamisch energiecontract' },
  { path: '/kennis/uitbreiden/', title: 'HYXI AURA uitbreiden' },
  { path: '/kennis/buiten-plaatsen/', title: 'HYXI AURA buiten plaatsen' },
  { path: '/vergelijken/', title: 'Thuisbatterijen vergelijken' },
  { path: '/hyxi-power/', title: 'HYXI POWER' },
  { path: '/kennis/hoeveel-kwh-nodig/', title: 'Hoeveel kWh HYXI AURA' },
  { path: '/kennis/app-monitoring/', title: 'HYXI AURA app' },
  { path: '/vergelijken/hyxi-aura-vs-sigenergy/', title: 'HYXI AURA vs' },
  { path: '/vergelijken/hyxi-aura-vs-alphaess/', title: 'HYXI AURA vs' },
  { path: '/vergelijken/hyxi-aura-vs-tesla-powerwall/', title: 'HYXI AURA vs' },
  { path: '/vergelijken/hyxi-aura-vs-enphase/', title: 'HYXI AURA vs' },
  { path: '/vergelijken/hyxi-aura-vs-huawei/', title: 'HYXI AURA vs' },
  { path: '/vergelijken/hyxi-aura-vs-byd/', title: 'HYXI AURA vs' },
  { path: '/vergelijken/hyxi-aura-vs-solaredge/', title: 'HYXI AURA vs' },
  { path: '/vergelijken/hyxi-aura-vs-ecoflow/', title: 'HYXI AURA vs' },
  { path: '/vergelijken/hyxi-aura-vs-sessy/', title: 'HYXI AURA vs' },
];
const BRAND_ASSETS = ['/favicon.png', '/apple-touch-icon.png', '/icons/brand-192.png', '/icons/brand-512.png', '/site.webmanifest', '/assets/thuisbatterijteam-logo.svg'];
const PATHS = [...BRAND_ASSETS, '/index.html', '/', '/api/health', '/api/config', '/privacy/', '/bronnen/', '/offerte/', '/kennis/bat-q7-vs-bat-q9/', ...KNOWLEDGE.map(item => item.path), '/sitemap.xml', '/sitemap.css', '/robots.txt', '/api/beheer/leads'];

export async function probeProduction(fetcher = fetch) {
  const observed = {};
  for (const path of PATHS) {
    const guide = KNOWLEDGE.find(item => item.path === path) || (path === '/' ? {path:'/', title:'HYXI AURA thuisbatterij'} : null);
    // Hostinger deployment may lag behind the GitHub push. Only public guides
    // and static icons get a short bounded retry; API/privacy checks remain
    // strict and immediate. Unit test mocks never wait.
    const brandAsset = BRAND_ASSETS.includes(path);
    const retiredGuide = path === '/kennis/bat-q7-vs-bat-q9/';
    const attempts = (guide || brandAsset || retiredGuide) && fetcher === fetch ? 8 : 1;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const response = await fetcher(BASE + path, {
          method: 'GET',
          redirect: 'manual',
          signal: AbortSignal.timeout(12000),
          headers: { Accept: path.startsWith('/api/') ? 'application/json' : 'text/html, */*' },
        });
        // Never return or print response bodies/headers. API/config has a CSRF token.
        const text = path === '/api/beheer/leads' ? '' : await response.text();
        let parsed = null;
        if (path === '/api/health' || path === '/api/config') {
          try { parsed = JSON.parse(text); } catch { /* treated as failed check */ }
        }
        observed[path] = { status: response.status, data: parsed, redirectLocation: (path === '/index.html' || retiredGuide) ? response.headers?.get?.('location') : null, content: path.startsWith('/api/') ? '' : text };
      } catch {
        observed[path] = { status: 0, data: null, content: '' };
      }
      // The homepage title was already correct in V3. Keep retrying during a
      // Hostinger deploy until the actual V4 local-GSAP + two-line hero lands.
      const rootV6 = path !== '/' || (observed[path].content.includes('presenter-subline') &&
        observed[path].content.includes('id="hero-product-pivot"') &&
        observed[path].content.includes('data-aura-zone-viewer') &&
        observed[path].content.includes('id="aura-viewer-help"') &&
        !observed[path].content.includes('class="hero-view-switcher"') &&
        !observed[path].content.includes('class="hero-eyebrow"') &&
        observed[path].content.includes('id="backup-usp"') &&
        observed[path].content.includes('footer-presenter') &&
        observed[path].content.includes('src="/vendor/gsap.min.js"') &&
        observed[path].content.includes('href="/favicon.png"') &&
        observed[path].content.includes('id="ervaringen"'));
      const assetReady = brandAsset && observed[path].status === 200 &&
        (path.endsWith('.png') ? observed[path].content.length > 64 :
          path.endsWith('.svg') ? observed[path].content.includes('<svg') &&
            observed[path].content.includes('fill="#00EC54"') : observed[path].content.includes('"HYXI AURA — Thuisbatterij Team"'));
      const retiredReady = retiredGuide && observed[path].status === 301 && observed[path].redirectLocation === '/modellen/';
      if ((!guide && !brandAsset && !retiredGuide) || retiredReady || assetReady || (guide && observed[path].status === 200 &&
        observed[path].content.includes(`<link rel="canonical" href="${BASE}${path}">`) &&
        observed[path].content.includes(guide.title) && rootV6)) break;
      if (attempt + 1 < attempts) await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  const checks = {
    // Dedicated read-only release gate for the editorial clean-up and
    // authentic TBT-first footer/backup presentation.
    editorialBrandAndBackupDeployed: observed['/'].status === 200 &&
      observed['/'].content.includes('footer-presenter') &&
      observed['/'].content.includes('id="backup-usp"') &&
      observed['/'].content.includes('Automatische ATS-omschakeling') &&
      observed['/'].content.includes('Back-up is') &&
      observed['/'].content.includes('href="/kennis/noodstroom/"') &&
      !observed['/'].content.includes('class="hero-eyebrow"') &&
      !observed['/'].content.includes('class="section-number"') &&
      !observed['/'].content.includes('operator-proof-icon'),
    // Static homepage-only review proof, not a claim of live Google API synchronization.
    customerReviewsDeployed: observed['/'].status === 200 &&
      observed['/'].content.includes('id="ervaringen"') &&
      observed['/'].content.includes('Jan Molema van der veen') &&
      observed['/'].content.includes('Lydia Wagenborg') &&
      !observed['/'].content.includes('Momentopname: 20 november 2026') &&
      observed['/'].content.includes('niet specifiek een beoordeling van het HYXI AURA-product') &&
      observed['/'].content.includes('https://www.trustpilot.com/review/thuisbatterijteam.nl'),
    // Distinct from generic health/readiness: this verifies the new TBT-first
    // homepage is actually on Hostinger, not only committed to GitHub.
    heroTbtShowroomDeployed: observed['/'].status === 200 &&
      observed['/'].content.includes('<link rel="canonical" href="https://hyxi-aura.nl/">') &&
      observed['/'].content.includes('presenter-brand') &&
      observed['/'].content.includes('class="tbt-wordmark"') &&
      observed['/'].content.includes('src="/assets/thuisbatterijteam-logo.svg"') &&
      observed['/'].content.includes('id="launch-mobile-nav"') &&
      observed['/'].content.includes('href="#voordelen"') &&
      observed['/'].content.includes('href="#team"') &&
      observed['/'].content.includes('Thuisbatterij') &&
      observed['/'].content.includes('presenteert') &&
      observed['/'].content.includes('presenter-product') &&
      observed['/'].content.includes('presenter-subline') &&
      observed['/'].content.includes('id="hero-product-pivot"') &&
      observed['/'].content.includes('src="/vendor/gsap.min.js"') &&
      observed['/'].content.includes('id="hero-product-stage"') &&
      observed['/'].content.includes('data-product-gallery') &&
      observed['/'].content.includes('data-aura-zone-viewer') &&
      observed['/'].content.includes('id="aura-viewer-help"') &&
      !observed['/'].content.includes('class="hero-view-switcher"'),
    healthReachable: observed['/api/health'].status === 200 && observed['/api/health'].data?.ok === true,
    publicIntakeEnabled: observed['/api/health'].data?.leadEnabled === true &&
      observed['/api/config'].status === 200 && observed['/api/config'].data?.leadEnabled === true,
    canonicalHtmlAliasRedirected: observed['/index.html'].status === 308 &&
      observed['/index.html'].redirectLocation === `${BASE}/`,
    brandAssetsDeployed: observed['/'].content.includes('href="/favicon.png"') &&
      observed['/'].content.includes('href="/site.webmanifest"') &&
      observed['/'].content.includes('src="/assets/thuisbatterijteam-logo.svg"') &&
      observed['/assets/thuisbatterijteam-logo.svg']?.content.includes('fill="#00EC54"') &&
      BRAND_ASSETS.every(path => observed[path]?.status === 200) &&
      observed['/site.webmanifest'].content.includes('"192x192"') &&
      observed['/site.webmanifest'].content.includes('"512x512"'),
    privacyDeployed: observed['/privacy/'].status === 200 &&
      observed['/privacy/'].content.includes('Privacyverklaring · versie 16 november 2026') &&
      observed['/privacy/'].content.includes('Odoo CRM') &&
      observed['/privacy/'].content.includes('versleuteld op in een beveiligde database'),
    // The manufacturer's Preliminary HTA2 errors must be explained publicly.
    // Test the actual HTML, not an assumed Google index or source-link crawl.
    sourceDocumentationDeployed: observed['/bronnen/'].status === 200 &&
      observed['/bronnen/'].content.includes('<link rel="canonical" href="https://hyxi-aura.nl/bronnen/">') &&
      observed['/bronnen/'].content.includes('Bronnen gecontroleerd op 16 november 2026') &&
      observed['/bronnen/'].content.includes('onterecht') &&
      observed['/bronnen/'].content.includes('160000 W') &&
      observed['/bronnen/'].content.includes('href="/kennis/1-fase-of-3-fasen/"') &&
      observed['/bronnen/'].content.includes('secondary-presenter'),
    quotePageReady: observed['/offerte/'].status === 200 &&
      observed['/offerte/'].content.includes('id="quoteForm"') &&
      observed['/offerte/'].content.includes('href="https://hyxi-aura.nl/offerte/"'),
    styledSitemapDeployed: observed['/sitemap.xml'].status === 200 &&
      observed['/sitemap.xml'].content.includes('<?xml-stylesheet type="text/css" href="/sitemap.css"?>') &&
      observed['/sitemap.css'].status === 200 &&
      observed['/sitemap.css'].content.includes('@namespace "http://www.sitemaps.org/schemas/sitemap/0.9";') &&
      observed['/sitemap.css'].content.includes('urlset::before') &&
      observed['/sitemap.css'].content.includes('loc {'),
    sitemapPresent: observed['/sitemap.xml'].status === 200 &&
      observed['/sitemap.xml'].content.includes('https://hyxi-aura.nl/offerte/') &&
      (observed['/sitemap.xml'].content.match(/<loc>/g)||[]).length === 30 &&
      !observed['/sitemap.xml'].content.includes('https://hyxi-aura.nl/kennis/bat-q7-vs-bat-q9/') &&
      KNOWLEDGE.every(item => observed['/sitemap.xml'].content.includes(`<loc>${BASE}${item.path}</loc>`)),
    retiredQ7GuideRedirects: observed['/kennis/bat-q7-vs-bat-q9/'].status === 301 &&
      observed['/kennis/bat-q7-vs-bat-q9/'].redirectLocation === '/modellen/',
    backupGuideDeployed: observed['/kennis/noodstroom/'].status === 200 &&
      observed['/kennis/noodstroom/'].content.includes(`<link rel="canonical" href="${BASE}/kennis/noodstroom/">`) &&
      observed['/kennis/noodstroom/'].content.includes('HYXI AURA bij stroomuitval') &&
      observed['/kennis/noodstroom/'].content.includes('href="/offerte/"'),
    phaseComparisonDeployed: observed['/kennis/1-fase-of-3-fasen/'].status === 200 &&
      observed['/kennis/1-fase-of-3-fasen/'].content.includes(`<link rel="canonical" href="${BASE}/kennis/1-fase-of-3-fasen/">`) &&
      observed['/kennis/1-fase-of-3-fasen/'].content.includes('HYXI AURA 1 fase of 3 fasen') &&
      observed['/kennis/1-fase-of-3-fasen/'].content.includes('href="/offerte/"'),
    modelsGuideDeployed: observed['/modellen/'].status === 200 &&
      observed['/modellen/'].content.includes('<link rel="canonical" href="https://hyxi-aura.nl/modellen/">') &&
      observed['/modellen/'].content.includes('HYXI AURA modellen') &&
      observed['/modellen/'].content.includes('HSA2') &&
      observed['/modellen/'].content.includes('BAT-Q9') &&
      observed['/modellen/'].content.includes('href="/datasheet/"') &&
      observed['/modellen/'].content.includes('href="/offerte/"'),
    datasheetGuideDeployed: observed['/datasheet/'].status === 200 &&
      observed['/datasheet/'].content.includes('<link rel="canonical" href="https://hyxi-aura.nl/datasheet/">') &&
      observed['/datasheet/'].content.includes('HYXI AURA datasheet') &&
      observed['/datasheet/'].content.includes('Preliminary') &&
      observed['/datasheet/'].content.includes('160000 W') &&
      observed['/datasheet/'].content.includes('href="/downloads/hyxi-aura-1-fase-datasheet.pdf"') &&
      observed['/datasheet/'].content.includes('href="/downloads/hyxi-aura-3-fasen-datasheet.pdf"'),
    priceGuideDeployed: observed['/kennis/prijs-en-installatie/'].status === 200 &&
      observed['/kennis/prijs-en-installatie/'].content.includes('<link rel="canonical" href="https://hyxi-aura.nl/kennis/prijs-en-installatie/">') &&
      observed['/kennis/prijs-en-installatie/'].content.includes('HYXI AURA prijs') &&
      observed['/kennis/prijs-en-installatie/'].content.includes('geen onbevestigde vanafprijs') &&
      observed['/kennis/prijs-en-installatie/'].content.includes('href="/offerte/"'),
    solarGuideDeployed: observed['/kennis/bestaande-zonnepanelen/'].status === 200 &&
      observed['/kennis/bestaande-zonnepanelen/'].content.includes('<link rel="canonical" href="https://hyxi-aura.nl/kennis/bestaande-zonnepanelen/">') &&
      observed['/kennis/bestaande-zonnepanelen/'].content.includes('HYXI AURA bij bestaande zonnepanelen') &&
      observed['/kennis/bestaande-zonnepanelen/'].content.includes('micro-omvormers') &&
      observed['/kennis/bestaande-zonnepanelen/'].content.includes('href="/offerte/"'),
    warrantyGuideDeployed: observed['/kennis/garantie/'].status === 200 &&
      observed['/kennis/garantie/'].content.includes('<link rel="canonical" href="https://hyxi-aura.nl/kennis/garantie/">') &&
      observed['/kennis/garantie/'].content.includes('HYXI AURA garantie') &&
      observed['/kennis/garantie/'].content.includes('50,7 MWh') &&
      observed['/kennis/garantie/'].content.includes('BAT-Q7') &&
      observed['/kennis/garantie/'].content.includes('href="/downloads/hyxi-eu-garantievoorwaarden.pdf"'),
    salderen2027GuideDeployed: observed['/kennis/salderingsregeling-2027/'].status === 200 &&
      observed['/kennis/salderingsregeling-2027/'].content.includes(`<link rel="canonical" href="${BASE}/kennis/salderingsregeling-2027/">`) &&
      observed['/kennis/salderingsregeling-2027/'].content.includes("Salderen stopt in 2027.") &&
      observed['/kennis/salderingsregeling-2027/'].content.includes("1 januari 2027") &&
      observed['/kennis/salderingsregeling-2027/'].content.includes("href=\"/kennis/bestaande-zonnepanelen/\"") &&
      observed['/kennis/salderingsregeling-2027/'].content.includes('href="/offerte/"') &&
      observed['/'].content.includes('href="/kennis/salderingsregeling-2027/"'),
    btwSubsidyGuideDeployed: observed['/kennis/btw-subsidie/'].status === 200 &&
      observed['/kennis/btw-subsidie/'].content.includes(`<link rel="canonical" href="${BASE}/kennis/btw-subsidie/">`) &&
      observed['/kennis/btw-subsidie/'].content.includes("HYXI AURA btw terugvragen") &&
      observed['/kennis/btw-subsidie/'].content.includes("Belastingdienst") &&
      observed['/kennis/btw-subsidie/'].content.includes("href=\"/kennis/prijs-en-installatie/\"") &&
      observed['/kennis/btw-subsidie/'].content.includes('href="/offerte/"') &&
      observed['/'].content.includes('href="/kennis/btw-subsidie/"'),
    dynamicContractGuideDeployed: observed['/kennis/dynamisch-energiecontract/'].status === 200 &&
      observed['/kennis/dynamisch-energiecontract/'].content.includes(`<link rel="canonical" href="${BASE}/kennis/dynamisch-energiecontract/">`) &&
      observed['/kennis/dynamisch-energiecontract/'].content.includes("HYXI AURA met dynamisch energiecontract") &&
      observed['/kennis/dynamisch-energiecontract/'].content.includes("EMS") &&
      observed['/kennis/dynamisch-energiecontract/'].content.includes("href=\"/kennis/noodstroom/\"") &&
      observed['/kennis/dynamisch-energiecontract/'].content.includes('href="/offerte/"') &&
      observed['/'].content.includes('href="/kennis/dynamisch-energiecontract/"'),
    batteryExpansionGuideDeployed: observed['/kennis/uitbreiden/'].status === 200 &&
      observed['/kennis/uitbreiden/'].content.includes(`<link rel="canonical" href="${BASE}/kennis/uitbreiden/">`) &&
      observed['/kennis/uitbreiden/'].content.includes("HYXI AURA uitbreiden") &&
      observed['/kennis/uitbreiden/'].content.includes("BAT-Q9") &&
      observed['/kennis/uitbreiden/'].content.includes("href=\"/kennis/garantie/\"") &&
      observed['/kennis/uitbreiden/'].content.includes('href="/offerte/"') &&
      observed['/'].content.includes('href="/kennis/uitbreiden/"'),
    outdoorPlacementGuideDeployed: observed['/kennis/buiten-plaatsen/'].status === 200 &&
      observed['/kennis/buiten-plaatsen/'].content.includes(`<link rel="canonical" href="${BASE}/kennis/buiten-plaatsen/">`) &&
      observed['/kennis/buiten-plaatsen/'].content.includes("HYXI AURA buiten plaatsen") &&
      observed['/kennis/buiten-plaatsen/'].content.includes("IP66") &&
      observed['/kennis/buiten-plaatsen/'].content.includes("href=\"/kennis/garantie/\"") &&
      observed['/kennis/buiten-plaatsen/'].content.includes('href="/offerte/"') &&
      observed['/'].content.includes('href="/kennis/buiten-plaatsen/"'),
    marketHubDeployed: observed['/vergelijken/'].status === 200 &&
      observed['/vergelijken/'].content.includes(`<link rel="canonical" href="${BASE}/vergelijken/">`) &&
      observed['/vergelijken/'].content.includes("Thuisbatterijen vergelijken") &&
      observed['/vergelijken/'].content.includes("SigenStor") &&
      observed['/vergelijken/'].content.includes('href="/offerte/"') &&
      observed['/'].content.includes('href="/vergelijken/"'),
    hyxiPowerGuideDeployed: observed['/hyxi-power/'].status === 200 &&
      observed['/hyxi-power/'].content.includes(`<link rel="canonical" href="${BASE}/hyxi-power/">`) &&
      observed['/hyxi-power/'].content.includes("HYXI POWER") &&
      observed['/hyxi-power/'].content.includes("HYXI Halo") &&
      observed['/hyxi-power/'].content.includes('href="/offerte/"') &&
      observed['/'].content.includes('href="/hyxi-power/"'),
    capacitySizingGuideDeployed: observed['/kennis/hoeveel-kwh-nodig/'].status === 200 &&
      observed['/kennis/hoeveel-kwh-nodig/'].content.includes(`<link rel="canonical" href="${BASE}/kennis/hoeveel-kwh-nodig/">`) &&
      observed['/kennis/hoeveel-kwh-nodig/'].content.includes("Hoeveel kWh HYXI AURA") &&
      observed['/kennis/hoeveel-kwh-nodig/'].content.includes("8,6 kWh") &&
      observed['/kennis/hoeveel-kwh-nodig/'].content.includes('href="/offerte/"') &&
      observed['/'].content.includes('href="/kennis/hoeveel-kwh-nodig/"'),
    hyxiAppGuideDeployed: observed['/kennis/app-monitoring/'].status === 200 &&
      observed['/kennis/app-monitoring/'].content.includes(`<link rel="canonical" href="${BASE}/kennis/app-monitoring/">`) &&
      observed['/kennis/app-monitoring/'].content.includes("HYXI AURA app") &&
      observed['/kennis/app-monitoring/'].content.includes("HYXI Cloud") &&
      observed['/kennis/app-monitoring/'].content.includes('href="/offerte/"') &&
      observed['/'].content.includes('href="/kennis/app-monitoring/"'),
    compare1GuideDeployed: observed['/vergelijken/hyxi-aura-vs-sigenergy/'].status === 200 &&
      observed['/vergelijken/hyxi-aura-vs-sigenergy/'].content.includes(`<link rel="canonical" href="${BASE}/vergelijken/hyxi-aura-vs-sigenergy/">`) &&
      observed['/vergelijken/hyxi-aura-vs-sigenergy/'].content.includes("HYXI AURA vs") &&
      observed['/vergelijken/hyxi-aura-vs-sigenergy/'].content.includes("HYXI AURA") &&
      observed['/vergelijken/hyxi-aura-vs-sigenergy/'].content.includes('href="/offerte/"') &&
      observed['/vergelijken/'].content.includes('href="/vergelijken/hyxi-aura-vs-sigenergy/"'),
    compare2GuideDeployed: observed['/vergelijken/hyxi-aura-vs-alphaess/'].status === 200 &&
      observed['/vergelijken/hyxi-aura-vs-alphaess/'].content.includes(`<link rel="canonical" href="${BASE}/vergelijken/hyxi-aura-vs-alphaess/">`) &&
      observed['/vergelijken/hyxi-aura-vs-alphaess/'].content.includes("HYXI AURA vs") &&
      observed['/vergelijken/hyxi-aura-vs-alphaess/'].content.includes("HYXI AURA") &&
      observed['/vergelijken/hyxi-aura-vs-alphaess/'].content.includes('href="/offerte/"') &&
      observed['/vergelijken/'].content.includes('href="/vergelijken/hyxi-aura-vs-alphaess/"'),
    compare3GuideDeployed: observed['/vergelijken/hyxi-aura-vs-tesla-powerwall/'].status === 200 &&
      observed['/vergelijken/hyxi-aura-vs-tesla-powerwall/'].content.includes(`<link rel="canonical" href="${BASE}/vergelijken/hyxi-aura-vs-tesla-powerwall/">`) &&
      observed['/vergelijken/hyxi-aura-vs-tesla-powerwall/'].content.includes("HYXI AURA vs") &&
      observed['/vergelijken/hyxi-aura-vs-tesla-powerwall/'].content.includes("HYXI AURA") &&
      observed['/vergelijken/hyxi-aura-vs-tesla-powerwall/'].content.includes('href="/offerte/"') &&
      observed['/vergelijken/'].content.includes('href="/vergelijken/hyxi-aura-vs-tesla-powerwall/"'),
    compare4GuideDeployed: observed['/vergelijken/hyxi-aura-vs-enphase/'].status === 200 &&
      observed['/vergelijken/hyxi-aura-vs-enphase/'].content.includes(`<link rel="canonical" href="${BASE}/vergelijken/hyxi-aura-vs-enphase/">`) &&
      observed['/vergelijken/hyxi-aura-vs-enphase/'].content.includes("HYXI AURA vs") &&
      observed['/vergelijken/hyxi-aura-vs-enphase/'].content.includes("HYXI AURA") &&
      observed['/vergelijken/hyxi-aura-vs-enphase/'].content.includes('href="/offerte/"') &&
      observed['/vergelijken/'].content.includes('href="/vergelijken/hyxi-aura-vs-enphase/"'),
    compare5GuideDeployed: observed['/vergelijken/hyxi-aura-vs-huawei/'].status === 200 &&
      observed['/vergelijken/hyxi-aura-vs-huawei/'].content.includes(`<link rel="canonical" href="${BASE}/vergelijken/hyxi-aura-vs-huawei/">`) &&
      observed['/vergelijken/hyxi-aura-vs-huawei/'].content.includes("HYXI AURA vs") &&
      observed['/vergelijken/hyxi-aura-vs-huawei/'].content.includes("HYXI AURA") &&
      observed['/vergelijken/hyxi-aura-vs-huawei/'].content.includes('href="/offerte/"') &&
      observed['/vergelijken/'].content.includes('href="/vergelijken/hyxi-aura-vs-huawei/"'),
    compare6GuideDeployed: observed['/vergelijken/hyxi-aura-vs-byd/'].status === 200 &&
      observed['/vergelijken/hyxi-aura-vs-byd/'].content.includes(`<link rel="canonical" href="${BASE}/vergelijken/hyxi-aura-vs-byd/">`) &&
      observed['/vergelijken/hyxi-aura-vs-byd/'].content.includes("HYXI AURA vs") &&
      observed['/vergelijken/hyxi-aura-vs-byd/'].content.includes("HYXI AURA") &&
      observed['/vergelijken/hyxi-aura-vs-byd/'].content.includes('href="/offerte/"') &&
      observed['/vergelijken/'].content.includes('href="/vergelijken/hyxi-aura-vs-byd/"'),
    compare7GuideDeployed: observed['/vergelijken/hyxi-aura-vs-solaredge/'].status === 200 &&
      observed['/vergelijken/hyxi-aura-vs-solaredge/'].content.includes(`<link rel="canonical" href="${BASE}/vergelijken/hyxi-aura-vs-solaredge/">`) &&
      observed['/vergelijken/hyxi-aura-vs-solaredge/'].content.includes("HYXI AURA vs") &&
      observed['/vergelijken/hyxi-aura-vs-solaredge/'].content.includes("HYXI AURA") &&
      observed['/vergelijken/hyxi-aura-vs-solaredge/'].content.includes('href="/offerte/"') &&
      observed['/vergelijken/'].content.includes('href="/vergelijken/hyxi-aura-vs-solaredge/"'),
    compare8GuideDeployed: observed['/vergelijken/hyxi-aura-vs-ecoflow/'].status === 200 &&
      observed['/vergelijken/hyxi-aura-vs-ecoflow/'].content.includes(`<link rel="canonical" href="${BASE}/vergelijken/hyxi-aura-vs-ecoflow/">`) &&
      observed['/vergelijken/hyxi-aura-vs-ecoflow/'].content.includes("HYXI AURA vs") &&
      observed['/vergelijken/hyxi-aura-vs-ecoflow/'].content.includes("HYXI AURA") &&
      observed['/vergelijken/hyxi-aura-vs-ecoflow/'].content.includes('href="/offerte/"') &&
      observed['/vergelijken/'].content.includes('href="/vergelijken/hyxi-aura-vs-ecoflow/"'),
    compare9GuideDeployed: observed['/vergelijken/hyxi-aura-vs-sessy/'].status === 200 &&
      observed['/vergelijken/hyxi-aura-vs-sessy/'].content.includes(`<link rel="canonical" href="${BASE}/vergelijken/hyxi-aura-vs-sessy/">`) &&
      observed['/vergelijken/hyxi-aura-vs-sessy/'].content.includes("HYXI AURA vs") &&
      observed['/vergelijken/hyxi-aura-vs-sessy/'].content.includes("HYXI AURA") &&
      observed['/vergelijken/hyxi-aura-vs-sessy/'].content.includes('href="/offerte/"') &&
      observed['/vergelijken/'].content.includes('href="/vergelijken/hyxi-aura-vs-sessy/"'),
    installationCheckDeployed: observed['/kennis/installatiecheck/'].status === 200 &&
      observed['/kennis/installatiecheck/'].content.includes(`<link rel="canonical" href="${BASE}/kennis/installatiecheck/">`) &&
      observed['/kennis/installatiecheck/'].content.includes('HYXI AURA installatiecheck') &&
      observed['/kennis/installatiecheck/'].content.includes('id="installation-check-form" action="/offerte/" method="get"'),
    robotsPresent: observed['/robots.txt'].status === 200 &&
      observed['/robots.txt'].content.includes('Sitemap: https://hyxi-aura.nl/sitemap.xml'),
    unauthenticatedLeadsBlocked: observed['/api/beheer/leads'].status === 401,
  };
  return { ok: Object.values(checks).every(Boolean), checks };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = await probeProduction();
  console.log('HYXI AURA production public-readiness (no secrets or lead submissions):');
  for (const [name, passed] of Object.entries(result.checks)) {
    console.log((passed ? 'PASS ' : 'FAIL ') + name);
  }
  console.log('Mailbox inbox delivery and database durability require a separate authorized E2E test.');
  if (!result.ok) process.exitCode = 1;
}
