import { MODULES } from './product-data.mjs';

export function configuration(type = 9, count = 1) {
  if (![7, 9].includes(type) || !Number.isInteger(count) || count < 1 || count > 6) {
    throw new RangeError('Choose a 7 or 9 kWh module and one to six modules.');
  }
  const module = MODULES[type];
  return Object.freeze({ type, count, nominal: Math.round(module.nominal * count * 100) / 100,
    usable: Math.round(module.usable * count * 10) / 10, module });
}

export const decimal = (value, maximumFractionDigits = 2) => new Intl.NumberFormat('nl-NL', { maximumFractionDigits }).format(value);
