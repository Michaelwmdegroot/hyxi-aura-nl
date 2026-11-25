import test from 'node:test';
import assert from 'node:assert/strict';
import { createConversionReference, publishAcceptedLeadSignal } from '../src/lead-conversion-signal.mjs';

function scope() {
  const target = new EventTarget();
  target.CustomEvent = CustomEvent;
  target.crypto = { randomUUID: () => '11111111-2222-4333-8444-555555555555' };
  return target;
}

test('accepted lead signal is restricted to advice and quote and contains no contact data', () => {
  const target = scope();
  const events = [];
  target.addEventListener('hyxi:lead-accepted', event => events.push(event));
  const reference = createConversionReference(target);
  assert.match(reference, /^hxa_[0-9a-f-]{36}$/);
  assert.equal(publishAcceptedLeadSignal('invalid', target, reference), false);
  assert.equal(publishAcceptedLeadSignal('advice', target, reference), true);
  assert.deepEqual(events[0].detail, { intent: 'advice', conversionRef: reference });
  assert.deepEqual(Object.keys(events[0].detail).sort(), ['conversionRef', 'intent']);
  assert.equal('email' in events[0].detail, false);
});

test('a missing or malformed conversion reference does not make the event invalid', () => {
  const target = scope();
  let detail;
  target.addEventListener('hyxi:lead-accepted', event => { detail = event.detail; });
  assert.equal(publishAcceptedLeadSignal('quote', target, 'not-a-reference'), true);
  assert.deepEqual(detail, { intent: 'quote' });
});
