/** First-party conversion-ready signal.
 * Called ONLY after /api/leads returns a confirmed successful receipt.
 * Deliberately emits no personal data, customer id, cookies or network requests.
 * A future Google Ads/GTM integration must separately implement EEA consent.
 */
export function publishAcceptedLeadSignal(intent, scope = globalThis) {
  if (intent !== 'advice' && intent !== 'quote') return false;
  if (!scope || typeof scope.dispatchEvent !== 'function' ||
      typeof scope.CustomEvent !== 'function') return false;
  try {
    scope.dispatchEvent(new scope.CustomEvent('hyxi:lead-accepted', {
      detail: Object.freeze({intent})
    }));
    return true;
  } catch { // A measurement consumer must never break the already-confirmed lead UX.
    return false;
  }
}
