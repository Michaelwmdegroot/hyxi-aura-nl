import test from 'node:test';
import assert from 'node:assert/strict';
import { configuration, decimal } from '../src/configurator-model.mjs';

test('capacity distinguishes total and usable energy for every supported stack', () => {
  for (const type of [7, 9]) for (let count = 1; count <= 6; count++) {
    const value = configuration(type, count);
    assert.ok(value.usable < value.nominal);
    assert.equal(value.count, count);
    assert.equal(value.nominal, Math.round(count * (type === 7 ? 7.03 : 9.04) * 100) / 100);
  }
  assert.equal(configuration(9, 6).nominal, 54.24);
  assert.equal(configuration(9, 6).usable, 51.6);
  assert.equal(configuration(7, 6).nominal, 42.18);
  assert.equal(configuration(7, 6).usable, 40.2);
});
test('unsupported stack sizes or module types cannot become product claims', () => {
  for (const [type, count] of [[7, 0], [9, 7], [9, 1.5], [8, 2], ['9', 1], [9, NaN]]) assert.throws(() => configuration(type, count), RangeError);
});
test('Dutch quantities show decimal commas without floating-point artifacts', () => {
  assert.equal(decimal(configuration(9, 3).nominal), '27,12');
  assert.equal(decimal(configuration(7, 3).usable), '20,1');
});
