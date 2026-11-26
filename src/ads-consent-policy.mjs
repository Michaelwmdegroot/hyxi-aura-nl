export const GTM_CONTAINER_ID = 'GTM-52MBZWSL';
export const CONSENT_STORAGE_KEY = 'hyxi_ads_consent_v1';
export const CONVERSION_EVENT = 'hyxi_lead_success';

export const DENIED_CONSENT = Object.freeze({
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
});

// This first phase measures confirmed lead receipt only. It does not grant
// analytics or ad-personalisation consent and there is no remarketing tag.
export const MEASUREMENT_CONSENT = Object.freeze({
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
});

export function normalizeConsent(value) {
  return value === 'granted' || value === 'denied' ? value : null;
}
