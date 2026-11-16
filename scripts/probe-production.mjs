// Public, read-only probe. Never submit a lead, sign in, log cookies or handle PII.
import { fileURLToPath } from 'node:url';

const BASE = 'https://hyxi-aura.nl';
const KNOWLEDGE = [
  { path: '/kennis/bat-q7-vs-bat-q9/', title: 'HYXI AURA BAT-Q7 vs BAT-Q9' },
  { path: '/kennis/noodstroom/', title: 'HYXI AURA bij stroomuitval' },
];
const PATHS = ['/api/health', '/api/config', '/privacy/', '/offerte/', ...KNOWLEDGE.map(item => item.path), '/sitemap.xml', '/robots.txt', '/api/beheer/leads'];

export async function probeProduction(fetcher = fetch) {
  const observed = {};
  for (const path of PATHS) {
    const guide = KNOWLEDGE.find(item => item.path === path);
    // Hostinger deploy may finish after GitHub's push event. Only public guide
    // GETs receive a short bounded retry; API/privacy checks retain their
    // original strict immediate behavior. Unit test mocks never wait.
    const attempts = guide && fetcher === fetch ? 8 : 1;
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
        observed[path] = { status: response.status, data: parsed, content: path.startsWith('/api/') ? '' : text };
      } catch {
        observed[path] = { status: 0, data: null, content: '' };
      }
      if (!guide || (observed[path].status === 200 &&
        observed[path].content.includes(`<link rel="canonical" href="${BASE}${path}">`) &&
        observed[path].content.includes(guide.title))) break;
      if (attempt + 1 < attempts) await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  const checks = {
    healthReachable: observed['/api/health'].status === 200 && observed['/api/health'].data?.ok === true,
    publicIntakeEnabled: observed['/api/health'].data?.leadEnabled === true &&
      observed['/api/config'].status === 200 && observed['/api/config'].data?.leadEnabled === true,
    privacyDeployed: observed['/privacy/'].status === 200 &&
      observed['/privacy/'].content.includes('Privacyverklaring · versie 15 november 2026') &&
      observed['/privacy/'].content.includes('versleuteld op in een beveiligde database'),
    quotePageReady: observed['/offerte/'].status === 200 &&
      observed['/offerte/'].content.includes('id="quoteForm"') &&
      observed['/offerte/'].content.includes('href="https://hyxi-aura.nl/offerte/"'),
    sitemapPresent: observed['/sitemap.xml'].status === 200 &&
      observed['/sitemap.xml'].content.includes('https://hyxi-aura.nl/offerte/') &&
      KNOWLEDGE.every(item => observed['/sitemap.xml'].content.includes(`<loc>${BASE}${item.path}</loc>`)),
    q7ComparisonDeployed: observed['/kennis/bat-q7-vs-bat-q9/'].status === 200 &&
      observed['/kennis/bat-q7-vs-bat-q9/'].content.includes(`<link rel="canonical" href="${BASE}/kennis/bat-q7-vs-bat-q9/">`) &&
      observed['/kennis/bat-q7-vs-bat-q9/'].content.includes('HYXI AURA BAT-Q7 vs BAT-Q9') &&
      observed['/kennis/bat-q7-vs-bat-q9/'].content.includes('href="/offerte/"'),
    backupGuideDeployed: observed['/kennis/noodstroom/'].status === 200 &&
      observed['/kennis/noodstroom/'].content.includes(`<link rel="canonical" href="${BASE}/kennis/noodstroom/">`) &&
      observed['/kennis/noodstroom/'].content.includes('HYXI AURA bij stroomuitval') &&
      observed['/kennis/noodstroom/'].content.includes('href="/offerte/"'),
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
