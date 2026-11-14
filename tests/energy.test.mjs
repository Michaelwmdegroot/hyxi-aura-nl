import { test } from 'node:test';
import assert from 'node:assert/strict';
import { energyScenario, modeAtHour, ENERGY_MODES } from '../src/energy-model.mjs';

test('illustrative flows conserve energy in every mode with or without a battery', () => {
  for (const mode of ENERGY_MODES) {
    for (const battery of [true, false]) {
      const value = energyScenario(mode, battery);
      assert.ok(Math.abs(value.solar + value.grid - value.home - value.battery) < 1e-8);
      assert.equal(value.grid === 0 || value.connected, true);
    }
  }
});

test('a grid outage never supplies grid energy and an absent battery never supplies backup', () => {
  assert.equal(energyScenario('backup', true).grid, 0);
  assert.equal(energyScenario('backup', true).home, 0.6);
  assert.equal(energyScenario('backup', false).home, 0);
  assert.equal(energyScenario('backup', false).battery, 0);
  assert.equal(energyScenario('backup', false).connected, false);
});

test('with no battery, midday surplus exports and evening consumption imports', () => {
  assert.equal(energyScenario('solar', false).grid, -3);
  assert.equal(energyScenario('evening', false).grid, 1.8);
  assert.equal(energyScenario('solar', false).battery, 0);
});

test('hour boundary and invalid scenario handling are explicit', () => {
  assert.equal(modeAtHour(7), 'solar');
  assert.equal(modeAtHour(17.99), 'solar');
  assert.equal(modeAtHour(18), 'evening');
  assert.equal(modeAtHour(24), 'evening');
  assert.equal(modeAtHour(31), 'solar');
  assert.throws(() => modeAtHour(NaN), TypeError);
  assert.throws(() => energyScenario('unknown'), RangeError);
});
