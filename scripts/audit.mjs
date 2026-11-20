/**
 * GitHub Actions only: Lighthouse against the built Express site, desktop/mobile.
 * No .env loading, SMTP transport, external credentials, or local browser launch.
 * Uses the documented Node API and Playwright's installed Chromium executable:
 * https://github.com/GoogleChrome/lighthouse/blob/main/docs/readme.md
 * https://github.com/GoogleChrome/chrome-launcher/blob/main/README.md
 *
 * CI: npm ci; npm run build; npx playwright install --with-deps chromium;
 *     node scripts/audit.mjs
 * Scores are measurements; targets below are advisory, not a manufactured 100 gate.
 */
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from '@playwright/test';
import { createApp } from '../server/app.mjs';
import { loadConfig } from '../server/config.mjs';

if (process.env.GITHUB_ACTIONS !== 'true') {
  throw new Error('This browser audit runs only in the GitHub Actions workflow. No local Chromium will be launched.');
}

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const output = resolve(root, 'test-results/lighthouse');
await mkdir(output, { recursive: true });
const targets = { performance: 90, accessibility: 100, 'best-practices': 100, seo: 100 };
const summary = {
  startedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA || null,
  environment: 'GitHub Actions; production Vite build served by Express on loopback; SMTP disabled',
  method: 'One fresh Chromium profile per device; standard Lighthouse simulated throttling; no score-altering exclusions',
  limitation: 'A laboratory snapshot, not field Core Web Vitals. Public hosting latency, DNS, TLS and CDN behaviour are not measured.',
  targets,
  runs: [],
  errors: [],
};

let server;
let chrome;

function bounded(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_resolve, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${ms / 1000} seconds`)), ms); }),
  ]).finally(() => clearTimeout(timer));
}

async function closeChrome() {
  if (!chrome) return;
  const current = chrome;
  chrome = null;
  try { await bounded(current.kill(), 10000, 'Chromium cleanup'); }
  catch (error) {
    // Killing this child is a final cleanup fallback, never a different browser.
    current.process?.kill('SIGKILL');
    summary.errors.push({ stage: 'chrome-cleanup', message: error.message });
  }
}

function summarize(device, result) {
  const { lhr } = result;
  const scores = Object.fromEntries(Object.entries(targets).map(([id]) => [id,
    Number.isFinite(lhr.categories?.[id]?.score) ? Math.round(lhr.categories[id].score * 100) : null,
  ]));
  const metricIds = {
    fcp: 'first-contentful-paint', lcp: 'largest-contentful-paint', cls: 'cumulative-layout-shift',
    tbt: 'total-blocking-time', speedIndex: 'speed-index',
  };
  const metrics = Object.fromEntries(Object.entries(metricIds).map(([name, id]) => [name, {
    value: lhr.audits?.[id]?.numericValue ?? null,
    unit: lhr.audits?.[id]?.numericUnit ?? null,
    display: lhr.audits?.[id]?.displayValue ?? 'Not measured',
  }]));
  const memberships = new Map();
  for (const id of Object.keys(targets)) {
    for (const audit of lhr.categories?.[id]?.auditRefs || []) {
      if (!memberships.has(audit.id)) memberships.set(audit.id, []);
      memberships.get(audit.id).push(id);
    }
  }
  const findings = [...memberships].flatMap(([id, categories]) => {
    const audit = lhr.audits?.[id];
    if (!audit || typeof audit.score !== 'number' || audit.score >= 1) return [];
    return [{ id, categories, title: audit.title, score: audit.score, displayValue: audit.displayValue || '', explanation: audit.explanation || '' }];
  });
  return {
    device,
    lighthouseVersion: lhr.lighthouseVersion,
    fetchTime: lhr.fetchTime,
    finalUrl: lhr.finalDisplayedUrl,
    userAgent: lhr.userAgent,
    environment: lhr.environment,
    settings: {
      formFactor: lhr.configSettings?.formFactor,
      throttlingMethod: lhr.configSettings?.throttlingMethod,
      throttling: lhr.configSettings?.throttling,
      screenEmulation: lhr.configSettings?.screenEmulation,
    },
    scores, metrics, findings,
    belowTargets: Object.keys(targets).filter(id => scores[id] === null || scores[id] < targets[id]),
    runWarnings: lhr.runWarnings || [],
    runtimeError: lhr.runtimeError || null,
    reports: { html: `${device}.html`, json: `${device}.json` },
  };
}

function markdown() {
  const lines = [
    '# Lighthouse — production build', '',
    'One desktop and one mobile measurement on the GitHub runner. Mail delivery was disabled.', '',
    '| Device | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |',
    '| --- | ---: | ---: | ---: | ---: | --- | --- | --- |',
  ];
  for (const run of summary.runs) lines.push(`| ${run.device} | ${run.scores.performance ?? '—'} | ${run.scores.accessibility ?? '—'} | ${run.scores['best-practices'] ?? '—'} | ${run.scores.seo ?? '—'} | ${run.metrics.lcp.display} | ${run.metrics.cls.display} | ${run.metrics.tbt.display} |`);
  lines.push('', 'Review targets: performance ≥90; accessibility, best practices and SEO 100. Scores below a target produce a review note, not a hard failure.', '', summary.limitation, '');
  for (const run of summary.runs) {
    lines.push(`## ${run.device}`, '', `Lighthouse ${run.lighthouseVersion}; ${run.settings.throttlingMethod} throttling.`, '');
    if (run.belowTargets.length) lines.push(`Below review target: ${run.belowTargets.join(', ')}.`, '');
    if (run.findings.length) {
      lines.push('Audits to review:', '');
      for (const issue of run.findings.slice(0, 20)) lines.push(`- **${issue.title.replace(/\n/g, ' ')}**${issue.displayValue ? ` — ${issue.displayValue}` : ''} (${issue.id}).`);
      lines.push('');
    }
    for (const warning of run.runWarnings) lines.push(`- Run warning: ${String(warning).replace(/\n/g, ' ')}`);
    lines.push('', `Full evidence: ${run.reports.html} and ${run.reports.json} in the Lighthouse artifact.`, '');
  }
  if (summary.errors.length) {
    lines.push('## Audit errors', '');
    for (const error of summary.errors) lines.push(`- ${error.stage}: ${String(error.message).replace(/\n/g, ' ')}`);
  }
  return `${lines.join('\n')}\n`;
}

try {
  await readFile(resolve(dist, 'index.html'));
  // Use only explicit test settings. Nothing reads the deployment environment or .env.
  server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const config = loadConfig({ NODE_ENV: 'test', SITE_URL: origin, LEAD_ENABLED: 'false', TRUST_PROXY: 'false' });
  server.on('request', createApp({ config, transport: null, distDir: dist }));
  server.requestTimeout = 30000;
  server.headersTimeout = 15000;
  const health = await (await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(5000) })).json();
  if (health.leadEnabled !== false) throw new Error('Audit invariant failed: mail must be disabled.');

  for (const device of ['desktop', 'mobile']) {
    try {
      chrome = await chromeLauncher.launch({
        chromePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || chromium.executablePath(),
        chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
        logLevel: 'error',
        connectionPollInterval: 200,
        maxConnectionRetries: 100,
      });
      const result = await bounded(lighthouse(`${origin}/`, {
        port: chrome.port,
        logLevel: 'error',
        output: ['html', 'json'],
        onlyCategories: Object.keys(targets),
        locale: 'en-US',
        maxWaitForFcp: 20000,
        maxWaitForLoad: 45000,
        disableStorageReset: false,
      }, device === 'desktop' ? desktopConfig : undefined), 150000, `${device} Lighthouse audit`);
      if (!result?.lhr || !Array.isArray(result.report) || result.report.length !== 2) throw new Error('Lighthouse returned no complete HTML/JSON result.');
      await Promise.all([
        writeFile(resolve(output, `${device}.html`), result.report[0]),
        writeFile(resolve(output, `${device}.json`), result.report[1]),
      ]);
      const run = summarize(device, result);
      summary.runs.push(run);
      console.log(`${device}: ${JSON.stringify({ scores: run.scores, metrics: run.metrics, belowTargets: run.belowTargets })}`);
      if (run.runtimeError || Object.values(run.scores).some(score => score === null)) {
        throw new Error(run.runtimeError?.message || 'Lighthouse could not score every requested category.');
      }
      for (const category of run.belowTargets) console.log(`::warning title=Lighthouse ${device} review::${category} scored ${run.scores[category]}; review target ${targets[category]}. See the saved audit.`);
    } catch (error) {
      summary.errors.push({ stage: device, message: error.message });
      console.error(`${device} audit failed: ${error.message}`);
    } finally { await closeChrome(); }
  }
} catch (error) {
  summary.errors.push({ stage: 'setup', message: error.message });
  console.error(error.message);
} finally {
  await closeChrome();
  if (server?.listening) {
    server.closeAllConnections();
    await bounded(new Promise(resolveClose => server.close(resolveClose)), 5000, 'Audit server cleanup').catch(error => summary.errors.push({ stage: 'server-cleanup', message: error.message }));
  }
  summary.finishedAt = new Date().toISOString();
  summary.status = summary.errors.length ? 'failed' : 'measured';
  const report = markdown();
  await Promise.all([
    writeFile(resolve(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`),
    writeFile(resolve(output, 'summary.md'), report),
  ]);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report);
  if (summary.errors.length) process.exitCode = 1;
  console.log(`Lighthouse artifacts: ${output}`);
}
