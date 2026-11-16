import test from 'node:test';
import assert from 'node:assert/strict';
import {todayInAmsterdam,classifyFollowup} from '../server/auth/due-followups.mjs';

test('Amsterdam calendar day does not use UTC rollover and respects DST',()=>{
  assert.equal(todayInAmsterdam('2026-11-15T23:30:00Z'),'2026-11-16');
  assert.equal(todayInAmsterdam('2026-03-29T00:30:00Z'),'2026-03-29');
  assert.equal(todayInAmsterdam('2026-03-29T22:15:00Z'),'2026-03-30');
  assert.equal(todayInAmsterdam('2026-10-25T22:30:00Z'),'2026-10-25');
  assert.throws(()=>todayInAmsterdam('invalid'),/Invalid reference date/);
});
test('only active follow-ups are due; future and closed requests are excluded',()=>{
  const today='2026-11-16';
  assert.equal(classifyFollowup('2026-11-15','in_progress',today),'overdue');
  assert.equal(classifyFollowup('2026-11-16','new',today),'today');
  assert.equal(classifyFollowup('2026-11-17','contact_planned',today),null);
  assert.equal(classifyFollowup('2026-11-15','won',today),null);
  assert.equal(classifyFollowup('2026-11-15','lost',today),null);
  assert.equal(classifyFollowup('2026-11-15','not_suitable',today),null);
  assert.equal(classifyFollowup(null,'new',today),null);
  assert.equal(classifyFollowup('tomorrow','new',today),null);
});
