import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {PUBLIC_CANONICAL_PATHS} from '../server/app.mjs';

const root=resolve(import.meta.dirname,'..');
const file=path=>readFile(resolve(root,path),'utf8');
const live=route=>file('dist/'+(route==='/'?'':route.slice(1))+'index.html');
const navigation=[
  ['samenstellen','Batterij'],
  ['voordelen','Voordelen'],
  ['ervaringen','Ervaringen'],
  ['team','Thuisbatterij Team'],
  ['aanvragen','Contact'],
];

test('all 30 public pages show the supplied vector wordmark and accessible menu without old heading logo',async()=>{
  assert.equal(PUBLIC_CANONICAL_PATHS.size,30);
  for(const route of PUBLIC_CANONICAL_PATHS){
    const html=await live(route);
    assert.match(html,/class="tbt-wordmark" src="\/assets\/thuisbatterijteam-logo\.svg" width="804" height="106" alt="Thuisbatterij Team"/,route+' brand');
    assert.doesNotMatch(html,/<(?:span|strong) class="(?:presenter-owner|secondary-presenter-owner)"/,route+' retired text lockup');
    assert.match(html,/href="\/src\/launch-brand-nav\.css"/,route+' shared stylesheet');
    assert.match(html,/src="\/src\/navigation\.mjs"/,route+' shared navigation JS');
    assert.equal((html.match(/id="launch-menu-toggle"/g)||[]).length,1,route+' one toggle');
    assert.equal((html.match(/id="launch-mobile-nav"/g)||[]).length,1,route+' one menu');
    assert.match(html,/aria-controls="launch-mobile-nav" aria-expanded="false" aria-label="Menu openen"/,route+' accessible initial state');
    const start=html.indexOf('<nav id="launch-mobile-nav"');
    assert.ok(start>0,route+' nav present');
    const nav=html.slice(start,html.indexOf('</nav>',start));
    for(const [id,label] of navigation){
      const target=route==='/'?'#':'/#';
      assert.ok(nav.includes('<a href="'+target+id+'">'+label+'</a>'),route+' '+label+' link');
    }
    assert.doesNotMatch(html,/href="\/kennis\/bat-q7-vs-bat-q9\/"/,route+' retired guide');
    assert.match(html,/Thuisbatterij Team|Thuisbatterij\s+Team/,route+' identifiable commercial presenter');
  }
});

test('homepage anchors are real accessible sections and the working advice CTA remains',async()=>{
  const home=await live('/');
  for(const [id]of navigation) assert.ok(new RegExp('\\bid="'+id+'"').test(home),'#'+id+' must exist');
  const desk=home.match(/<nav aria-label="Hoofdnavigatie" class="desktop-nav">([\s\S]*?)<\/nav>/);
  assert.ok(desk,'premium desktop nav');
  for(const [id,label] of navigation) assert.ok(desk[1].includes('<a href="#'+id+'">'+label+'</a>'),'desktop '+label);
  assert.match(home,/data-open-lead/,'advice flow CTA unchanged');
  assert.doesNotMatch(home,/Offerte voor deze opstelling/,'retired secondary quote CTA must stay removed');
});

test('static owner vector ships at original aspect and exact brand colours with security boundaries',async()=>{
  const svg=await file('dist/assets/thuisbatterijteam-logo.svg');
  assert.match(svg,/viewBox="0 0 803\.7988 106\.3379"/);
  for(const colour of ['#000000','#5A5A5A','#00EC54']) assert.ok(svg.includes(colour),colour+' required');
  assert.equal((svg.match(/<path\b/g)||[]).length,3);
  assert.doesNotMatch(svg,/<script|<foreignObject|<image\b|<text\b|<iframe|@import/i);
});

test('navigation retains keyboard support, reduced motion and no extra external requests',async()=>{
  const [js,css]=await Promise.all([file('src/navigation.mjs'),file('src/launch-brand-nav.css')]);
  for(const phrase of ['aria-expanded','aria-label','Escape','hashchange','pointerdown','matchMedia'])assert.ok(js.includes(phrase));
  assert.match(css,/launch-mobile-nav\[hidden\]\{display:none!important\}/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
  assert.doesNotMatch(js,/fetch\(|sendBeacon|localStorage|sessionStorage|gtag|dataLayer/);
});
