/**
 * Full browser → real Express API → injected SMTP stub → receipt verification.
 * No email leaves this process. Build first: npm run build && npm run test:browser.
 * Install the normal Playwright Chromium browser in CI with:
 *   npx playwright install --with-deps chromium
 * An existing local Chromium may be selected explicitly using
 * PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. This suite never installs a browser itself.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createApp } from '../server/app.mjs';
import { loadConfig } from '../server/config.mjs';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const resultsDir = resolve(root, 'test-results', 'browser');
await readFile(resolve(dist, 'index.html')).catch(() => { throw new Error('Build the production site first: npm run build'); });
await mkdir(resultsDir, { recursive: true });

const report = { startedAt: new Date().toISOString(), transport: 'Injected in-process SMTP stub; no external mail', checks: [], accessibility: [], sceneEvidence: [], browserErrors: [] };
const fixtures = [];
let browser;
let currentPage;
let currentCheck = 'browser-launch';
const record = label => { report.checks.push(label); console.log(`PASS ${label}`); };
const numberFromText = value => Number(value.replace(/\s*kWh?\s*/g, '').replace(/\./g, '').replace(',', '.').trim());
const nl = value => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(value);

async function fixture({ enabled = true } = {}) {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const config = loadConfig({
    NODE_ENV: 'test', SITE_URL: origin, ALLOWED_ORIGINS: origin,
    LEAD_ENABLED: String(enabled), SMTP_HOST: 'smtp.example.test',
    SMTP_USER: 'sender@example.test', SMTP_PASS: 'local-browser-test-only',
    SMTP_FROM: 'sender@example.test', LEAD_TO: 'recipient@example.test',
    CSRF_SECRET: 'browser-test-only-csrf-secret-at-least-32-characters',
    SMTP_DAILY_LIMIT: '30', LEAD_RATE_LIMIT: '30', TRUST_PROXY: 'false',
  });
  const calls = [];
  let hold = null;
  const transport = { async sendMail(mail) {
    calls.push(mail);
    if (hold) await hold.promise;
    return { accepted: [config.smtp.to], rejected: [] };
  } };
  server.on('request', createApp({ config, transport, distDir: dist }));
  const value = {
    origin, calls,
    holdDelivery() {
      let release;
      const promise = new Promise(resolve => { release = resolve; });
      hold = { promise, release };
    },
    releaseDelivery() { hold?.release(); hold = null; },
    async close() {
      hold?.release();
      server.closeIdleConnections();
      const deadline = setTimeout(() => server.closeAllConnections(), 3000);
      deadline.unref();
      try { await new Promise(resolve => server.close(resolve)); } finally { clearTimeout(deadline); }
    },
  };
  fixtures.push(value);
  return value;
}

async function assertNoOverflow(page, label) {
  const geometry = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(geometry.document <= geometry.width + 1 && geometry.body <= geometry.width + 1, `${label}: horizontal overflow ${JSON.stringify(geometry)}`);
  const dialog = page.locator('#lead-dialog');
  if (await dialog.isVisible()) {
    const bounds = await dialog.boundingBox();
    assert.ok(bounds.x >= -1 && bounds.x + bounds.width <= geometry.width + 1, `${label}: dialog extends outside viewport`);
    const interior = await dialog.evaluate(el => ({ scroll: el.scrollWidth, client: el.clientWidth }));
    assert.ok(interior.scroll <= interior.client + 1, `${label}: dialog content overflows horizontally`);
  }
}

async function assertImages(page, label) {
  const images = page.locator('img');
  for (let index = 0; index < await images.count(); index++) {
    const image = images.nth(index);
    if (!await image.isVisible()) continue;
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0), { message: `${label}: image must load`, timeout: 10000 }).toBe(true);
  }
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
}

async function accessibility(page, label) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const violations = result.violations.map(item => ({ id: item.id, impact: item.impact, description: item.description, helpUrl: item.helpUrl, nodes: item.nodes.map(node => ({ target: node.target, failureSummary: node.failureSummary })) }));
  report.accessibility.push({ label, violations, incompleteRuleIds: result.incomplete.map(item => item.id) });
  assert.deepEqual(violations, [], `${label}: axe WCAG A/AA violations; see test-results/browser/report.json`);
}

async function captureExperience(page, label) {
  await page.locator('.scenario-button[data-mode="solar"]').click();
  const toggle = page.locator('#battery-toggle');
  if (await toggle.getAttribute('aria-pressed') !== 'true') await toggle.click();
  const card = page.locator('#experience-card');
  await card.scrollIntoViewIfNeeded();
  const scene = page.locator('#energy-scene');
  await expect(scene).toHaveAttribute('data-ready', /^(?:true|fallback)$/, { timeout: 15000 });
  const evidence = await scene.evaluate(element => {
    const canvas = element.querySelector('canvas[data-energy-canvas]');
    const bounds = canvas?.getBoundingClientRect();
    return {
      ready: element.dataset.ready,
      canvas: canvas ? {
        drawingWidth: canvas.width, drawingHeight: canvas.height,
        displayWidth: bounds.width, displayHeight: bounds.height,
      } : null,
    };
  });
  evidence.label = label;
  evidence.scenario = 'solar';
  evidence.batteryEnabled = true;
  evidence.renderer = evidence.ready === 'true' ? 'Three.js WebGL canvas' : 'Architectural SVG fallback';
  evidence.fallbackVisible = await page.locator('#scene-fallback').isVisible();
  evidence.screenshot = `${label}-experience.png`;
  if (evidence.ready === 'true') {
    assert.ok(evidence.canvas?.drawingWidth > 0 && evidence.canvas?.drawingHeight > 0, `${label}: a ready WebGL scene has a non-empty drawing buffer`);
    await expect(scene.locator('canvas[data-energy-canvas]')).toBeVisible();
    assert.equal(evidence.fallbackVisible, false);
  } else await expect(page.locator('#scene-fallback .aura-svg-house')).toBeVisible();
  // Let the selected solar state reach the next paint without an arbitrary delay.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await card.screenshot({ path: resolve(resultsDir, evidence.screenshot) });
  report.sceneEvidence.push(evidence);
  record(`${label}: experience visual captured using ${evidence.renderer}`);
}

async function scenarios(page, label) {
  // Independent teaching expectations. The grid value is narrated in the page;
  // badge values and narrative must together describe an energy-balanced state.
  const cases = [
    { mode: 'solar', enabled: true, solar: 4.2, home: 1.2, battery: 3, grid: 0, charging: true, batteryLabel: 'AURA laadt op', narrative: /batterij slaat het overschot op/ },
    { mode: 'solar', enabled: false, solar: 4.2, home: 1.2, battery: 0, grid: -3, charging: false, batteryLabel: 'Geen batterijopslag', narrative: /3,0 kW terug/ },
    { mode: 'evening', enabled: true, solar: 0, home: 1.8, battery: 1.8, grid: 0, charging: false, batteryLabel: 'AURA levert stroom', narrative: /AURA levert in dit voorbeeld 1,8 kW/ },
    { mode: 'evening', enabled: false, solar: 0, home: 1.8, battery: 0, grid: 1.8, charging: false, batteryLabel: 'Geen batterijopslag', narrative: /volledig uit het net/ },
    { mode: 'backup', enabled: true, solar: 0, home: 0.6, battery: 0.6, grid: 0, charging: false, batteryLabel: 'AURA voedt back-up', narrative: /ontkoppelt veilig van het net/ },
    { mode: 'backup', enabled: false, solar: 0, home: 0, battery: 0, grid: 0, charging: false, batteryLabel: 'Geen back-upstroom', narrative: /geen batterij die de groepen overneemt/ },
  ];
  for (const state of cases) {
    await page.locator(`.scenario-button[data-mode="${state.mode}"]`).click();
    const toggle = page.locator('#battery-toggle');
    if ((await toggle.getAttribute('aria-pressed')) !== String(state.enabled)) await toggle.click();
    await expect(page.locator(`.scenario-button[data-mode="${state.mode}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#battery-label')).toHaveText(state.batteryLabel);
    await expect(page.locator('.flow-story')).toContainText(state.narrative);
    const shown = {};
    for (const field of ['solar', 'home', 'battery']) {
      shown[field] = numberFromText(await page.locator(`#scene-${field}`).innerText());
      assert.equal(shown[field], state[field], `${label}: ${state.mode}/${state.enabled} ${field}`);
    }
    const signedBattery = state.charging ? shown.battery : -shown.battery;
    assert.ok(Math.abs(shown.solar + state.grid - shown.home - signedBattery) < 1e-8, `${label}: rendered energy balance`);
    await expect(page.locator('#home-label')).toHaveText(state.mode === 'backup' ? 'Back-upgroepen' : 'Je woning');
    const fallback = page.locator('#scene-fallback .aura-svg-house');
    if (await fallback.isVisible()) {
      await expect(fallback).toHaveAttribute('data-mode', state.mode);
      await expect(fallback).toHaveAttribute('data-battery', String(state.enabled));
      const enabledFlows = await fallback.locator('[data-flow]:not([hidden])').evaluateAll(elements => elements.map(element => element.dataset.flow).sort());
      const expectedFlows = state.mode === 'solar' ? ['solar-house', state.enabled ? 'solar-battery' : 'grid-house'] : state.enabled ? ['battery-house'] : state.mode === 'evening' ? ['grid-house'] : [];
      assert.deepEqual(enabledFlows, expectedFlows.sort(), `${label}: fallback diagram must match the narrated flows`);
    }
    await assertNoOverflow(page, `${label}/${state.mode}/${state.enabled}`);
  }
  record(`${label}: all six energy scenarios match their visible values and conserve energy`);
}

async function setModules(page, type, count) {
  await page.locator(`.module-option:has(input[value="${type}"])`).click();
  const slider = page.locator('#module-count');
  await slider.focus();
  await slider.press('Home');
  for (let index = 1; index < count; index++) await slider.press('ArrowRight');
}

async function configurations(page, label) {
  for (const type of [7, 9]) {
    for (let count = 1; count <= 6; count++) {
      await setModules(page, type, count);
      const nominal = Math.round((type === 7 ? 7.03 : 9.04) * count * 100) / 100;
      const usable = Math.round((type === 7 ? 6.7 : 8.6) * count * 10) / 10;
      await expect(page.locator('#nominal-capacity')).toHaveText(nl(nominal));
      await expect(page.locator('#usable-capacity')).toHaveText(`${nl(usable)} kWh`);
      await expect(page.locator('#stack-count')).toHaveText(`${count}× BAT-Q${type}`);
      await expect(page.locator('#stack-modules .stack-module')).toHaveCount(count);
      await assertNoOverflow(page, `${label}/BAT-Q${type}/${count}`);
    }
  }
  record(`${label}: both module sizes and all one-to-six-module totals update correctly`);
}

async function contactJourney(page, fixture, label, type, count) {
  await setModules(page, type, count);
  const opener = page.locator('.site-header [data-open-lead]');
  await opener.click();
  await expect(page.locator('#lead-title')).toBeFocused();
  await expect(page.locator('#lead-dialog')).toHaveAttribute('aria-labelledby', 'lead-title');
  await expect(page.locator('#step-label')).toHaveText('Stap 1 van 3');
  await accessibility(page, `${label}/dialog-step-1`);
  await assertNoOverflow(page, `${label}/dialog-step-1`);
  // Native Escape close must restore the trigger's focus as well as pointer close.
  await page.keyboard.press('Escape');
  await expect(page.locator('#lead-dialog')).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await page.locator('label:has(input[name="goal"][value="backup"])').click();
  await page.locator('label:has(input[name="solar"][value="planned"])').click();
  await page.locator('#form-next').click();
  await expect(page.locator('#home-step-title')).toBeFocused();
  await expect(page.locator('#lead-dialog')).toHaveAttribute('aria-labelledby', 'home-step-title');
  const callsBefore = fixture.calls.length;
  for (const invalid of ['499', '100001', '3500.5']) {
    await page.locator('#annualUsage').fill(invalid);
    await page.locator('#form-next').click();
    await expect(page.locator('#step-label')).toHaveText('Stap 2 van 3');
    await expect(page.locator('#annualUsage')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#form-error')).toContainText('500 tot 100.000');
    await expect(page.locator('#annualUsage')).toBeFocused();
    assert.equal(fixture.calls.length, callsBefore, 'Invalid usage must never send mail');
  }
  await page.locator('#annualUsage').fill('4200');
  await page.locator('label:has(input[name="phase"][value="three"])').click();
  await page.locator('#form-next').click();
  await expect(page.locator('#contact-step-title')).toBeFocused();
  await expect(page.locator('#lead-dialog')).toHaveAttribute('aria-labelledby', 'contact-step-title');
  const nominal = Math.round((type === 7 ? 7.03 : 9.04) * count * 100) / 100;
  await expect(page.locator('#form-configuration')).toHaveText(`${nl(nominal)} kWh · ${count} ${count === 1 ? 'module' : 'modules'}`);
  await page.locator('#fullName').fill(`Browsercontrole ${label}`);
  await page.locator('#postcode').fill('1234 AB');
  await page.locator('#email').fill(`${label}@example.test`);
  await page.locator('#phone').fill('06 1234 5678');
  await page.locator('#form-submit').click();
  await expect(page.locator('#form-error')).toContainText('Geef aan dat Thuisbatterij Team contact mag opnemen');
  await expect(page.locator('#consent')).toBeFocused();
  assert.equal(fixture.calls.length, callsBefore, 'No consent must never send mail');
  await page.locator('#consent').check();
  await accessibility(page, `${label}/dialog-contact`);
  await assertNoOverflow(page, `${label}/dialog-contact`);
  await page.screenshot({ path: resolve(resultsDir, `${label}-contact.png`) });

  fixture.holdDelivery();
  const responsePromise = page.waitForResponse(response => response.url() === `${fixture.origin}/api/leads` && response.request().method() === 'POST');
  await page.locator('#form-submit').click();
  await expect.poll(() => fixture.calls.length, { timeout: 10000 }).toBe(callsBefore + 1);
  await expect(page.locator('#lead-form')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#form-submit')).toBeDisabled();
  await expect(page.locator('#success-state')).not.toBeVisible();
  fixture.releaseDelivery();
  const response = await responsePromise;
  assert.equal(response.status(), 201);
  const receipt = await response.json();
  assert.match(receipt.requestId, /^AURA-[0-9a-f-]{36}$/);
  await expect(page.locator('#success-state')).toBeVisible();
  await expect(page.locator('#lead-dialog')).toHaveAttribute('aria-labelledby', 'success-title');
  await expect(page.locator('#request-id')).toHaveText(receipt.requestId);
  await expect(page.locator('#success-title')).toBeFocused();
  const submitted = response.request().postDataJSON();
  assert.deepEqual(submitted.profile, { solar: 'planned', annualUsage: 4200, goal: 'backup', phase: 'three', moduleType: type, moduleCount: count });
  assert.equal(submitted.postcode, '1234AB');
  assert.equal(submitted.consent, true);
  assert.deepEqual(submitted.attribution, { utm_source: 'browser-qa', utm_medium: 'test' });
  const mail = fixture.calls.at(-1);
  assert.equal(mail.to, 'recipient@example.test');
  assert.equal(mail.replyTo.address, `${label}@example.test`);
  assert.match(mail.text, /Bron: https:\/\/hyxi-aura\.nl/);
  assert.ok(mail.text.includes(receipt.requestId));
  assert.ok(mail.text.includes(`${count} × BAT-Q${type}`));
  assert.equal(await page.locator('#fullName').inputValue(), '');
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
  assert.ok(!page.url().includes('example.test'), 'Contact data must not appear in the URL');
  await page.screenshot({ path: resolve(resultsDir, `${label}-success.png`) });
  await page.locator('#success-close').click();
  await expect(page.locator('#lead-dialog')).not.toBeVisible();
  await expect(opener).toBeFocused();
  assert.equal(fixture.calls.length, callsBefore + 1);
  record(`${label}: validated dialog → API → accepted SMTP recipient → matching receipt, with focus restored`);
}

try {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const live = await fixture();
  for (const viewport of [{ label: 'desktop', width: 1440, height: 1000 }, { label: 'mobile', width: 390, height: 844 }]) {
    currentCheck = viewport.label;
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: 'nl-NL', isMobile: viewport.label === 'mobile', hasTouch: viewport.label === 'mobile' });
    context.setDefaultTimeout(10000);
    context.setDefaultNavigationTimeout(30000);
    const page = await context.newPage();
    currentPage = page;
    page.on('pageerror', error => report.browserErrors.push({ viewport: viewport.label, message: error.message }));
    await page.goto(`${live.origin}/?utm_source=browser-qa&utm_medium=test`, { waitUntil: 'load' });
    await page.evaluate(async () => { await document.fonts.ready; });
    await assertImages(page, viewport.label);
    // Three source-backed product views are reachable without sacrificing the
    // existing interactive energy, configurator or lead-form journey.
    const heroProduct = page.locator('#hero-product-image');
    await expect(page.locator('.hero-view-switcher')).toBeVisible();
    for (const [view, src] of [['angle', '/images/aura-angle.webp'], ['side', '/images/aura-side.webp'], ['front', '/images/aura-front.webp']]) {
      const control = page.locator(`[data-aura-view="${view}"]`);
      await control.click();
      await expect(control).toHaveAttribute('aria-pressed', 'true');
      await expect(heroProduct).toHaveAttribute('src', src);
      await expect(heroProduct).toHaveAttribute('alt', /HYXI AURA/);
      await expect.poll(() => heroProduct.evaluate(image => image.complete && image.naturalWidth > 0), {timeout:10000}).toBe(true);
      await assertNoOverflow(page, `${viewport.label}/hero-${view}`);
    }
    record(`${viewport.label}: three official HYXI gallery views load and remain accessible`);
    await assertNoOverflow(page, viewport.label);
    await accessibility(page, `${viewport.label}/initial-page`);
    await page.screenshot({ path: resolve(resultsDir, `${viewport.label}-page.png`), fullPage: true });
    record(`${viewport.label}: no horizontal overflow, no broken visible images, initial WCAG A/AA checks`);
    await scenarios(page, viewport.label);
    await captureExperience(page, viewport.label);
    await configurations(page, viewport.label);
    await contactJourney(page, live, viewport.label, viewport.label === 'desktop' ? 7 : 9, viewport.label === 'desktop' ? 3 : 2);
    await context.close();
  }
  // Narrow-phone and tablet guards complement the complete journeys above.
  // The legal pages are tested at these widths too, where wrapping and readable
  // contrast are most likely to regress.
  for (const viewport of [{ label: 'narrow', width: 320, height: 812 }, { label: 'tablet', width: 768, height: 1024 }]) {
    currentCheck = `${viewport.label}-layout-and-legal`;
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce', locale: 'nl-NL' });
    context.setDefaultTimeout(10000);
    context.setDefaultNavigationTimeout(30000);
    const page = await context.newPage();
    currentPage = page;
    page.on('pageerror', error => report.browserErrors.push({ viewport: viewport.label, message: error.message }));
    await page.goto(live.origin);
    await assertImages(page, viewport.label);
    await assertNoOverflow(page, viewport.label);
    await setModules(page, 9, 6);
    await expect(page.locator('#nominal-capacity')).toHaveText('54,24');
    await assertNoOverflow(page, `${viewport.label}/maximum-stack`);
    if (viewport.width <= 700) {
      const [moduleChoice, preview, slider] = await Promise.all(['.module-fieldset', '.config-preview', '.count-control'].map(selector => page.locator(selector).boundingBox()));
      assert.ok(preview.y >= moduleChoice.y + moduleChoice.height - 1, 'Compact mobile preview follows module choice');
      assert.ok(slider.y >= preview.y + preview.height - 1, 'Slider follows the compact live preview');
      assert.ok(preview.height <= 260, `Mobile preview should stay compact, got ${preview.height}px`);
    }
    await page.locator('#samenstellen').screenshot({ path: resolve(resultsDir, `${viewport.label}-configurator.png`) });
    for (const legalRoute of ['/privacy/', '/bronnen/', '/offerte/']) {
      await page.goto(`${live.origin}${legalRoute}`);
      await page.evaluate(async () => { await document.fonts.ready; });
      await assertNoOverflow(page, `${viewport.label}${legalRoute}`);
      await accessibility(page, `${viewport.label}${legalRoute}`);
      await page.screenshot({ path: resolve(resultsDir, `${viewport.label}-${legalRoute.split('/')[1]}.png`), fullPage: true });
    }
    record(`${viewport.label}: layout guard, maximum configuration, privacy and source-page overflow/accessibility`);
    await context.close();
  }
  currentCheck = 'standalone-quote-journey';
  const quoteContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',locale:'nl-NL'});
  const quotePage=await quoteContext.newPage();
  currentPage=quotePage;
  quotePage.on('pageerror',error=>report.browserErrors.push({viewport:'quote',message:error.message}));
  await quotePage.goto(live.origin+'/offerte/?moduleType=7&moduleCount=3');
  await expect(quotePage.locator('#moduleType')).toHaveValue('7');
  await expect(quotePage.locator('#moduleCount')).toHaveValue('3');
  await expect(quotePage.locator('#selectionLabel')).toContainText('3 × BAT-Q7');
  await quotePage.locator('#solar').selectOption('yes');
  await quotePage.locator('#phase').selectOption('three');
  await quotePage.locator('#annualUsage').fill('3500');
  await quotePage.locator('#moduleType').selectOption('9');
  await quotePage.locator('#moduleCount').selectOption('2');
  await quotePage.locator('#projectDetails').fill('Fictieve behoefte: passende installatie beoordelen.');
  await quotePage.locator('#fullName').fill('Fictieve Browserofferte');
  await quotePage.locator('#email').fill('browserofferte@example.test');
  await quotePage.locator('#phone').fill('0612345678');
  await quotePage.locator('#postcode').fill('1234AB');
  await quotePage.locator('#consent').check();
  await assertNoOverflow(quotePage,'mobile/offerte-complete');
  await quotePage.locator('#submitQuote').click();
  await expect(quotePage.locator('#quoteResult')).toBeVisible({timeout:15000});
  await expect(quotePage.locator('#quoteReceipt')).toHaveText(/^AURA-[a-f0-9-]{36}$/);
  const sentQuote=live.calls.find(mail=>/Nieuwe offerteaanvraag/.test(mail.subject));
  assert.ok(sentQuote,'A quote must be sent via the existing API and injected SMTP transport');
  assert.match(sentQuote.text,/Fictieve behoefte: passende installatie beoordelen/);
  await accessibility(quotePage,'mobile/offerte-confirmation');
  await quotePage.screenshot({path:resolve(resultsDir,'mobile-offerte-success.png'),fullPage:true});
  record('Standalone quote: responsive form → CSRF API → quote-classified mail → matching receipt');
  await quoteContext.close();
  currentCheck = 'no-webgl-fallback';
  const fallbackContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', locale: 'nl-NL' });
  fallbackContext.setDefaultTimeout(10000);
  fallbackContext.setDefaultNavigationTimeout(30000);
  await fallbackContext.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (['webgl', 'webgl2', 'experimental-webgl'].includes(type)) return null;
      return originalGetContext.call(this, type, ...args);
    };
  });
  const fallbackPage = await fallbackContext.newPage();
  currentPage = fallbackPage;
  fallbackPage.on('pageerror', error => report.browserErrors.push({ viewport: 'no-webgl', message: error.message }));
  await fallbackPage.goto(live.origin);
  await fallbackPage.locator('#experience-card').scrollIntoViewIfNeeded();
  await expect(fallbackPage.locator('#energy-scene')).toHaveAttribute('data-ready', 'fallback');
  await expect(fallbackPage.locator('#scene-fallback .aura-svg-house')).toBeVisible();
  await expect(fallbackPage.locator('#energy-scene canvas')).toHaveCount(0);
  await scenarios(fallbackPage, 'no-webgl');
  await captureExperience(fallbackPage, 'no-webgl');
  await fallbackPage.screenshot({ path: resolve(resultsDir, 'mobile-no-webgl.png') });
  record('WebGL unavailable: architectural SVG and all six scenarios remain functional');
  await fallbackContext.close();
  currentCheck = 'disabled-mail-fallback';
  const unavailable = await fixture({ enabled: false });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', locale: 'nl-NL' });
  context.setDefaultTimeout(10000);
  context.setDefaultNavigationTimeout(30000);
  const page = await context.newPage();
  currentPage = page;
  await page.goto(unavailable.origin);
  await page.locator('.site-header [data-open-lead]').click();
  await page.locator('#form-next').click();
  await page.locator('#annualUsage').fill('');
  await page.locator('#form-next').click();
  await expect(page.locator('#form-submit')).toBeDisabled();
  await expect(page.locator('#unavailable-contact')).toBeVisible();
  await expect(page.locator('#form-error')).toContainText('Online aanvragen is op dit moment niet beschikbaar');
  await expect(page.locator('#unavailable-contact a[href^="tel:"]')).toHaveAttribute('href', 'tel:+31858000563');
  assert.equal(new URL(await page.locator('#unavailable-contact a[href^="https:"]').getAttribute('href')).hostname, 'thuisbatterijteam.nl');
  assert.equal(unavailable.calls.length, 0);
  await assertNoOverflow(page, 'disabled-mail-fallback');
  await page.screenshot({ path: resolve(resultsDir, 'mobile-disabled-fallback.png') });
  record('Disabled mail: clear direct-contact fallback, no false receipt and no mail');
  await context.close();
  assert.deepEqual(report.browserErrors, [], 'Unexpected browser exceptions');
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.failedCheck = currentCheck;
  report.error = error.stack || String(error);
  if (currentPage && !currentPage.isClosed()) await currentPage.screenshot({ path: resolve(resultsDir, 'failure.png'), fullPage: true }).catch(() => {});
  console.error(report.error);
  process.exitCode = 1;
} finally {
  for (const item of fixtures) item.releaseDelivery();
  const cleanup = await Promise.allSettled([browser?.close(), ...fixtures.map(item => item.close())]);
  const cleanupErrors = cleanup.filter(item => item.status === 'rejected').map(item => String(item.reason));
  if (cleanupErrors.length) {
    report.cleanupErrors = cleanupErrors;
    report.status = 'failed';
    process.exitCode = 1;
  }
  report.finishedAt = new Date().toISOString();
  await writeFile(resolve(resultsDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Browser report: ${resolve(resultsDir, 'report.json')}`);
}
