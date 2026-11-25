/**
 * Small, allowlisted campaign attribution helper.
 *
 * Only the three parameters already accepted by the lead API are retained.
 * Values live in sessionStorage so navigation can keep the source without
 * putting personal data, click IDs or arbitrary query parameters in storage.
 */
export const ATTRIBUTION_KEYS = Object.freeze(['utm_source', 'utm_medium', 'utm_campaign']);
export const ATTRIBUTION_STORAGE_KEY = 'hyxi_campaign_attribution_v1';
const VALUE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._~+ -]{0,79}$/;

function storageFor(scope) {
  try { return scope?.sessionStorage ?? null; } catch { return null; }
}

function validValue(value) {
  const normalized = String(value ?? '').trim();
  return VALUE_PATTERN.test(normalized) ? normalized : null;
}

export function readCampaignAttribution(search = '', storage = null) {
  const result = {};
  try {
    const params = new URLSearchParams(search);
    for (const key of ATTRIBUTION_KEYS) {
      const value = validValue(params.get(key));
      if (value) result[key] = value;
    }
  } catch { /* malformed input is ignored, never fatal to the lead form */ }
  if (Object.keys(result).length) {
    try { storage?.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(result)); } catch { /* storage is optional */ }
    return result;
  }
  try {
    const saved = JSON.parse(storage?.getItem(ATTRIBUTION_STORAGE_KEY) || '{}');
    for (const key of ATTRIBUTION_KEYS) {
      const value = validValue(saved?.[key]);
      if (value) result[key] = value;
    }
  } catch { /* ignore unavailable or invalid storage */ }
  return result;
}

export function getCampaignAttribution(scope = globalThis) {
  return readCampaignAttribution(scope?.location?.search || '', storageFor(scope));
}

export function preserveCampaignAttribution(documentRef = globalThis.document, scope = globalThis) {
  const attribution = getCampaignAttribution(scope);
  if (!Object.keys(attribution).length || !documentRef?.querySelectorAll) return attribution;
  let origin;
  try { origin = scope.location?.origin; } catch { return attribution; }
  for (const link of documentRef.querySelectorAll('a[href]')) {
    const raw = link.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:') || link.hasAttribute('data-no-campaign')) continue;
    try {
      const url = new URL(raw, scope.location?.href || origin);
      if (url.origin !== origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/beheer')) continue;
      for (const [key, value] of Object.entries(attribution)) if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      link.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* links that are not URLs are left unchanged */ }
  }
  return attribution;
}
