import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {OFFERED_PACKAGES,configuration} from '../src/configurator-model.mjs';
import {MARKET_MODELS} from '../src/market-models.mjs';

const root=resolve(import.meta.dirname,'..');
const source=path=>readFile(resolve(root,path),'utf8');
const built=path=>readFile(resolve(root,'dist',path),'utf8');

test('published HYXI AURA offering is exactly the five owner-approved BAT-Q9 packages',()=>{
  assert.deepEqual(OFFERED_PACKAGES.map(p=>[p.phase,p.count,p.inverterKw,p.moduleType,p.backup]),[
    ['single',1,5,9,true],['single',2,5,9,true],
    ['three',1,10,9,true],['three',2,10,9,true],['three',3,10,9,true],
  ]);
  for(const p of OFFERED_PACKAGES) assert.equal(configuration(p.phase,p.count).nominal,Math.round(9.04*p.count*100)/100);
  for(const args of [['single',3],['three',4],['single',6]]) assert.throws(()=>configuration(...args));
});

test('comparison market registry and all nine detail pages describe only offered HYXI battery options',async()=>{
  const hyxi=MARKET_MODELS.find(p=>p.id==='hyxi-aura');
  assert.equal(hyxi.scope,'aanbod');
  assert.match(hyxi.identity,/uitsluitend BAT-Q9/);
  assert.match(hyxi.capacity,/8,6 kWh/);
  assert.doesNotMatch(hyxi.identity+' '+hyxi.capacity,/BAT-Q7|6,7 kWh/);
  const hub=await built('vergelijken/index.html');
  assert.match(hub,/vijf BAT-Q9-pakketten/);
  assert.doesNotMatch(hub,/6,7 of 8,6 kWh bruikbaar per batterijmodule/);
  for(const slug of ['alphaess','byd','ecoflow','enphase','huawei','sessy','sigenergy','solaredge','tesla-powerwall']){
    const html=await built('vergelijken/hyxi-aura-vs-'+slug+'/index.html');
    assert.doesNotMatch(html, /BAT-Q7|\bQ7\b/,'no Q7 sold in comparator: '+slug);
    assert.match(html,/BAT-Q9/,'offered module referenced: '+slug);
    assert.match(html,/href="\/offerte\/"/,'existing quote journey preserved: '+slug);
  }
});

test('commercial pages show only five packages; other manufacturer hardware is technical context',async()=>{
  const [home,models,capacity,expand,brand,quote,quoteJs]=await Promise.all([
    built('index.html'),built('modellen/index.html'),built('kennis/hoeveel-kwh-nodig/index.html'),
    built('kennis/uitbreiden/index.html'),built('hyxi-power/index.html'),
    built('offerte/index.html'),source('offerte/offerte.mjs'),
  ]);
  assert.match(home,/Vijf pakketten/);
  assert.equal((home.match(/class="package-option"/g)||[]).length,5);
  assert.doesNotMatch(home,/data-quote-link|Offerte voor deze opstelling/);
  assert.match(models,/geen onderdeel van het standaardaanbod/);
  assert.match(models,/vijf BAT-Q9-pakketten/i);
  assert.match(capacity,/BAT-Q9: hoeveel bruikbare opslag/);
  assert.doesNotMatch(capacity,/<th scope="row">1 × BAT-Q7<\/th>/);
  assert.doesNotMatch(expand,/<th scope="row">1 × BAT-Q7<\/th>/);
  assert.match(expand,/6 × BAT-Q9<\/th><td>51,6 kWh<\/td><td>Uitsluitend fabrikantberekening; geen pakket/);
  assert.match(brand,/HYXI Halo en andere fabrikantlijnen worden hier alleen uitgelegd, niet verkocht/);
  assert.match(quote,/id="moduleType" name="moduleType" value="9"/);
  assert.doesNotMatch(quote,/<option value="7">|<option value="4">|<option value="5">|<option value="6">/);
  assert.match(quoteJs,/Voorlopige keuze, aansluiting nog controleren/);
});
