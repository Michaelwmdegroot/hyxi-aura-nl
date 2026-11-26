const ACCEPTED_INTENTS = new Set(['advice', 'quote']);
const REFERENCE_PATTERN = /^hxa_[A-Za-z0-9_-]{20,100}$/;

export function createConversionReference(scope = globalThis) {
  try {
    const uuid = scope?.crypto?.randomUUID?.();
    if (uuid) return `hxa_${uuid}`;
    const bytes = new Uint8Array(16);
    scope?.crypto?.getRandomValues?.(bytes);
    if (!bytes.some(Boolean)) return null;
    const fallback = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
    return fallback ? `hxa_${fallback}` : null;
  } catch { return null; }
}

export function publishAcceptedLeadSignal(intent, scope = globalThis, conversionRef = null) {
  if (!ACCEPTED_INTENTS.has(intent) || !scope || typeof scope.dispatchEvent !== 'function' || typeof scope.CustomEvent !== 'function') return false;
  try {
    const detail = { intent };
    if (REFERENCE_PATTERN.test(conversionRef || '')) detail.conversionRef = conversionRef;
    scope.dispatchEvent(new scope.CustomEvent('hyxi:lead-accepted', { detail: Object.freeze(detail) }));
    return true;
  } catch { return false; }
}

export { ACCEPTED_INTENTS, REFERENCE_PATTERN };
