import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MODULES, sourceUrls } from '../src/product-data.mjs';

const root = new URL('../', import.meta.url);
const file = async path => readFile(new URL(path, root), 'utf8');
const base = 'https://hyxi-aura.nl';
const routes = ['bat-q7-vs-bat-q9', 'noodstroom'];
const nl = value => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(value);

test('each knowledge article is independently useful, canonical, sourced and indexable', async () => {
  for (const slug of routes) {
    const html = await file(`kennis/${slug}/index.html`);
    const url = `${base}/kennis/${slug}/`;
    assert.match(html, /<html lang="nl">/);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
    assert.match(html, /<main id="main">/);
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
    assert.ok(html.includes(`<meta property="og:url" content="${url}">`));
    assert.match(html, /<meta name="robots" content="index, follow">/);
    assert.match(html, /href="\/offerte\/"/);
    assert.match(html, /href="\/#samenstellen"/);
    assert.match(html, /Preliminary/);
    assert.match(html, /NIVO Groep Holland B\.V\./);
    assert.ok(html.includes(sourceUrls.product));
    assert.ok(html.includes(sourceUrls.localSinglePhase));
    assert.ok(html.includes(sourceUrls.localThreePhase));
    assert.doesNotMatch(html, /<script(?![^>]*type="application\/ld\+json")/);
    assert.doesNotMatch(html, /\sstyle=/i);
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(match, `${slug} structured data present`);
    const json = JSON.parse(match[1]);
    const article = json['@graph'].find(item => item['@type'] === 'Article');
    assert.equal(article.mainEntityOfPage['@id'], url);
    assert.ok(json['@graph'].some(item => item['@type'] === 'BreadcrumbList'));
  }
});

test('Q7/Q9 article capacity numbers agree with the single source of product truth', async () => {
  const html = await file('kennis/bat-q7-vs-bat-q9/index.html');
  for (const type of [7,9]) {
    const data = MODULES[type];
    for (const val of [data.nominal, data.usable, data.power]) {
      assert.ok(html.includes(`${nl(val)} kW`) || html.includes(`${nl(val)} kWh`), `missing module fact ${type}: ${val}`);
    }
    for (const count of [1,2,3,6]) assert.ok(html.includes(`${nl(data.usable * count)} kWh`), `missing usable capacity ${type}x${count}`);
  }
  assert.match(html,/geen voorspellingen van autonomie, besparing of terugverdientijd/i);
});

test('public discovery includes both guides and links back to conversion flows', async () => {
  const [home, sitemap, config] = await Promise.all([file('index.html'),file('public/sitemap.xml'),file('vite.config.mjs')]);
  for (const slug of routes) {
    const path = `/kennis/${slug}/`;
    assert.ok(home.includes(`href="${path}"`), path);
    assert.ok(sitemap.includes(`<loc>${base}${path}</loc>`), path);
    assert.ok(config.includes(`'kennis/${slug}/index.html'`), path);
  }
  assert.equal((sitemap.match(/<loc>/g) || []).length,6);
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
