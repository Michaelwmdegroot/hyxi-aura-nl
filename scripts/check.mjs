/** Static production-artifact gate. Does not contact external sites or send mail. */
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { faqs, sourceUrls } from '../src/product-data.mjs';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const origin = 'https://hyxi-aura.nl';
const failures = [];
let checks = 0;
const ensure = (condition, message) => { checks++; if (!condition) failures.push(message); };
const decode = value => String(value).replace(/&(?:amp|quot|apos|lt|gt);|&#(?:x[0-9a-f]+|\d+);/gi, entity => {
  const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' }[entity.toLowerCase()];
  if (named !== undefined) return named;
  const point = entity[2].toLowerCase() === 'x' ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
  return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : '\ufffd';
});
const text = value => decode(String(value).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(match => [match[1].toLowerCase(), decode(match[2] ?? match[3])]));
const route = file => `/${relative(dist, file).split(sep).join('/').replace(/index\.html$/, '')}`;
const fileExists = async file => { try { return (await stat(file)).isFile(); } catch { return false; } };

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? files(resolve(directory, entry.name)) : [resolve(directory, entry.name)]));
  return nested.flat();
}

let built;
try { built = await files(dist); } catch { console.error('Build the site before checking it: npm run build'); process.exit(1); }
const htmlFiles = built.filter(file => extname(file) === '.html');
const documentCache = new Map();
for (const file of htmlFiles) documentCache.set(file, await readFile(file, 'utf8'));

async function localReference(value, source, label) {
  if (!value || /^(?:data:|blob:|mailto:|tel:)/i.test(value)) return;
  if (/^javascript:/i.test(value)) { ensure(false, `${label}: javascript URL`); return; }
  let url;
  try { url = new URL(value, `${origin}${source}`); } catch { ensure(false, `${label}: invalid URL ${value}`); return; }
  if (url.origin !== origin) {
    ensure(url.protocol === 'https:', `${label}: external URL must use HTTPS (${value})`);
    return;
  }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { ensure(false, `${label}: malformed encoded URL`); return; }
  let target = resolve(dist, `.${pathname}`);
  const contained = target === dist || target.startsWith(`${dist}${sep}`);
  ensure(contained, `${label}: URL must remain within the public build`);
  if (!contained) return;
  if (pathname.endsWith('/')) target = resolve(target, 'index.html');
  else if (!await fileExists(target)) {
    if (await fileExists(`${target}.html`)) target += '.html';
    else if (await fileExists(resolve(target, 'index.html'))) target = resolve(target, 'index.html');
  }
  const exists = await fileExists(target);
  ensure(exists, `${label}: missing local target ${value}`);
  if (exists && url.hash && ['.html', '.svg'].includes(extname(target))) {
    const contents = documentCache.get(target) ?? await readFile(target, 'utf8');
    const ids = new Set([...contents.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(match => decode(match[1])));
    let fragment;
    try { fragment = decodeURIComponent(url.hash.slice(1)); } catch { ensure(false, `${label}: malformed encoded fragment ${value}`); return; }
    ensure(ids.has(fragment), `${label}: missing fragment ${value}`);
  }
}

for (const [file, html] of documentCache) {
  const pageRoute = route(file);
  const label = relative(dist, file);
  ensure(/<!doctype html>/i.test(html), `${label}: HTML doctype`);
  ensure(/<html\b[^>]*\blang=["']nl["']/i.test(html), `${label}: Dutch document language`);
  ensure((html.match(/<h1(?:\s|>)/gi) || []).length === 1, `${label}: exactly one H1`);
  ensure((html.match(/<main(?:\s|>)/gi) || []).length === 1, `${label}: exactly one main landmark`);
  const title = text(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
  ensure(title.length >= 15 && title.length <= 75, `${label}: useful concise title`);
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attrs(match[0]));
  const description = metas.find(meta => meta.name === 'description')?.content || '';
  ensure(description.length >= 80 && description.length <= 200, `${label}: useful meta description`);
  ensure(metas.some(meta => meta.name === 'viewport' && /width=device-width/.test(meta.content)), `${label}: responsive viewport`);
  ensure(!metas.some(meta => meta.name === 'robots' && /noindex/i.test(meta.content)), `${label}: production page must be indexable`);
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => attrs(match[0]));
  const canonical = links.filter(link => link.rel === 'canonical');
  ensure(canonical.length === 1 && canonical[0].href === `${origin}${pageRoute}`, `${label}: correct single canonical URL`);
  ensure(metas.some(meta => meta.property === 'og:title' && meta.content), `${label}: Open Graph title`);
  ensure(metas.some(meta => meta.property === 'og:url' && meta.content === `${origin}${pageRoute}`), `${label}: Open Graph canonical URL`);
  const ogImage = metas.find(meta => meta.property === 'og:image')?.content;
  ensure(Boolean(ogImage), `${label}: Open Graph image`);
  if (ogImage) await localReference(ogImage, pageRoute, `${label} Open Graph`);
  const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(match => match[1]);
  ensure(new Set(ids).size === ids.length, `${label}: duplicate element IDs`);
  ensure(!/\son[a-z]+\s*=/i.test(html), `${label}: inline event handlers violate the strict script policy`);
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = attrs(match[1]);
    ensure(Boolean(attributes.src) || attributes.type === 'application/ld+json', `${label}: executable scripts must be external`);
    if (attributes.src) ensure(new URL(attributes.src, origin).origin === origin, `${label}: third-party executable script`);
  }
  for (const match of html.matchAll(/<(?:a|link|img|source|script|use)\b[^>]*>/gi)) {
    const attributes = attrs(match[0]);
    for (const key of ['href', 'src']) if (attributes[key]) await localReference(attributes[key], pageRoute, label);
    if (attributes.srcset) for (const candidate of attributes.srcset.split(',')) await localReference(candidate.trim().split(/\s+/)[0], pageRoute, `${label} srcset`);
    if (/^<img\b/i.test(match[0])) {
      ensure(attributes.alt !== undefined, `${label}: image has an alt attribute`);
      ensure(Number(attributes.width) > 0 && Number(attributes.height) > 0, `${label}: explicit image dimensions prevent layout shifts`);
    }
    if (attributes.target === '_blank') ensure(/(?:^|\s)(?:noopener|noreferrer)(?:\s|$)/.test(attributes.rel || ''), `${label}: new-tab link requires noopener`);
  }
}

// Verify URLs emitted inside built CSS as well as HTML references.
for (const file of built.filter(file => extname(file) === '.css')) {
  const css = await readFile(file, 'utf8');
  const source = `/${relative(dist, file).split(sep).join('/')}`;
  for (const match of css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) await localReference(match[1], source, relative(dist, file));
}

const home = documentCache.get(resolve(dist, 'index.html')) || '';
const jsonLd = [];
for (const match of home.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
  try { jsonLd.push(JSON.parse(match[1])); } catch { ensure(false, 'Home: invalid JSON-LD'); }
}
const entities = jsonLd.flatMap(item => item['@graph'] || [item]);
const faq = entities.find(item => item['@type'] === 'FAQPage');
ensure(Boolean(faq), 'Home: FAQPage structured data is present');
if (faq) {
  const expected = faqs.map(item => ({ question: item.question, answer: item.answer }));
  const actual = faq.mainEntity?.map(item => ({ question: item.name, answer: item.acceptedAnswer?.text }));
  try { assert.deepEqual(actual, expected); ensure(true, 'FAQ source matches JSON-LD'); } catch { ensure(false, 'FAQ source and JSON-LD have diverged'); }
  const visible = [...home.matchAll(/<details\b[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match => ({ question: text(match[1]), answer: text(match[2]) }));
  for (const item of expected) ensure(visible.some(candidate => candidate.question === item.question && candidate.answer === item.answer), `FAQ is visible and matches schema: ${item.question}`);
}
ensure(entities.some(item => item['@type'] === 'Organization'), 'Organization schema is present');
ensure(entities.some(item => item['@type'] === 'WebSite'), 'WebSite schema is present');
ensure(!/"@type"\s*:\s*"(?:Offer|AggregateOffer|AggregateRating|Review)"/.test(JSON.stringify(jsonLd)), 'No invented offer, rating, or review schema');

for (const value of [sourceUrls.localSinglePhase, sourceUrls.localThreePhase, sourceUrls.localWarranty]) {
  const publicFile = resolve(root, 'public', `.${value}`);
  const buildFile = resolve(dist, `.${value}`);
  try {
    const [source, copy] = await Promise.all([readFile(publicFile), readFile(buildFile)]);
    ensure(copy.subarray(0, 5).toString() === '%PDF-', `${value}: actual PDF header`);
    ensure(copy.subarray(-2048).toString('latin1').includes('%%EOF'), `${value}: complete PDF trailer`);
    ensure(copy.length > 10000, `${value}: PDF is not an empty placeholder`);
    ensure(source.equals(copy), `${value}: original document unchanged by build`);
  } catch { ensure(false, `${value}: manufacturer document missing`); }
}

const robots = await readFile(resolve(dist, 'robots.txt'), 'utf8').catch(() => '');
ensure(/^User-agent:\s*\*/im.test(robots) && /^Allow:\s*\//im.test(robots), 'robots.txt permits public indexing');
ensure(/^Disallow:\s*\/api\//im.test(robots), 'robots.txt excludes API routes');
ensure(robots.includes(`Sitemap: ${origin}/sitemap.xml`), 'robots.txt points to canonical sitemap');
const sitemap = await readFile(resolve(dist, 'sitemap.xml'), 'utf8').catch(() => '');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => decode(match[1]));
ensure(sitemapUrls.length === 4 && new Set(sitemapUrls).size === 4, 'sitemap lists the four distinct public pages');
for (const url of sitemapUrls) await localReference(url, '/', 'sitemap.xml');
for (const page of ['/', '/bronnen/', '/offerte/', '/privacy/']) ensure(sitemapUrls.includes(`${origin}${page}`), `sitemap includes ${page}`);

for (const file of built) {
  const publicPath = relative(dist, file).split(sep).join('/');
  ensure(!publicPath.split('/').some(part => /^\.env(?:\.|$)/.test(part) || ['.git', 'node_modules', 'server', 'tests', 'scripts', 'docs'].includes(part)), `Private application path in public build: ${publicPath}`);
  ensure(!/^(?:server\.mjs|package(?:-lock)?\.json|AGENTS\.md|README\.md)$/.test(publicPath), `Private source in public build: ${publicPath}`);
  ensure(!/\.map$/.test(publicPath), `Source map published without review: ${publicPath}`);
}

if (failures.length) {
  console.error(`Static check failed: ${failures.length} of ${checks} checks.\n${failures.map(message => `- ${message}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Static check passed: ${checks} checks across ${htmlFiles.length} pages, local links/assets, matching FAQ schema, original PDFs and public-build hygiene.`);
}
