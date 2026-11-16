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
      angle:{l:790,r:1315,t:1,b:865},
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
    // Both words on exactly ONE second line, visually contained under the
    // full 'Thuisbatterij Team' wordmark — even on 320px screens.
    const owner = await page.locator('.site-header .presenter-owner').boundingBox();
    const subtitle = await page.locator('.site-header .presenter-subline').boundingBox();
    const verb = await page.locator('.site-header .presenter-verb').boundingBox();
    const product = await page.locator('.site-header .presenter-product').boundingBox();
    assert.ok(subtitle.y >= owner.y + owner.height - 2, 'Presenter subline must sit BELOW the owner name at ' + width);
    assert.ok(Math.abs(verb.y - product.y) < 4, 'Presenter words must be on the same baseline at ' + width);
    assert.ok(subtitle.x >= owner.x - 2 && subtitle.x + subtitle.width <= owner.x + owner.width + 2,
      'Presenter subline must fit within TBT brand width at ' + width);
    await expect(page.locator('.hero-view-switcher')).toHaveCount(0);
    await expect(page.locator('.hero-view-instruction')).toHaveCount(0);
    await expect(page.locator('#hero-product-stage')).toHaveAttribute('role','slider');
    const brand=await page.locator('.site-header .presenter-brand').boundingBox();
    const cta=await page.locator('.site-header>.button').boundingBox();
    assert.ok(brand.x+brand.width<=cta.x+1,'header brand/CTA overlap at '+width);
    const initial=await productMetrics(page);
    assert.equal(initial.name,'front');
    assert.equal(initial.loaded,true);
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:resolve(screenshots,'phase5-hero-'+width+'-page.png')});
    const stage=page.locator('#hero-product-stage');
    await stage.focus();
    for(const [key,name,source,ordinal] of [
      ['Home','side','/images/aura-side.webp','0'],
      ['ArrowRight','front','/images/aura-front.webp','1'],
      ['End','angle','/images/aura-angle.webp','2']
    ]){
      await stage.press(key);
      await expect(stage).toHaveAttribute('data-active-view',name);
      await expect(stage).toHaveAttribute('aria-valuenow',ordinal);
      const image=page.locator('#hero-product-image');
      await expect(image).toHaveAttribute('src',source);
      await expect(image).toHaveAttribute('alt',/HYXI AURA/);
      const metrics=await productMetrics(page);
      assert.equal(metrics.loaded,true);
      sameSilhouette(initial,metrics,'hero '+width+'px '+name);
      await page.locator('.hero-visual').screenshot({path:resolve(screenshots,'phase5-view-'+width+'-'+name+'.png')});
      await noOverflow(page,'hero '+width+'px '+name);
    }
    // The pre-existing white 'AURA' wordmark is explicitly aria-hidden and purely
    // decorative backdrop art; WCAG 1.4.3 expressly exempts such text from
    // contrast. Test every meaningful foreground element without this false positive.
    const axe=await new AxeBuilder({page}).exclude('.hero-watermark').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
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
    await expect(stage).toHaveAttribute('data-gsap-ready','true');
    await stage.scrollIntoViewIfNeeded();
    const box=await stage.boundingBox();
    // Zones are measured against the visible FRONT silhouette, not the stage.
    const bodyHeight=await stage.evaluate(el=>Number.parseFloat(getComputedStyle(el.parentElement).getPropertyValue('--aura-body-height')));
    const bodyWidth=bodyHeight*.699,bodyLeft=box.x+(box.width-bodyWidth)/2;
    const moveTo=async u=>page.mouse.move(bodyLeft+bodyWidth*u,box.y+box.height*.5,{steps:5});
    await moveTo(.50);
    await moveTo(.90);
    await page.waitForTimeout(55);
    const inFlight=Number(await stage.getAttribute('data-orbit-pose'));
    assert.ok(inFlight > .015 && inFlight < .99, 'GSAP orbit should be mid-animation, was ' + inFlight);
    await expect(stage).toHaveAttribute('data-active-view','angle',{timeout:12000});
    const poseAfter=Number(await stage.getAttribute('data-orbit-pose'));
    assert.ok(poseAfter > inFlight, 'Orbit must keep easing after initial pointer event');
    const transformed=await page.locator('#hero-product-pivot').evaluate(node=>getComputedStyle(node).transform);
    assert.match(transformed,/^matrix3d\(/, 'Visible HYXI photo pivot should use subtle CSS perspective');
    for(const [ratio,view] of [[.10,'side'],[.40,'front'],[.60,'front'],[.90,'angle'],[.50,'front']]){
      await moveTo(ratio);
      await expect(stage).toHaveAttribute('data-active-view',view,{timeout:12000});
      // The last frame of a completed GSAP dissolve must have exactly one
      // visible photo (avoid persistent double-exposure).
      const visiblePhotos = await page.locator('#hero-product-pivot').evaluate(el =>
        [...el.querySelectorAll('.hero-product')].filter(img => Number(getComputedStyle(img).opacity) > .05).length);
      assert.equal(visiblePhotos,1,'An orbit position must finish with one full product photo');
    }
    // A fast reversal must always finish at the *latest* requested angle,
    // not a stale image resolved by an earlier load/tween.
    await moveTo(.1);
    await moveTo(.9);
    await expect(stage).toHaveAttribute('data-active-view','angle',{timeout:12000});
    await expect(stage).toHaveAttribute('data-active-zone','right');
    await page.mouse.move(100,300);
    await expect(stage).toHaveAttribute('data-active-view','front',{timeout:12000});
    console.log('PASS left/middle/right product zones, GSAP orbit, center band and front reset');
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
    assert.equal(await stage.getAttribute('data-orbit-pose'), null, 'Reduced-motion must not animate 2.5D tilt');
    await stage.focus();
    await stage.press('ArrowLeft');
    await expect(stage).toHaveAttribute('data-active-view','side');
    await expect(stage).toHaveAttribute('aria-valuetext','Linkerhoek');
    console.log('PASS reduced motion: mouse ignored, keyboard product control works');
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
    const visibleHeight=await stage.evaluate(el=>Number.parseFloat(getComputedStyle(el.parentElement).getPropertyValue('--aura-body-height')));
    const visibleWidth=visibleHeight*.699,visibleLeft=rect.x+(rect.width-visibleWidth)/2;
    for(const [fraction,view] of [[.1,'side'],[.5,'front'],[.9,'angle']]){
      const tapX=visibleLeft+visibleWidth*fraction;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tapX,y}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await expect(stage).toHaveAttribute('data-active-view',view,{timeout:12000});
    }
    console.log('PASS mobile swipe and left/middle/right tapping on the product itself');
    await context.close();
  }
  // If the locally vendored GSAP is unexpectedly unavailable, users still get
  // a working native click/swipe product gallery without broken frames.
  {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    await page.route('**/vendor/gsap.min.js', route=>route.abort());
    await page.goto(base+'/');
    const stage=page.locator('#hero-product-stage');
    await expect(page.locator('.hero-view-switcher')).toHaveCount(0);
    await stage.focus();
    await stage.press('End');
    await expect(stage).toHaveAttribute('data-active-view','angle');
    await expect(page.locator('#hero-product-image')).toHaveAttribute('src','/images/aura-angle.webp');
    assert.equal(await stage.getAttribute('data-gsap-ready'),null);
    console.log('PASS no-GSAP fallback: keyboard product slider remains functional');
    await context.close();
  }
  // Broken photo: preserve the last successful, loaded manufacturer product.
  {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    await page.route('**/images/aura-side.webp', route=>route.abort());
    await page.goto(base+'/');
    await page.locator('#hero-product-stage').focus();
    await page.locator('#hero-product-stage').press('Home');
    await page.waitForTimeout(300);
    await expect(page.locator('#hero-product-stage')).toHaveAttribute('data-active-view','front');
    await expect(page.locator('#hero-product-image')).toHaveAttribute('src','/images/aura-front.webp');
    console.log('PASS image failure: original complete front view remains visible');
    await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false});
    const page=await context.newPage();
    await page.goto(base+'/');
    await expect(page.locator('#hero-product-image')).toBeVisible();
    await expect(page.locator('#hero-product-image')).toHaveAttribute('src','/images/aura-front.webp');
    await expect(page.locator('.hero-view-switcher')).toHaveCount(0);
    await expect(page.locator('#hero-product-stage')).not.toHaveAttribute('role','slider');
    await expect(page.locator('.presenter-brand')).toContainText('Thuisbatterij');
    console.log('PASS no-JS front fallback');
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
