import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const routes = new Map([
  ['/', 'index.html'],
  ['/bronnen/', 'bronnen/index.html'],
  ['/offerte/', 'offerte/index.html'],
  ['/privacy/', 'privacy/index.html'],
  ['/kennis/noodstroom/', 'kennis/noodstroom/index.html'],
  ['/kennis/installatiecheck/', 'kennis/installatiecheck/index.html'],
  ['/kennis/1-fase-of-3-fasen/', 'kennis/1-fase-of-3-fasen/index.html'],
  ['/modellen/', 'modellen/index.html'],
  ['/datasheet/', 'datasheet/index.html'],
  ['/kennis/prijs-en-installatie/', 'kennis/prijs-en-installatie/index.html'],
  ['/kennis/bestaande-zonnepanelen/', 'kennis/bestaande-zonnepanelen/index.html'],
  ['/kennis/garantie/', 'kennis/garantie/index.html'],
  ['/kennis/salderingsregeling-2027/', 'kennis/salderingsregeling-2027/index.html'],
  ['/kennis/btw-subsidie/', 'kennis/btw-subsidie/index.html'],
  ['/kennis/dynamisch-energiecontract/', 'kennis/dynamisch-energiecontract/index.html'],
  ['/kennis/uitbreiden/', 'kennis/uitbreiden/index.html'],
  ['/kennis/buiten-plaatsen/', 'kennis/buiten-plaatsen/index.html'],
  ['/vergelijken/', 'vergelijken/index.html'],
  ['/hyxi-power/', 'hyxi-power/index.html'],
  ['/kennis/hoeveel-kwh-nodig/', 'kennis/hoeveel-kwh-nodig/index.html'],
  ['/kennis/app-monitoring/', 'kennis/app-monitoring/index.html'],
  ['/vergelijken/hyxi-aura-vs-sigenergy/', 'vergelijken/hyxi-aura-vs-sigenergy/index.html'],
  ['/vergelijken/hyxi-aura-vs-alphaess/', 'vergelijken/hyxi-aura-vs-alphaess/index.html'],
  ['/vergelijken/hyxi-aura-vs-tesla-powerwall/', 'vergelijken/hyxi-aura-vs-tesla-powerwall/index.html'],
  ['/vergelijken/hyxi-aura-vs-enphase/', 'vergelijken/hyxi-aura-vs-enphase/index.html'],
  ['/vergelijken/hyxi-aura-vs-huawei/', 'vergelijken/hyxi-aura-vs-huawei/index.html'],
  ['/vergelijken/hyxi-aura-vs-byd/', 'vergelijken/hyxi-aura-vs-byd/index.html'],
  ['/vergelijken/hyxi-aura-vs-solaredge/', 'vergelijken/hyxi-aura-vs-solaredge/index.html'],
  ['/vergelijken/hyxi-aura-vs-ecoflow/', 'vergelijken/hyxi-aura-vs-ecoflow/index.html'],
  ['/vergelijken/hyxi-aura-vs-sessy/', 'vergelijken/hyxi-aura-vs-sessy/index.html'],
]);
const htmlAt = path => readFile(resolve(root, 'dist', path), 'utf8');
const attribute = (html, tagName, field, needle, attrName) => {
  const tags = [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))].map(x=>x[0]);
  const tag = tags.find(x => new RegExp(`\\b${field}=["']${needle}["']`).test(x));
  return tag?.match(new RegExp(`\\b${attrName}=["']([^"']+)["']`))?.[1];
};
const pngDimensions = data => {
  assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'valid PNG signature');
  assert.equal(data.subarray(12, 16).toString('ascii'), 'IHDR');
  return [data.readUInt32BE(16),data.readUInt32BE(20)];
};

test('Owner-provided brand artwork is shipped at 48, 192, 512 pixels; no placeholder favicon', async () => {
  for (const [file,side] of [
    ['favicon.png',48],['apple-touch-icon.png',192],
    ['icons/brand-48.png',48],['icons/brand-192.png',192],['icons/brand-512.png',512],
  ]) {
    const [original,built] = await Promise.all([readFile(resolve(root,'public',file)),readFile(resolve(root,'dist',file))]);
    assert.deepEqual(pngDimensions(original),[side,side],file);
    assert.ok(original.equals(built),`Unmodified exact brand bytes: ${file}`);
    assert.ok(original.length>200 && original.length<40000,`Reasonably optimized brand asset: ${file}`);
  }
  const svg=await readFile(resolve(root,'dist/favicon.svg'),'utf8');
  assert.match(svg,/Huis met thuisbatterij en gele bliksem/);
  assert.doesNotMatch(svg,/#ef6c42|<rect width="64"/i,'Old generic orange A icon must not be distributed');
});

test('Owner-provided TBT vector logo is installed exactly and has no external resources',async()=>{
  const [original,built]=await Promise.all([
    readFile(resolve(root,'public/assets/thuisbatterijteam-logo.svg'),'utf8'),
    readFile(resolve(root,'dist/assets/thuisbatterijteam-logo.svg'),'utf8'),
  ]);
  assert.equal(built,original,'Vite must ship the same owner logo vector');
  assert.match(original, /#000000/);
  assert.match(original, /#5A5A5A/);
  assert.match(original, /#00EC54/);
  assert.match(original, /viewBox="0 0 803\.7988 106\.3379"/);
  assert.doesNotMatch(original, /<script|foreignObject|<image|@import|<text\b/i,'no external dependencies, fonts or scripts');
});

test('Site manifest uses real installed assets, truthful brand ownership and no fictitious offline app',async()=>{
  const text=await readFile(resolve(root,'dist/site.webmanifest'),'utf8');
  const manifest=JSON.parse(text);
  assert.equal(manifest.name,'HYXI AURA — Thuisbatterij Team');
  assert.equal(manifest.lang,'nl-NL');
  assert.equal(manifest.start_url,'/');
  assert.equal(manifest.scope,'/');
  assert.equal(manifest.display,'browser','No service worker/offline app is promised');
  assert.deepEqual(manifest.icons.map(x=>[x.src,x.sizes,x.type,x.purpose]),[
    ['/icons/brand-192.png','192x192','image/png','any'],
    ['/icons/brand-512.png','512x512','image/png','any'],
  ]);
});

test('All thirty public pages have branded favicon, share preview, trustworthy metadata and exactly one H1',async()=>{
  const titles=new Set(),descriptions=new Set();
  for(const [url,path] of routes){
    const html=await htmlAt(path);
    const name=path;
    assert.equal((html.match(/<h1(?:\s|>)/gi)||[]).length,1,`${name} one H1`);
    const title=html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
    assert.ok(title && title.length>=15 && title.length<=75,`${name} concise unique title`);
    assert.ok(!titles.has(title),`${name} unique title`);titles.add(title);
    const desc=attribute(html,'meta','name','description','content');
    assert.ok(desc && desc.length>=80 && desc.length<=200,`${name} useful description`);
    assert.ok(!descriptions.has(desc),`${name} unique description`);descriptions.add(desc);
    assert.equal(attribute(html,'link','rel','canonical','href'),`https://hyxi-aura.nl${url}`,`${name} canonical`);
    assert.equal(attribute(html,'link','rel','icon','href'),'/favicon.png',`${name} proper cross-browser favicon`);
    assert.equal(attribute(html,'link','rel','apple-touch-icon','href'),'/apple-touch-icon.png');
    assert.equal(attribute(html,'link','rel','manifest','href'),'/site.webmanifest');
    assert.equal(attribute(html,'meta','property','og:site_name','content'),'HYXI AURA · Thuisbatterij Team');
    assert.equal(attribute(html,'meta','property','og:url','content'),`https://hyxi-aura.nl${url}`);
    assert.equal(attribute(html,'meta','property','og:image:width','content'),'1200');
    assert.equal(attribute(html,'meta','property','og:image:height','content'),'630');
    assert.match(attribute(html,'meta','property','og:image:alt','content')||'',/HYXI AURA thuisbatterij/);
    assert.equal(attribute(html,'meta','name','twitter:card','content'),'summary_large_image');
    assert.match(attribute(html,'meta','name','robots','content')||'',/index, follow, max-image-preview:large/);
    assert.match(html,/class="tbt-wordmark" src="\/assets\/thuisbatterijteam-logo\.svg" width="804" height="106" alt="Thuisbatterij Team"/,
      `${name} shows owner-provided new TBT vector wordmark, not an old house-only logo`);
    const sourceHtml=await readFile(resolve(root,path),'utf8');
    assert.match(sourceHtml,/href="\/src\/launch-brand-nav\.css"/,`${name} source imports shared branding and nav CSS`);
    assert.match(sourceHtml,/src="\/src\/navigation\.mjs"/,`${name} source imports navigation JS`);
    assert.doesNotMatch(html,/<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg">/);
    assert.match(html,/Thuisbatterij/,`${name} presenter identity remains visible`);
  }
});

test('Homepage title and structured data match without fake offers, reviews or manufacturer ownership', async()=>{
  const home=await htmlAt('index.html');
  const title=home.match(/<title>([^<]+)<\/title>/)?.[1];
  assert.equal(title,'HYXI AURA thuisbatterij | Capaciteit & advies | Thuisbatterij Team');
  const graph=[...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap(match=>{const item=JSON.parse(match[1]);return item['@graph']||[item]});
  const site=graph.find(x=>x['@type']==='WebSite'),page=graph.find(x=>x['@type']==='WebPage'),owner=graph.find(x=>x['@type']==='Organization');
  assert.equal(site?.name,'HYXI AURA · Thuisbatterij Team');
  assert.equal(page?.name,title,'Visible title and WebPage schema must agree');
  assert.equal(owner?.name,'NIVO Groep Holland B.V.');
  assert.ok(!JSON.stringify(graph).match(/"@type":"(?:Offer|Review|AggregateRating)"/));
  assert.match(home,/geen officiële HYXI-website/i);
});

test('Thirty canonical URLs remain in sitemap; private Beheer remains noindex',async()=>{
  const sitemap=await readFile(resolve(root,'dist/sitemap.xml'),'utf8');
  const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
  assert.equal(urls.length,30);
  assert.deepEqual(new Set(urls),new Set([...routes.keys()].map(x=>`https://hyxi-aura.nl${x}`)));
  const beheer=await readFile(resolve(root,'admin/beheer.html'),'utf8');
  assert.match(beheer,/name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(beheer,/href="\/favicon\.png"/);
  assert.match(beheer,/src="\/icons\/brand-192\.png"/);
});
