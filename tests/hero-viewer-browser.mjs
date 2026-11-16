/**
 * Phase 5 visual acceptance: screenshots, stable official-product silhouette
 * geometry, pointer/touch/button/reduced-motion/no-JS.
 * Static built public assets only; never submit live or synthetic leads.
 */
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolve, extname } from 'node:path';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const dist = resolve(import.meta.dirname, '../dist');
const screenshots = resolve(import.meta.dirname, '../test-results/browser');
await mkdir(screenshots, { recursive: true });
const contentTypes = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.webp':'image/webp',
  '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2'
};
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    if (path.includes('..') || path.startsWith('/api/')) throw new Error('Not a public path');
    const dest = resolve(dist, '.' + path, path.endsWith('/') ? 'index.html' : '');
    if (!dest.startsWith(dist + '/')) throw new Error('Unsafe path');
    const bytes = await readFile(dest);
    response.writeHead(200, {'Content-Type':contentTypes[extname(dest)] || 'application/octet-stream'});
    response.end(bytes);
  } catch {
    response.writeHead(404); response.end();
  }
});
server.listen(0,'127.0.0.1');
await once(server,'listening');
const base = 'http://127.0.0.1:' + server.address().port;

async function productMetrics(page) {
  return page.locator('#hero-product-image').evaluate(image => {
    const sourceBounds = {
      front:{l:0,r:699,t:0,b:999},
      angle:{l:778,r:1295,t:1,b:852},
      side:{l:514,r:1082,t:1,b:931}
    };
    const bounds = sourceBounds[image.dataset.auraAngle];
    const stageRect = document.getElementById('hero-product-stage').getBoundingClientRect();
    const imgRect = image.getBoundingClientRect();
    const ratio = imgRect.height / image.naturalHeight;
    return {
      name:image.dataset.auraAngle,
      top:imgRect.top + bounds.t * ratio - stageRect.top,
      bottom:imgRect.top + bounds.b * ratio - stageRect.top,
      center:imgRect.left + (bounds.l + bounds.r) * ratio / 2 - stageRect.left - stageRect.width / 2,
      height:(bounds.b - bounds.t) * ratio,
      naturalWidth:image.naturalWidth,
      loaded:image.complete && image.naturalWidth > 0
    };
  });
}
function sameSilhouette(reference, subject, label) {
  for (const key of ['top','bottom','center','height']) {
    const delta = Math.abs(reference[key] - subject[key]);
    assert.ok(delta < 3.5, label + ' changed ' + key + ' by ' + delta.toFixed(2) + 'px');
  }
}
async function noOverflow(page, label) {
  const values=await page.evaluate(()=>({view:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  assert.ok(values.document<=values.view+1 && values.body<=values.view+1, label + ' overflow ' + JSON.stringify(values));
}

let browser;
try {
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined});
  for (const width of [1440,768,390,320]) {
    const context=await browser.newContext({viewport:{width,height:width>700?1000:844},reducedMotion:'reduce',locale:'nl-NL'});
    const page=await context.newPage();
    const response=await page.goto(base+'/');
    assert.equal(response.status(),200);
    await page.evaluate(async()=>{await document.fonts.ready});
    await expect(page.locator('.site-header .presenter-owner')).toHaveText('Thuisbatterij Team');
    await expect(page.locator('.site-header .presenter-verb')).toHaveText('presenteert');
    await expect(page.locator('.site-header .presenter-product')).toHaveText('HYXI AURA');
    await expect(page.locator('.hero-view-switcher')).toBeVisible();
    const brand=await page.locator('.site-header .presenter-brand').boundingBox();
    const cta=await page.locator('.site-header>.button').boundingBox();
    assert.ok(brand.x+brand.width<=cta.x+1,'header brand/CTA overlap at '+width);
    const initial=await productMetrics(page);
    assert.equal(initial.name,'front');
    assert.equal(initial.loaded,true);
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:resolve(screenshots,'phase5-hero-'+width+'-page.png')});
    for(const [name,source] of [
      ['side','/images/aura-side.webp'],['front','/images/aura-front.webp'],['angle','/images/aura-angle.webp']
    ]){
      const button=page.locator('[data-aura-view="'+name+'"]');
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed','true');
      await expect(page.locator('#hero-product-stage')).toHaveAttribute('data-active-view',name);
      const image=page.locator('#hero-product-image');
      await expect(image).toHaveAttribute('src',source);
      await expect(image).toHaveAttribute('alt',/HYXI AURA/);
      const metrics=await productMetrics(page);
      assert.equal(metrics.loaded,true);
      sameSilhouette(initial,metrics,'hero '+width+'px '+name);
      await page.locator('.hero-visual').screenshot({path:resolve(screenshots,'phase5-view-'+width+'-'+name+'.png')});
      await noOverflow(page,'hero '+width+'px '+name);
    }
    const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map(x=>({id:x.id,nodes:x.nodes.map(y=>y.target)})),[],'WCAG A/AA violations '+width);
    console.log('PASS hero '+width+'px: TBT brand, all views precisely aligned, no overflow, WCAG A/AA');
    await context.close();
  }

  // Hover must work only when motion preferences allow it.
  {
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
    const page=await context.newPage();
    await page.goto(base+'/');
    const stage=page.locator('#hero-product-stage');
    await stage.scrollIntoViewIfNeeded();
    const box=await stage.boundingBox();
    for(const [ratio,view] of [[.12,'side'],[.50,'front'],[.88,'angle']]){
      await page.mouse.move(box.x+box.width*ratio,box.y+box.height*.5,{steps:5});
      await expect(stage).toHaveAttribute('data-active-view',view,{timeout:12000});
    }
    console.log('PASS natural pointer transitions side → front → angle');
    await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.goto(base+'/');
    const stage=page.locator('#hero-product-stage');
    const rect=await stage.boundingBox();
    await page.mouse.move(rect.x+rect.width*.1,rect.y+rect.height*.5);
    await page.waitForTimeout(220);
    await expect(stage).toHaveAttribute('data-active-view','front');
    await page.locator('[data-aura-view="side"]').click();
    await expect(stage).toHaveAttribute('data-active-view','side');
    console.log('PASS reduced motion: no mouse rotation, manual button works');
    await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'no-preference'});
    const page=await context.newPage();
    await page.goto(base+'/');
    const stage=page.locator('#hero-product-stage');
    await stage.scrollIntoViewIfNeeded();
    const rect=await stage.boundingBox();
    const x=rect.x+rect.width*.65,y=rect.y+rect.height*.5;
    const cdp=await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-110,y:y+2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect(stage).toHaveAttribute('data-active-view','angle',{timeout:12000});
    console.log('PASS real mobile horizontal swipe: front → angle');
    await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false});
    const page=await context.newPage();
    await page.goto(base+'/');
    await expect(page.locator('#hero-product-image')).toBeVisible();
    await expect(page.locator('#hero-product-image')).toHaveAttribute('src','/images/aura-front.webp');
    await expect(page.locator('.hero-view-switcher')).toBeHidden();
    await expect(page.locator('.presenter-brand')).toContainText('Thuisbatterij');
    console.log('PASS no-JS front fallback');
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
