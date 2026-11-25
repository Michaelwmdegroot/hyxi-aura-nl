import './ads-consent.css';
import { getCampaignAttribution, preserveCampaignAttribution } from './campaign-attribution.mjs';
import { CONVERSION_EVENT, CONSENT_STORAGE_KEY, DENIED_CONSENT, GTM_CONTAINER_ID, MEASUREMENT_CONSENT, normalizeConsent } from './ads-consent-policy.mjs';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
if (isBrowser) {
  const dataLayer = window.dataLayer = window.dataLayer || [];
  const gtag = (...args) => dataLayer.push(args);
  const storage = (() => { try { return window.localStorage; } catch { return null; } })();
  let consent = normalizeConsent(storage?.getItem(CONSENT_STORAGE_KEY)) || 'unknown';
  let gtmLoaded = false;
  let banner;
  let launcher;

  // Consent Mode defaults are queued locally; no Google request happens here.
  gtag('consent', 'default', { ...DENIED_CONSENT, wait_for_update: 500 });

  function remember(value) {
    consent = value;
    try { storage?.setItem(CONSENT_STORAGE_KEY, value); } catch { /* localStorage is optional */ }
    gtag('consent', 'update', value === 'granted' ? MEASUREMENT_CONSENT : DENIED_CONSENT);
    window.__HYXI_ADS_CONSENT__ = value;
  }

  function loadGtm() {
    if (gtmLoaded || document.querySelector(`script[data-hyxi-gtm="${GTM_CONTAINER_ID}"]`)) return;
    gtmLoaded = true;
    dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_CONTAINER_ID)}`;
    script.dataset.hyxiGtm = GTM_CONTAINER_ID;
    document.head.append(script);
  }

  function openPreferences() {
    if (!banner) return;
    banner.hidden = false;
    launcher.dataset.open = 'true';
    banner.querySelector('[data-consent="accept"]')?.focus();
  }

  function closePreferences() {
    if (!banner) return;
    banner.hidden = true;
    launcher.dataset.open = 'false';
  }

  function setConsent(value) {
    remember(value);
    if (value === 'granted') loadGtm();
    closePreferences();
  }

  function renderConsentControls() {
    banner = document.createElement('aside');
    banner.className = 'hyxi-consent';
    banner.hidden = consent !== 'unknown';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'hyxi-consent-title');
    banner.innerHTML = `<h2 id="hyxi-consent-title">Privacyvriendelijke meting</h2><p>We gebruiken alleen na jouw keuze een Google-tag om bevestigde advies- en offerteaanvragen te meten. Geen analytics, remarketing of gepersonaliseerde advertenties in deze eerste fase.</p><small>Weigeren heeft geen gevolgen voor de website of je aanvraag. Je kunt je keuze later wijzigen.</small><div class="hyxi-consent-actions"><button type="button" data-consent="deny">Weigeren</button><button type="button" data-consent="accept">Accepteren</button></div>`;
    launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'hyxi-consent-launcher';
    launcher.dataset.open = String(!banner.hidden);
    launcher.textContent = 'Cookievoorkeuren';
    launcher.setAttribute('aria-label', 'Cookievoorkeuren wijzigen');
    launcher.addEventListener('click', openPreferences);
    banner.addEventListener('click', event => {
      const action = event.target.closest('[data-consent]')?.dataset.consent;
      if (action === 'accept' || action === 'deny') setConsent(action === 'accept' ? 'granted' : 'denied');
    });
    document.body.append(banner, launcher);
  }

  function publishLeadConversion(event) {
    if (consent !== 'granted') return;
    const detail = event.detail || {};
    if (!['advice', 'quote'].includes(detail.intent)) return;
    const reference = typeof detail.conversionRef === 'string' && /^hxa_[A-Za-z0-9_-]{20,100}$/.test(detail.conversionRef)
      ? detail.conversionRef
      : null;
    if (!reference) return;
    const dedupeKey = `hyxi_ads_seen_${reference}`;
    let seen = false;
    try { seen = window.sessionStorage.getItem(dedupeKey) === '1'; } catch { /* session storage is optional */ }
    if (seen) return;
    try { window.sessionStorage.setItem(dedupeKey, '1'); } catch { /* dataLayer event remains safe without storage */ }
    dataLayer.push({ event: CONVERSION_EVENT, hyxi_lead_intent: detail.intent, hyxi_conversion_ref: reference });
  }

  document.addEventListener('hyxi:lead-accepted', publishLeadConversion);
  preserveCampaignAttribution(document, window);
  window.hyxiAdsConsent = Object.freeze({
    get status() { return consent; },
    openPreferences,
    getCampaignAttribution: () => getCampaignAttribution(window),
  });
  function mountConsentControls() {
    if (banner) return;
    if (document.body) renderConsentControls();
    else window.setTimeout(mountConsentControls, 0);
  }
  mountConsentControls();
  if (consent === 'granted') { gtag('consent', 'update', MEASUREMENT_CONSENT); loadGtm(); }
}
