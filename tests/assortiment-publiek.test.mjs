import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {OFFERED_PACKAGES,configuration} from '../src/configurator-model.mjs';

const root=resolve(import.meta.dirname,'..');
const load=path=>readFile(resolve(root,path),'utf8');

test('the public homepage and quote form expose only the five BAT-Q9 packages',async()=>{
  const [home,quote]=await Promise.all([load('dist/index.html'),load('dist/offerte/index.html')]);
  assert.equal(OFFERED_PACKAGES.length,5);
  assert.deepEqual(OFFERED_PACKAGES.map(p=>p.phase+'-'+p.count),[
    'single-1','single-2','three-1','three-2','three-3'
  ]);
  assert.match(home,/name="offer-phase" value="single"/);
  assert.match(home,/name="offer-phase" value="three"/);
  assert.match(home,/id="module-count" type="range" min="1" max="2"/);
  assert.match(home,/id="offer-capacity-ticks"/);
  assert.match(home,/id="offer-inverter"/);
  assert.match(quote,/id="moduleType" name="moduleType" value="9"/);
  assert.match(quote,/id="offerPhase" name="offerPhase" value="single"/);
  assert.doesNotMatch(quote,/<option value="7">|<option value="4">|<option value="5">|<option value="6">/);
  assert.doesNotMatch(home,/name="module-type"/);
  assert.doesNotMatch(home,/Momentopname: 20 november 2026/);
  for(const p of OFFERED_PACKAGES){
    assert.equal(configuration(p.phase,p.count).inverterKw,p.phase==='single'?5:10);
    assert.equal(p.moduleType,9);
  }
});

test('the quote form does not publish purchase costs or unconfirmed retail prices',async()=>{
  const [home,quote]=await Promise.all([load('dist/index.html'),load('dist/offerte/index.html')]);
  for(const raw of ['€ 2.450,00','€ 2.964,50','€ 4.599,00','€ 7.999,00']){
    assert.ok(!home.includes(raw) && !quote.includes(raw),'raw ambiguous price must not be a consumer offer: '+raw);
  }
});
