import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');

test('homepage shows genuine Thuisbatterij Team reviews and labels the correct service',async()=>{
  const source=await readFile(resolve(root,'index.html'),'utf8');
  const dist=await readFile(resolve(root,'dist/index.html'),'utf8');
  for(const html of [source,dist]){
    assert.match(html,/<section class="section reviews-section" id="ervaringen" aria-labelledby="reviews-title">/);
    assert.match(html,/<h2 id="reviews-title">/);
    assert.match(html,/Momentopname: 20 november 2026/);
    assert.match(html,/niet specifiek een beoordeling van het HYXI AURA-product/);
    assert.match(html,/Google beoordelingen/);
    for(const name of ['Jan Molema van der veen','Edwin','Carlos Barbosa','Mateusz Pohl','Lydia Wagenborg']){
      assert.ok(html.includes(name),'real reviewer '+name);
    }
    assert.equal((html.match(/class="review-entry"/g)||[]).length,5,'5 real review excerpts');
    assert.equal((html.match(/role="img" aria-label="Vijf van vijf sterren"/g)||[]).length,6,'accessible ratings');
    assert.match(html,/https:\/\/www\.google\.com\/maps\/search\/\?api=1&amp;query=Thuisbatterij%20Team&amp;query_place_id=ChIJH-saKH_DxUcRaFRACUWqJRo/);
    assert.match(html,/https:\/\/www\.trustpilot\.com\/review\/thuisbatterijteam\.nl/);
    assert.ok(!html.includes('href="https://www.trustpilot.com/review/thuisbatterij.nl"'),'no competitor confusion');
  }
});

test('customer proof remains static, responsive, privacy-safe and without self-serving review schema',async()=>{
  const html=await readFile(resolve(root,'index.html'),'utf8');
  const css=await readFile(resolve(root,'src/reviews.css'),'utf8');
  assert.ok(html.includes('href="/src/reviews.css"'));
  assert.ok(css.includes('@media(max-width:700px)') && css.includes('@media(max-width:360px)'));
  assert.ok(css.includes('minmax(0,1fr)') && css.includes('overflow-wrap:break-word'));
  const reviews=html.slice(html.indexOf('id="ervaringen"'),html.indexOf('class="lifestyle-section"'));
  assert.ok(!/data-open-lead|<script|<iframe|\bfetch\(|dataLayer|gtag/i.test(reviews),'no new tracking or forms');
  assert.ok(!/<script type="application\/ld\+json">/.test(reviews),'no synthetic review-rich-result schema');
});
