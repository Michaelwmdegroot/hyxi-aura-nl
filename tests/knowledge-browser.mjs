/**
 * Static knowledge article checks in Chromium, independently of live mail/DB.
 * Production bundle only; includes 1440, 390 and 320 px screenshots and WCAG.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const dist = resolve(import.meta.dirname, '../dist');
const dir = resolve(import.meta.dirname, '../test-results/browser');
await readFile(resolve(dist, 'kennis/noodstroom/index.html'));
await mkdir(dir, { recursive: true });
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.pdf':'application/pdf' };
const http = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const pathname = decodeURIComponent(url.pathname);
  if (pathname.includes('..') || pathname.startsWith('/api/')) { response.writeHead(404); response.end(); return; }
  const dest = resolve(dist, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '');
  if (!dest.startsWith(dist + '/')) { response.writeHead(404); response.end(); return; }
  try {
    const bytes = await readFile(dest);
    response.writeHead(200, { 'Content-Type': types[extname(dest)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff' });
    response.end(bytes);
  } catch { response.writeHead(404); response.end(); }
});
http.listen(0, '127.0.0.1');
await once(http,'listening');
const origin = `http://127.0.0.1:${http.address().port}`;
let browser;
try {
  browser = await chromium.launch({headless:true, executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined});
  for (const slug of ['bat-q7-vs-bat-q9', 'noodstroom', '1-fase-of-3-fasen']) {
    for (const width of [1440,390,320]) {
      const ctx = await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',locale:'nl-NL'});
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const response = await page.goto(origin + '/kennis/' + slug + '/');
      assert.equal(response.status(),200,slug);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main article')).toHaveCount(1);
      await expect(page.locator('a[href="/offerte/"]').first()).toBeVisible();
      await expect(page.locator('.hero-actions a[href="/#samenstellen"]')).toBeVisible();
      const photo = page.locator('.product-stage img');
      await expect.poll(() => photo.evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
      const sizes = await page.evaluate(() => ({innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth}));
      assert.ok(sizes.scrollWidth <= sizes.innerWidth+1 && sizes.bodyWidth <= sizes.innerWidth+1, `${slug} ${width}: horizontal overflow ${JSON.stringify(sizes)}`);
      const axe = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
      assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],`${slug} ${width} WCAG failure`);
      assert.deepEqual(errors,[],`${slug} ${width} runtime error`);
      await page.screenshot({path:resolve(dir,`knowledge-${slug}-${width}.png`),fullPage:true});
      console.log(`PASS knowledge ${slug} ${width}px — image, CTA, no overflow, WCAG A/AA`);
      await ctx.close();
    }
  }

  // Distinct editorial buyer-intent pages. These are real HTML, not JS-stubs;
  // check legibility, link intent, source access, mobile overflow and WCAG.
  for (const target of [
    {url:'/modellen/',slug:'modellen'},
    {url:'/datasheet/',slug:'datasheet'},
    {url:'/kennis/prijs-en-installatie/',slug:'prijs-en-installatie'},
    {url:'/kennis/bestaande-zonnepanelen/',slug:'bestaande-zonnepanelen'},
    {url:'/kennis/garantie/',slug:'garantie'}
  ]) {
    for (const width of [1440,390,320]) {
      const ctx=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',locale:'nl-NL'});
      const page=await ctx.newPage();
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      const response=await page.goto(origin+target.url);
      assert.equal(response.status(),200,target.url);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('main > article')).toHaveCount(1);
      await expect(page.locator('.hero-actions a[href="/offerte/"]')).toBeVisible();
      await expect(page.locator('a[href="/bronnen/"]').first()).toBeVisible();
      const photo=page.locator('.product-stage img');
      await expect.poll(()=>photo.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
      const sizes=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth}));
      assert.ok(sizes.scrollWidth<=sizes.innerWidth+1&&sizes.bodyWidth<=sizes.innerWidth+1,`${target.slug} ${width}px overflow: ${JSON.stringify(sizes)}`);
      const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
      assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],`${target.slug} ${width}px WCAG violation`);
      assert.deepEqual(errors,[],`${target.slug} ${width}px runtime errors`);
      await page.screenshot({path:resolve(dir,`topic-${target.slug}-${width}.png`),fullPage:true});
      console.log(`PASS topic ${target.slug} ${width}px — source, conversion CTA, no overflow, WCAG A/AA`);
      await ctx.close();
    }
  }

  // Independent 3-question installation guide: native GET + existing quote handoff.
  // No live leads, PII or SMTP are submitted by this browser test.
  for (const width of [1440,390,320]) {
    const ctx=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',locale:'nl-NL'});
    const page=await ctx.newPage();
    const failures=[];
    page.on('pageerror',error=>failures.push(error.message));
    const response=await page.goto(origin+'/kennis/installatiecheck/');
    assert.equal(response.status(),200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('#installation-check-form')).toBeVisible();
    await page.locator('label:has(input[name="solar"][value="yes"])').click();
    await page.locator('label:has(input[name="phase"][value="three"])').click();
    await page.locator('label:has(input[name="goal"][value="backup"])').click();
    await expect(page.locator('#check-preview-summary')).toContainText('Bestaande zonnepanelen');
    await expect(page.locator('#check-preview-summary')).toContainText('3-fasenaansluiting');
    await expect(page.locator('#check-preview-summary')).toContainText('noodstroom');
    const geom=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
    assert.ok(geom.document<=geom.width+1&&geom.body<=geom.width+1,`installation check ${width}: overflow ${JSON.stringify(geom)}`);
    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],`installation check ${width} WCAG violations`);
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({path:resolve(dir,`installation-check-${width}.png`),fullPage:true});
    await page.locator('#installation-check-form button[type="submit"]').click();
    await expect(page).toHaveURL(/\/offerte\/\?solar=yes&phase=three&goal=backup/);
    await expect(page.locator('#solar')).toHaveValue('yes');
    await expect(page.locator('#phase')).toHaveValue('three');
    await expect(page.locator('#goal')).toHaveValue('backup');
    await expect(page.locator('#check-prefill-note')).toBeVisible();
    assert.deepEqual(failures,[],`installation check ${width} page errors`);
    console.log(`PASS installation check ${width}px: sources/choices, WCAG, responsive and real quote prefilling`);
    await ctx.close();
  }
} finally {
  await browser?.close();
  await new Promise(r=>http.close(r));
}
