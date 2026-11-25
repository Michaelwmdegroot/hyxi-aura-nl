import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sourceUrls } from '../src/product-data.mjs';

const root = new URL('../', import.meta.url);
const file = async path => readFile(new URL(path, root), 'utf8');
const base = 'https://hyxi-aura.nl';
const routes = ['noodstroom', '1-fase-of-3-fasen'];

test('each knowledge article is independently useful, canonical, sourced and indexable', async () => {
  for (const slug of routes) {
    const html = await file(`kennis/${slug}/index.html`);
    const url = `${base}/kennis/${slug}/`;
    assert.match(html, /<html lang="nl">/);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
    assert.match(html, /<main id="main">/);
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
    assert.ok(html.includes(`<meta property="og:url" content="${url}">`));
    assert.match(html, /<meta name="robots" content="index, follow, max-image-preview:large">/);
    assert.match(html, /href="\/offerte\/"/);
    assert.match(html, /href="\/#samenstellen"/);
    assert.match(html, /Preliminary/);
    assert.match(html, /NIVO Groep Holland B\.V\./);
    assert.ok(html.includes(sourceUrls.product));
    assert.ok(html.includes(sourceUrls.localSinglePhase));
    assert.ok(html.includes(sourceUrls.localThreePhase));
    assert.doesNotMatch(html, /<script(?![^>]*type="application\/ld\+json"|[^>]*src="\/src\/ads-consent\.mjs"|[^>]*src="\/src\/navigation\.mjs")/);
    assert.doesNotMatch(html, /\sstyle=/i);
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(match, `${slug} structured data present`);
    const json = JSON.parse(match[1]);
    const article = json['@graph'].find(item => item['@type'] === 'Article');
    assert.equal(article.mainEntityOfPage['@id'], url);
    assert.ok(json['@graph'].some(item => item['@type'] === 'BreadcrumbList'));
  }
});

test('retired Q7/Q9 guide is excluded from commercial links and the five-package model overview is available', async () => {
  const [home, models, sitemap] = await Promise.all([file('index.html'), file('modellen/index.html'), file('public/sitemap.xml')]);
  assert.doesNotMatch(home, /href="\/kennis\/bat-q7-vs-bat-q9\/"/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/hyxi-aura\.nl\/kennis\/bat-q7-vs-bat-q9\/<\/loc>/);
  assert.match(models, /BAT-Q9/);
  assert.match(models, /vijf BAT-Q9/i);
});

test('public discovery includes both guides and links back to conversion flows', async () => {
  const [home, sitemap, config] = await Promise.all([file('index.html'),file('public/sitemap.xml'),file('vite.config.mjs')]);
  for (const slug of routes) {
    const path = `/kennis/${slug}/`;
    assert.ok(home.includes(`href="${path}"`), path);
    assert.ok(sitemap.includes(`<loc>${base}${path}</loc>`), path);
    assert.ok(config.includes(`'kennis/${slug}/index.html'`), path);
  }
  assert.equal((sitemap.match(/<loc>/g) || []).length,30);
});

test('horizontally scrollable knowledge tables have keyboard focus and accessible names', async () => {
  for (const slug of routes) {
    const html = await file(`kennis/${slug}/index.html`);
    const regions = [...html.matchAll(/<div class="table-wrap"([^>]*)>/g)];
    assert.ok(regions.length > 0, slug);
    for (const [, attributes] of regions) {
      assert.match(attributes, /tabindex="0"/);
      assert.match(attributes, /role="region"/);
      assert.match(attributes, /aria-label="[^"]+"/);
    }
  }
});

test('installation check is an original semantic information route with a native GET handoff and no PII',async()=>{
  const [html,sitemap,quote,js]=await Promise.all([
    file('kennis/installatiecheck/index.html'),file('public/sitemap.xml'),file('offerte/index.html'),file('kennis/installatiecheck/installatiecheck.mjs')
  ]);
  assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1);
  assert.ok(html.includes('<form class="check-form" id="installation-check-form" action="/offerte/" method="get">'));
  assert.ok(sitemap.includes('<loc>https://hyxi-aura.nl/kennis/installatiecheck/</loc>'));
  assert.match(html,/Preliminary/);
  for(const name of ['solar','phase','goal'])assert.ok(html.includes(`name="${name}"`));
  for(const name of ['fullName','email','phone','postcode'])assert.doesNotMatch(html,new RegExp(`name="${name}"`));
  assert.ok(quote.includes('id="check-prefill-note"'));
  assert.ok(js.includes('new FormData(form)'));
});

test('pre-GSC phase comparison is independently useful and excludes suspect manufacturer typos',async()=>{
  const [guide,source,privacy,home]=await Promise.all([
    file('kennis/1-fase-of-3-fasen/index.html'),file('bronnen/index.html'),
    file('privacy/index.html'),file('index.html')
  ]);
  assert.ok(guide.length>10000, 'A separate substantive technical guide, not a doorway stub');
  assert.match(guide,/3–12 kW/);
  assert.match(guide,/5–30 kW/);
  assert.match(guide,/63 A doorlaatstroom/);
  assert.match(guide,/0 ms omschakeltijd/);
  assert.match(guide,/geen afzonderlijke back-upgateway/);
  assert.match(guide,/Preliminary V2\.1/);
  assert.match(guide,/verdachte PV-invoerwaarde van 160000 W/);
  assert.match(guide,/Neem die fouten niet over als definitieve specificaties/);
  assert.ok(home.includes('href="/kennis/1-fase-of-3-fasen/"'));
  for(const fragment of ['id="verschil"','id="omvormers"','id="bestaande-pv"','id="noodstroom"','id="checklist"','id="bronnen"'])
    assert.ok(guide.includes(fragment), fragment);
  assert.match(source,/160000 W/);
  assert.match(source,/onterecht.*HSA2/);
  assert.match(source,/Bronnen gecontroleerd op 16 november 2026/);
  assert.match(privacy,/Odoo CRM/);
  assert.match(privacy,/versie 16 november 2026/);
});

test('all standalone pages identify Thuisbatterij Team as the commercial presenter',async()=>{
  for(const route of [
    'bronnen/index.html','privacy/index.html','offerte/index.html',
    'kennis/noodstroom/index.html',
    'kennis/installatiecheck/index.html','kennis/1-fase-of-3-fasen/index.html'
  ]){
    const html=await file(route);
    assert.match(html,/class="brand secondary-presenter"/,route);
    assert.match(html,/class="tbt-wordmark" src="\/assets\/thuisbatterijteam-logo\.svg"/,route);
    assert.match(html,/presenteert/,route);
    assert.match(html,/HYXI AURA/,route);
    assert.ok(html.includes('/src/secondary-brand.css'),route);
  }
});
