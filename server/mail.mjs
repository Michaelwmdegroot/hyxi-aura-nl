import nodemailer from 'nodemailer';

const LABELS = {
  solar: { yes: 'Zonnepanelen aanwezig', planned: 'Zonnepanelen gepland', no: 'Geen zonnepanelen' },
  goal: { solar: 'Meer eigen zonnestroom gebruiken', prices: 'Slimme stroomprijzen', backup: 'Back-up bij stroomuitval', unsure: 'Samen bepalen' },
  phase: { single: '1-fase', three: '3-fase', unknown: 'Nog onbekend' },
};

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
  const nominal = (p.moduleType === 7 ? 7.03 : 9.04) * p.moduleCount;
  const usable = (p.moduleType === 7 ? 6.7 : 8.6) * p.moduleCount;
  const lines = [
    'Nieuwe HYXI AURA adviesaanvraag',
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
    '',
    'Woningprofiel en gekozen verkenning',
    `Zonnepanelen: ${LABELS.solar[p.solar]}`,
    `Jaarverbruik: ${p.annualUsage === null ? 'Nog onbekend' : `${p.annualUsage} kWh`}`,
    `Doel: ${LABELS.goal[p.goal]}`,
    `Aansluiting: ${LABELS.phase[p.phase]}`,
    `Verkende opstelling: ${p.moduleCount} × BAT-Q${p.moduleType}`,
    `Nominale capaciteit: ${nominal.toFixed(2)} kWh`,
    `Bruikbare capaciteit volgens voorlopige datasheet: ${usable.toFixed(1)} kWh`,
    'Dit is de keuze van de bezoeker, geen technisch installatieadvies of definitieve offerte.',
    '',
    'De bezoeker heeft expliciet verzocht om contact over deze aanvraag.',
    'Privacyversie: 2026-11-15. Geen toestemming voor nieuwsbrieven of andere marketing gevraagd.',
  ];
  if (lead.attribution && Object.values(lead.attribution).some(Boolean)) {
    lines.push('', 'Campagneherkomst (door de bezoeker aangeleverde UTM-waarden)');
    for (const [key, value] of Object.entries(lead.attribution)) if (value) lines.push(`${key}: ${value}`);
  }
  return {
    from: { name: 'HYXI AURA · Thuisbatterij Team', address: config.smtp.from },
    to: config.smtp.to,
    replyTo: { name: lead.fullName, address: lead.email },
    subject: `[HYXI AURA] Nieuwe adviesaanvraag ${requestId}`,
    messageId: `<${requestId}@hyxi-aura.nl>`,
    text: lines.join('\n'),
    disableFileAccess: true,
    disableUrlAccess: true,
  };
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
