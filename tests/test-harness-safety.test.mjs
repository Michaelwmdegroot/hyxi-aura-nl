import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSafeBrowserOrigin } from './test-harness-safety.mjs';

test('browser QA accepts only loopback origins', () => {
  assert.equal(assertSafeBrowserOrigin('http://127.0.0.1:4173'), 'http://127.0.0.1:4173');
  assert.equal(assertSafeBrowserOrigin('http://localhost:4173'), 'http://localhost:4173');
  assert.throws(() => assertSafeBrowserOrigin('https://hyxi-aura.nl/'), /loopback origin/);
  assert.throws(() => assertSafeBrowserOrigin('https://example.test/'), /loopback origin/);
});
