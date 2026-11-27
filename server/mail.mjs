import nodemailer from 'nodemailer';

const LABELS = {
  solar: { yes: 'Zonnepanelen aanwezig', planned: 'Zonnepanelen gepland', no: 'Geen zonnepanelen' },
  goal: { solar: 'Meer eigen zonnestroom gebruiken', prices: 'Slimme stroomprijzen', backup: 'Back-up bij stroomuitval', unsure: 'Samen bepalen' },
  phase: { single: '1-fase', three: '3-fase', unknown: 'Nog onbekend' },
};

function packageDetails(lead) {
  const p = lead.profile;
  const phase = p.offerPhase || p.phase;
  const three = phase === 'three';
  const knownPhase = phase === 'single' || phase === 'three';
  return {
    phase: knownPhase ? (three ? '3 fasen' : '1 fase') : 'Aansluiting te bevestigen',
    inverter: knownPhase ? (three ? '10 kW' : '5 kW') : 'Omvormer te bevestigen',
    packageLabel: knownPhase ? `${p.moduleCount * 9} kWh · ${three ? '3 fasen' : '1 fase'} · ${three ? '10 kW' : '5 kW'} omvormer · ${p.moduleCount} × BAT-Q9` : `${p.moduleCount * 9} kWh · aansluiting te bevestigen · ${p.moduleCount} × BAT-Q9`,
  };
}

function subjectNameAndPlace(lead) {
  return lead.city ? `${lead.fullName} | ${lead.city}` : null;
}

export function createTransport(config) {
  if (!config.smtpConfigured) return null;
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    requireTLS: !config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    pool: false,
    logger: false,
    debug: false,
  });
}

export function buildLeadMail(config, lead, requestId, now) {
  const p = lead.profile;
  const quote = lead.intent === 'quote';
  const nominal = 9.04 * p.moduleCount;
  const usable = 8.6 * p.moduleCount;
  const offerPhase = p.offerPhase || p.phase;
  const selected = offerPhase === 'three' ? '3 fasen · 10 kW omvormer' : offerPhase === 'single' ? '1 fase · 5 kW omvormer' : 'Aansluiting te bevestigen';
  const exactSubject = subjectNameAndPlace(lead);
  const lines = [
    quote ? 'Nieuwe HYXI AURA offerteaanvraag' : 'Nieuwe HYXI AURA adviesaanvraag',
    '',
    `Aanvraagnummer: ${requestId}`,
    `Ontvangen: ${new Date(now).toISOString()}`,
    'Bron: https://hyxi-aura.nl',
    'Product: HYXI AURA',
    '',
    `Naam: ${lead.fullName}`,
    `E-mail: ${lead.email}`,
    `Telefoon: ${lead.phone}`,
    `Postcode: ${lead.postcode}`,
    `Woonplaats: ${lead.city || 'Niet opgegeven'}`,
    '',
    'Woningprofiel en gekozen verkenning',
    `Zonnepanelen: ${LABELS.solar[p.solar]}`,
    `Jaarverbruik: ${p.annualUsage === null ? 'Nog onbekend' : `${p.annualUsage} kWh`}`,
    `Doel: ${LABELS.goal[p.goal]}`,
    `Aansluiting: ${LABELS.phase[p.phase]}`,
    `Verkende opstelling: ${p.moduleCount} × BAT-Q9`,
    `Gekozen pakket: ${selected}, geïntegreerde back-up (groepen na installatiecheck)`,
    `Nominale capaciteit: ${nominal.toFixed(2)} kWh`,
    `Bruikbare capaciteit volgens voorlopige datasheet: ${usable.toFixed(1)} kWh`,
    'Dit is de keuze van de bezoeker, geen technisch installatieadvies of definitieve offerte.',
    ...(quote && lead.projectDetails ? ['', 'Aanvullende wensen (door de aanvrager aangeleverd)', lead.projectDetails] : []),
    '',
    'De bezoeker heeft expliciet verzocht om contact over deze aanvraag.',
    'Privacyversie: 2026-11-27. Geen toestemming voor nieuwsbrieven of andere marketing gevraagd.',
  ];
  if (lead.attribution && Object.values(lead.attribution).some(Boolean)) {
    lines.push('', 'Campagneherkomst (door de bezoeker aangeleverde UTM-waarden)');
    for (const [key, value] of Object.entries(lead.attribution)) if (value) lines.push(`${key}: ${value}`);
  }
  return {
    from: { name: 'HYXI AURA · Thuisbatterij Team', address: config.smtp.from },
    to: config.smtp.to,
    replyTo: { name: lead.fullName, address: lead.email },
    subject: exactSubject || `[HYXI AURA] Nieuwe ${quote ? 'offerteaanvraag' : 'adviesaanvraag'} ${requestId}`,
    messageId: `<${requestId}@hyxi-aura.nl>`,
    text: lines.join('\n'),
    disableFileAccess: true,
    disableUrlAccess: true,
  };
}

export function buildSalesNotificationMail(config, lead, requestId, now) {
  const p = lead.profile;
  const quote = lead.intent === 'quote';
  const details = packageDetails(lead);
  const place = lead.city || `Postcode ${lead.postcode}`;
  const lines = [
    'Nieuwe HYXI AURA-lead',
    '',
    `Aanvraagnummer: ${requestId}`,
    `Ontvangen: ${new Date(now).toISOString()}`,
    `Naam: ${lead.fullName}`,
    `Woonplaats: ${place}`,
    `Telefoonnummer: ${lead.phone}`,
    `Gekozen HYXI AURA-pakket: ${details.packageLabel}`,
    `Fase: ${details.phase}`,
    `Omvormer: ${details.inverter}`,
    'Back-up: geïntegreerd; groepen en definitieve uitvoering volgens installatiecheck',
    `Aanvraagtype: ${quote ? 'offerte' : 'advies'}`,
    '',
    'Dit pakket is de keuze van de bezoeker, geen definitieve offerte of installatieadvies.',
    'Volg de aanvraag op via de bestaande Odoo-leadroute.',
  ];
  return {
    from: { name: 'HYXI AURA · Thuisbatterij Team', address: config.smtp.from },
    to: config.salesNotificationTo,
    replyTo: { name: lead.fullName, address: lead.email },
    subject: `Nieuwe HYXI AURA lead | ${lead.fullName} | ${place}`,
    messageId: `<${requestId}.sales@hyxi-aura.nl>`,
    text: lines.join('\n'),
    disableFileAccess: true,
    disableUrlAccess: true,
  };
}

export function buildNotificationMail(config, lead, requestId, now, eventType = 'lead_received') {
  return eventType === 'sales_lead_received'
    ? buildSalesNotificationMail(config, lead, requestId, now)
    : buildLeadMail(config, lead, requestId, now);
}

export function notificationRecipient(config, eventType = 'lead_received') {
  return eventType === 'sales_lead_received' ? config.salesNotificationTo : config.smtp.to;
}

export function recipientAccepted(result, address) {
  return Array.isArray(result?.accepted) && result.accepted.some(item => {
    const value = typeof item === 'string' ? item : item?.address;
    return String(value || '').trim().toLowerCase() === address.trim().toLowerCase();
  });
}

export function definitelyNotDelivered(error) {
  // A lost final DATA acknowledgement is ambiguous. Only clear failures before
  // message acceptance, or an explicit SMTP rejection, allow an automatic retry.
  if (['EAUTH', 'EDNS', 'ECONNREFUSED', 'ENOTFOUND', 'EENVELOPE', 'ETLS'].includes(error?.code)) return true;
  if (['CONNECTION_TIMEOUT', 'GREETING_TIMEOUT'].includes(error?.timeoutType)) return true;
  return Number.isInteger(error?.responseCode) && error.responseCode >= 400 && error.responseCode <= 599;
}
