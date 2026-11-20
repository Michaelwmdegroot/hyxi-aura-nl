import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PUBLIC_CANONICAL_PATHS } from '../server/app.mjs';

const root = resolve(import.meta.dirname,'..');
const glyph = /[\u2190-\u21FF\u27F0-\u27FF\u2794\u27A1\u27A4\u2900-\u297F]/u;
const arrowIcon = /\/icons\.svg#(?:arrow|chevron)(?:-[a-z0-9-]+)?/i;

test('all 31 public pages contain no decorative arrow icons or characters', async () => {
  assert.equal(PUBLIC_CANONICAL_PATHS.size, 31);
  for (const route of PUBLIC_CANONICAL_PATHS) {
    const html = await readFile(resolve(root,'dist',route.slice(1),'index.html'),'utf8');
    assert.doesNotMatch(html,glyph,'Arrow glyph on '+route);
    assert.doesNotMatch(html,arrowIcon,'Arrow SVG on '+route);
  }
});

test('primary advice CTA remains while the retired quote link and generated arrows stay absent', async()=>{
  const [home,app,faq] = await Promise.all([
    readFile(resolve(root,'index.html'),'utf8'),
    readFile(resolve(root,'src/app.mjs'),'utf8'),
    readFile(resolve(root,'scripts/content.mjs'),'utf8'),
  ]);
  const [css,server] = await Promise.all([
    readFile(resolve(root,'src/offerings.css'),'utf8'),
    readFile(resolve(root,'server/app.mjs'),'utf8'),
  ]);
  assert.match(home,/name="hyxi-ui-release" content="secondary-offer-link-removed-r4"/);
  assert.doesNotMatch(home,/data-quote-link|config-quote-link|Offerte voor deze opstelling/);
  assert.match(css,/config-controls > p:has\(> \.config-quote-link\)/);
  assert.match(app,/document\.querySelectorAll\('\.config-quote-link, \[data-quote-link\]'\)/);
  assert.match(server,/res\.set\('CDN-Cache-Control', 'no-store'\)/);
  assert.match(home,/data-open-lead/);
  assert.match(home,/Ontvang advies over deze opstelling/);
  assert.doesNotMatch(home,/<p class="config-note">/);
  assert.doesNotMatch(app,/icon\(['"](?:arrow|chevron)/);
  assert.doesNotMatch(faq,glyph);
});
