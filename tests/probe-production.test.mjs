import test from 'node:test';
import assert from 'node:assert/strict';
import { probeProduction } from '../scripts/probe-production.mjs';

const good = {
  '/api/health': [200, JSON.stringify({ok:true,leadEnabled:true})],
  '/api/config': [200, JSON.stringify({leadEnabled:true,csrfToken:'DO-NOT-LOG'})],
  '/privacy/': [200, 'Privacyverklaring · versie 15 november 2026; versleuteld op in een beveiligde database'],
  '/sitemap.xml': [200, '<loc>https://hyxi-aura.nl/</loc>'],
  '/robots.txt': [200, 'Sitemap: https://hyxi-aura.nl/sitemap.xml'],
  '/api/beheer/leads': [401, '{}'],
};
const mock = (data) => async url => {
  const path = new URL(url).pathname;
  const [status,body] = data[path] ?? [404,''];
  return {status,text:async()=>body};
};

test('productieprobe leest uitsluitend publieke metadata en rapporteert alle P0-beveiligingschecks',async()=>{
  const result=await probeProduction(mock(good));
  assert.equal(result.ok,true);
  assert.equal(Object.keys(result.checks).length,6);
  assert.doesNotMatch(JSON.stringify(result),/DO-NOT-LOG/);
});

test('productieprobe faalt gesloten leadintake zonder details van cookies te tonen',async()=>{
  const result=await probeProduction(mock({
    ...good,
    '/api/health':[200,JSON.stringify({ok:true,leadEnabled:false})],
  }));
  assert.equal(result.ok,false);
  assert.equal(result.checks.healthReachable,true);
  assert.equal(result.checks.publicIntakeEnabled,false);
});
