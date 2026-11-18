import express from 'express';
import compression from 'compression';
import { createHmac, randomBytes, randomUUID, timingSafeEqual, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONTACT } from './config.mjs';
import { buildLeadMail, recipientAccepted, definitelyNotDelivered } from './mail.mjs';
import { validateLead } from './validation.mjs';
import { mountAdminRoutes } from './auth/routes.mjs';

const HOUR = 60 * 60 * 1000;
const CSRF_AGE = 2 * HOUR;
const MAX_ENTRIES = 10000;
const fail = (res, status, code, message, extra = {}) => res.status(status).json({ ok: false, code, message, ...extra });
const safeEqual = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};

function cspFor(directory) {
  const hashes = new Set();
  // Hash JSON-LD scripts so structured data needs no blanket inline-script exception.
  for (const page of ['index.html', 'offerte/index.html']) {
    try {
      const html = readFileSync(resolve(directory, page), 'utf8');
      for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
        hashes.add(`'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
      }
    } catch { /* Unbuilt checkout or fixture without this public page. */ }
  }
  return [
    "default-src 'self'", `script-src 'self' ${[...hashes].join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
    "font-src 'self'", "connect-src 'self'", "media-src 'self'",
    "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'",
    "form-action 'self' https://thuisbatterijteam.nl", "worker-src 'self' blob:",
  ].join('; ');
}

export const PUBLIC_CANONICAL_PATHS = new Set([
  "/",
  "/privacy/",
  "/bronnen/",
  "/offerte/",
  "/kennis/bat-q7-vs-bat-q9/",
  "/kennis/noodstroom/",
  "/kennis/installatiecheck/",
  "/kennis/1-fase-of-3-fasen/",
  "/modellen/",
  "/datasheet/",
  "/kennis/prijs-en-installatie/",
  "/kennis/bestaande-zonnepanelen/",
  "/kennis/garantie/"
]);

export function createApp({ config, transport = null, leadStore = null, notificationWorker = null, adminStore = null, distDir = resolve('dist'), now = Date.now, sendTimeoutMs = 25000 } = {}) {
  if (!config) throw new Error('Server configuration is required.');
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  const csp = cspFor(distDir);
  const rates = new Map();
  const idempotency = new Map();
  const recentDeliveries = new Map();
  let daily = { date: '', attempts: 0 };
  let activeSends = 0;
  // In DB mode the durable store is the authority. Never silently fall back
  // to mail-only acknowledgements if the DB is unavailable.
  const intakeReady = () => config.leadEnabled && Boolean(transport) &&
    (config.storageMode === 'database' ? Boolean(leadStore) : true);

  function deliveryResponse(res, entry, status) {
    if (entry.receipt) return res.status(status).json(entry.receipt);
    if (entry.uncertain) return fail(res, 502, 'DELIVERY_UNCERTAIN', 'We konden de ontvangst niet bevestigen. Neem rechtstreeks contact op met Thuisbatterij Team voordat je opnieuw verstuurt.');
    return fail(res, 502, 'DELIVERY_FAILED', 'Je aanvraag is nog niet bevestigd. Probeer opnieuw of neem rechtstreeks contact op met Thuisbatterij Team.');
  }

  function purge(map, time) {
    for (const [key, value] of map) if (value.expires <= time) map.delete(key);
  }
  function clientKey(req) { return config.hash(req.ip || req.socket.remoteAddress || 'unknown'); }
  function sign(value) { return createHmac('sha256', config.csrfSecret).update(value).digest('hex'); }
  function csrfToken() {
    const value = `${now()}.${randomBytes(24).toString('hex')}`;
    return `${value}.${sign(value)}`;
  }
  function csrfCookie(req) {
    return (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith('aura_csrf='))?.slice(10);
  }
  function signedTokenValid(token) {
    if (typeof token !== 'string' || token.length > 200) return false;
    const [issued, random, signature, extra] = token.split('.');
    if (extra || !/^\d{13}$/.test(issued || '') || !/^[a-f0-9]{48}$/.test(random || '') || !/^[a-f0-9]{64}$/.test(signature || '')) return false;
    const age = now() - Number(issued);
    return age >= 0 && age <= CSRF_AGE && safeEqual(signature, sign(`${issued}.${random}`));
  }
  function validCsrf(req) {
    const token = req.get('X-CSRF-Token');
    return signedTokenValid(token) && safeEqual(token, csrfCookie(req));
  }
  function permittedOrigin(req) {
    const supplied = req.get('Origin');
    if (!supplied) return false;
    if (config.allowedOrigins.has(supplied)) return true;
    if (!config.production) {
      try {
        const url = new URL(supplied);
        return ['http:', 'https:'].includes(url.protocol) && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      } catch { return false; }
    }
    return false;
  }

  app.use((req, res, next) => {
    res.set({
      'Content-Security-Policy': csp,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()',
      'Cross-Origin-Resource-Policy': 'same-origin',
    });
    if (config.production) res.set('Strict-Transport-Security', 'max-age=31536000');
    const canonical = new URL(config.siteUrl);
    const hostname = String(req.hostname || '').toLowerCase();
    if (hostname !== canonical.hostname) res.set('X-Robots-Tag', 'noindex, nofollow');
    // Express serves /index.html and /topic/index.html as valid static URLs.
    // Consolidate those explicit aliases before Google can crawl duplicate URLs.
    // Only the actual 13 published canonical pages are eligible; never rewrite
    // API, Beheer, a missing route, or a temporary preview host.
    const isReadRequest = ['GET', 'HEAD'].includes(req.method);
    const cleanCandidate = req.path.endsWith('/index.html')
      ? req.path.slice(0, -'index.html'.length) : null;
    const cleanPath = cleanCandidate && PUBLIC_CANONICAL_PATHS.has(cleanCandidate)
      ? cleanCandidate : req.path;
    const wwwToApex = config.canonicalRedirect && hostname === `www.${canonical.hostname}`;
    if (isReadRequest && (
      (hostname === canonical.hostname && cleanPath !== req.path) || wwwToApex
    )) {
      // Keep query parameters intact for attribution; never send them to logs.
      const query = req.originalUrl.slice(req.path.length);
      return res.redirect(308, `${canonical.origin}${cleanPath}${query}`);
    }
    next();
  });

  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'hyxi-aura', leadEnabled: intakeReady() }));
  app.get('/api/config', (req, res) => {
    // Reuse a still-valid session token so opening another tab does not break this form.
    const existing = csrfCookie(req);
    const token = signedTokenValid(existing) ? existing : csrfToken();
    res.vary('Cookie');
    res.cookie('aura_csrf', token, {
      httpOnly: true, secure: config.production || req.secure, sameSite: 'strict', path: '/', maxAge: CSRF_AGE,
    });
    res.json({ leadEnabled: intakeReady(), csrfToken: token, contact: CONTACT });
  });

  app.post('/api/leads', express.json({ limit: '12kb', type: 'application/json', strict: true }), async (req, res) => {
    if (!req.is('application/json')) return fail(res, 415, 'CONTENT_TYPE', 'De aanvraag kon niet worden gelezen. Vernieuw de pagina en probeer opnieuw.');
    if (!permittedOrigin(req) || !validCsrf(req)) return fail(res, 403, 'SESSION_EXPIRED', 'Je sessie is verlopen. Vernieuw de pagina en probeer opnieuw.');
    if (!intakeReady()) return fail(res, 503, 'UNAVAILABLE', 'Online aanvragen is tijdelijk niet beschikbaar. Neem rechtstreeks contact op met Thuisbatterij Team.');

    const time = now();
    purge(rates, time); purge(idempotency, time); purge(recentDeliveries, time);
    const ip = clientKey(req);
    let rate = rates.get(ip);
    if (!rate) {
      if (rates.size >= MAX_ENTRIES) return fail(res, 503, 'BUSY', 'Het is even druk. Probeer het later nog eens of neem rechtstreeks contact op.');
      rate = { count: 0, expires: time + config.rateWindowMs };
      rates.set(ip, rate);
    }

    const parsed = validateLead(req.body);
    const key = req.get('Idempotency-Key');
    if (!key || !/^[a-zA-Z0-9_-]{16,100}$/.test(key)) return fail(res, 400, 'REQUEST_KEY', 'Vernieuw de pagina en probeer je aanvraag opnieuw.');
    if (!parsed.success) {
      rate.count++;
      if (rate.count > config.rateLimit) return fail(res, 429, 'RATE_LIMITED', 'Je hebt het meerdere keren geprobeerd. Wacht 15 minuten of neem rechtstreeks contact op.');
      return fail(res, 422, 'VALIDATION', 'Controleer de gemarkeerde gegevens.', { fields: parsed.fields });
    }
    const lead = parsed.data;
    if (lead.website) return fail(res, 400, 'INVALID_REQUEST', 'De aanvraag kon niet worden verwerkt. Neem rechtstreeks contact op als dit blijft gebeuren.');
    if (config.storageMode === 'database') {
      // Keep the same request-security controls as the existing mail mode.
      // A committed DB transaction is now the public receipt authority.
      rate.count++;
      if (rate.count > config.rateLimit) {
        res.set('Retry-After', String(Math.ceil((rate.expires - time) / 1000)));
        return fail(res, 429, 'RATE_LIMITED', 'Je hebt het meerdere keren geprobeerd. Wacht 15 minuten of neem rechtstreeks contact op.');
      }
      try {
        const result = await leadStore.receive({ lead, requestKey: key });
        if (!result.duplicate) notificationWorker?.wake?.();
        return res.status(result.duplicate ? 200 : 201).json({
          ok: true, requestId: result.requestId,
        });
      } catch (error) {
        if (error?.code === 'REQUEST_CHANGED') {
          return fail(res, 409, 'REQUEST_CHANGED', 'De gegevens zijn gewijzigd. Start een nieuwe aanvraag.');
        }
        // Do not log SQL error details or request PII. No false acknowledgement.
        console.error('HYXI AURA database intake failed; no receipt was issued.');
        return fail(res, 503, 'STORAGE_UNAVAILABLE', 'Je aanvraag kon niet worden opgeslagen. Neem rechtstreeks contact op met Thuisbatterij Team.');
      }
    }
    const fingerprint = config.hash(JSON.stringify(lead));
    const stored = idempotency.get(key);
    if (stored && stored.fingerprint !== fingerprint) return fail(res, 409, 'REQUEST_CHANGED', 'De gegevens zijn gewijzigd. Start een nieuwe aanvraag.');
    if (stored?.promise) {
      await stored.promise;
      return deliveryResponse(res, stored, 200);
    }
    if (stored?.receipt || stored?.uncertain) return deliveryResponse(res, stored, 200);
    const recent = recentDeliveries.get(fingerprint);
    if (recent) return deliveryResponse(res, recent, 200);

    rate.count++;
    if (rate.count > config.rateLimit) {
      res.set('Retry-After', String(Math.ceil((rate.expires - time) / 1000)));
      return fail(res, 429, 'RATE_LIMITED', 'Je hebt het meerdere keren geprobeerd. Wacht 15 minuten of neem rechtstreeks contact op.');
    }
    const date = new Date(time).toISOString().slice(0, 10);
    if (daily.date !== date) daily = { date, attempts: 0 };
    if (daily.attempts >= config.dailyLimit) return fail(res, 503, 'DAILY_LIMIT', 'Online aanvragen is op dit moment niet beschikbaar. Neem rechtstreeks contact op met Thuisbatterij Team.');
    if (idempotency.size >= MAX_ENTRIES) return fail(res, 503, 'BUSY', 'Het is even druk. Neem rechtstreeks contact op met Thuisbatterij Team.');
    if (activeSends >= 5) return fail(res, 503, 'BUSY', 'Het is even druk. Probeer je aanvraag over een minuut opnieuw.');
    daily.attempts++;
    activeSends++;

    const requestId = stored?.requestId || `AURA-${randomUUID()}`;
    const entry = { fingerprint, requestId, expires: time + 24 * HOUR, receipt: null, promise: null, uncertain: false };
    // Persist only a hash + receipt in memory; personal data is not logged or saved to disk.
    entry.promise = (async () => {
      try {
        const result = await transport.sendMail({
          ...buildLeadMail(config, lead, requestId, time),
          signal: AbortSignal.timeout(sendTimeoutMs),
        });
        if (!recipientAccepted(result, config.smtp.to)) throw Object.assign(new Error('SMTP recipient not accepted'), { code: 'EENVELOPE' });
        entry.receipt = { ok: true, requestId };
        recentDeliveries.set(fingerprint, { receipt: entry.receipt, expires: now() + 10 * 60 * 1000 });
        return entry.receipt;
      } catch (error) {
        // Intentionally omit SMTP error messages and all applicant data from application logs.
        entry.uncertain = !definitelyNotDelivered(error);
        if (entry.uncertain) recentDeliveries.set(fingerprint, { receipt: null, uncertain: true, expires: now() + 24 * HOUR });
        return null;
      }
    })().finally(() => { entry.promise = null; activeSends--; });
    idempotency.set(key, entry);
    await entry.promise;
    return deliveryResponse(res, entry, 201);
  });

  mountAdminRoutes(app, { adminStore, config, now });

  app.all('/api/leads', (_req, res) => { res.set('Allow', 'POST'); fail(res, 405, 'METHOD', 'Deze actie is niet beschikbaar.'); });
  app.use('/api', (_req, res) => fail(res, 404, 'NOT_FOUND', 'Deze pagina bestaat niet.'));
  // Compress public assets only. API responses and their session tokens have
  // already been handled above and never pass through this middleware.
  app.use(compression({ threshold: 1024 }));
  app.use(express.static(distDir, {
    dotfiles: 'deny', index: 'index.html', extensions: ['html'], fallthrough: true,
    setHeaders(res, file) {
      const immutable = /[/\\]assets[/\\].*-[a-zA-Z0-9_-]{8,}\.(?:js|css|woff2?|webp|avif|png|jpe?g|svg)$/.test(file);
      // Explicit XML/XSL MIME types for search crawlers and browser XSLT.
      // XML remains the machine-readable sitemap; XSL affects presentation only.
      if (file.endsWith('/sitemap.xml') || file.endsWith('\\sitemap.xml')) {
        res.set('Content-Type', 'application/xml; charset=UTF-8');
      } else if (file.endsWith('/sitemap.xsl') || file.endsWith('\\sitemap.xsl')) {
        res.set('Content-Type', 'text/xsl; charset=UTF-8');
      }
      res.set('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : /\.(?:html|xml|txt)$/.test(file) ? 'public, max-age=0, must-revalidate' : 'public, max-age=86400');
    },
  }));
  app.use((_req, res) => {
    res.status(404).type('html').send('<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Pagina niet gevonden · HYXI AURA</title><body><main><h1>Deze pagina bestaat niet.</h1><p>Ontdek de HYXI AURA thuisbatterij op onze startpagina.</p><a href="/">Terug naar HYXI AURA</a></main></body></html>');
  });
  app.use((error, _req, res, _next) => {
    if (error?.type === 'entity.too.large') return fail(res, 413, 'TOO_LARGE', 'De aanvraag bevat te veel gegevens. Vernieuw de pagina en probeer opnieuw.');
    if (error instanceof SyntaxError && error.status === 400) return fail(res, 400, 'INVALID_JSON', 'De aanvraag kon niet worden gelezen. Vernieuw de pagina en probeer opnieuw.');
    return fail(res, 500, 'SERVER_ERROR', 'Er ging iets mis. Probeer opnieuw of neem rechtstreeks contact op met Thuisbatterij Team.');
  });
  return app;
}
