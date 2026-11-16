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
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.pdf':'application/pdf' };
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
  for (const slug of ['bat-q7-vs-bat-q9', 'noodstroom']) {
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
} finally {
  await browser?.close();
  await new Promise(r=>http.close(r));
}
