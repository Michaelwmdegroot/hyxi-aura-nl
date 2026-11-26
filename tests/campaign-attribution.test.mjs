import test from 'node:test';
import assert from 'node:assert/strict';
import { getCampaignAttribution, preserveCampaignAttribution, readCampaignAttribution } from '../src/campaign-attribution.mjs';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('campaign attribution keeps only the three bounded UTM values without browser storage', () => {
  const saved = storage();
  assert.deepEqual(readCampaignAttribution('?utm_source=google&utm_medium=cpc&utm_campaign=hyxi-search&gclid=secret', saved), {
    utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'hyxi-search',
  });
  assert.equal(saved.getItem('hyxi_campaign_attribution_v1'), null, 'UTM values must not enter sessionStorage before consent');
  assert.deepEqual(readCampaignAttribution('', saved), {});
  assert.deepEqual(readCampaignAttribution('?utm_source=<script>&utm_medium=ok', storage()), { utm_medium: 'ok' });
});

test('internal links preserve allowlisted attribution but external, API and beheer links stay untouched', () => {
  const saved = storage();
  const fakeScope = { location: { search: '?utm_source=google&utm_medium=cpc', href: 'https://hyxi-aura.nl/', origin: 'https://hyxi-aura.nl' }, sessionStorage: saved };
  const links = [
    { href: '/modellen/' },
    { href: 'https://other.example/path' },
    { href: '/api/health' },
    { href: '/beheer/' },
  ];
  const doc = { querySelectorAll: () => links.map(link => ({
    getAttribute: () => link.href,
    setAttribute: (_name, value) => { link.href = value; },
    hasAttribute: () => false,
  })) };
  preserveCampaignAttribution(doc, fakeScope);
  assert.match(links[0].href, /utm_source=google/);
  assert.equal(links[1].href, 'https://other.example/path');
  assert.equal(links[2].href, '/api/health');
  assert.equal(links[3].href, '/beheer/');
  assert.deepEqual(getCampaignAttribution(fakeScope), { utm_source: 'google', utm_medium: 'cpc' });
  assert.equal(saved.getItem('hyxi_campaign_attribution_v1'), null, 'Internal URL handoff must not create a storage record');
});
