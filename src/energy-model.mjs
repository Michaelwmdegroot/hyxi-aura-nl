/**
 * Deliberately small teaching scenarios, not a household forecast or an AURA
 * performance specification. Power values are illustrative kW snapshots.
 * Positive grid power is import; negative grid power is export.
 */
export const ENERGY_MODES = Object.freeze(['solar', 'evening', 'backup']);

export function energyScenario(mode = 'solar', batteryEnabled = true) {
  if (!ENERGY_MODES.includes(mode)) throw new RangeError('Unknown energy scenario');
  const battery = Boolean(batteryEnabled);
  if (mode === 'solar') {
    return Object.freeze({ mode, solar: 4.2, home: 1.2, battery: battery ? 3 : 0, grid: battery ? 0 : -3, connected: true, batteryEnabled: battery });
  }
  if (mode === 'evening') {
    return Object.freeze({ mode, solar: 0, home: 1.8, battery: battery ? -1.8 : 0, grid: battery ? 0 : 1.8, connected: true, batteryEnabled: battery });
  }
  return Object.freeze({ mode, solar: 0, home: battery ? 0.6 : 0, battery: battery ? -0.6 : 0, grid: 0, connected: false, batteryEnabled: battery });
}

export function modeAtHour(hour) {
  if (!Number.isFinite(hour)) throw new TypeError('Hour must be finite');
  const normalized = ((hour % 24) + 24) % 24;
  return normalized >= 7 && normalized < 18 ? 'solar' : 'evening';
}
