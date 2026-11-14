/**
 * Local browser-QA API. Never use this as the deployed entry point.
 * Uses an in-memory test transport exclusively: no SMTP connection is created.
 * Start: PORT=3001 QA_MAIL_MODE=accept node tests/preview-api.mjs
 * Failure case: QA_MAIL_MODE=reject. Inspect counts/profile at /__qa/state.
 */
import express from 'express';
import { resolve } from 'node:path';
import { createApp } from '../server/app.mjs';
import { loadConfig } from '../server/config.mjs';
import { validateLead } from '../server/validation.mjs';

if (process.env.NODE_ENV === 'production') {
  throw new Error('The preview QA API is forbidden in production. Use server.mjs.');
}
process.env.NODE_ENV = 'test';
const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Choose a local QA port from 1024 to 65535.');
const mode = process.env.QA_MAIL_MODE || 'accept';
if (!['accept', 'reject'].includes(mode)) throw new Error('QA_MAIL_MODE must be accept or reject.');

// Explicit test-only values: never consume the user's SMTP variables or credentials.
const config = loadConfig({
  NODE_ENV: 'test',
  SITE_URL: 'http://127.0.0.1:4173',
  ALLOWED_ORIGINS: 'http://localhost:4173,http://127.0.0.1:5173,http://localhost:5173',
  LEAD_ENABLED: 'true',
  SMTP_HOST: 'smtp.example.test',
  SMTP_PORT: '465',
  SMTP_SECURE: 'true',
  SMTP_USER: 'sender@example.test',
  SMTP_PASS: 'local-test-placeholder-never-used-to-connect',
  SMTP_FROM: 'sender@example.test',
  LEAD_TO: 'recipient@example.test',
  SMTP_DAILY_LIMIT: '100',
  LEAD_RATE_LIMIT: '60',
  CSRF_SECRET: 'local-browser-test-secret-not-a-production-secret',
  TRUST_PROXY: 'false',
});
const state = { mode, attempts: 0, accepted: 0, rejected: 0, latestStatus: null, latestProfile: null };
const transport = {
  async sendMail(mail) {
    if (mail.to !== 'recipient@example.test') throw new Error('QA transport recipient invariant failed.');
    state.attempts++;
    if (mode === 'reject') {
      state.rejected++;
      throw Object.assign(new Error('Intentional local QA recipient rejection'), { code: 'EENVELOPE', responseCode: 550 });
    }
    state.accepted++;
    return { accepted: ['recipient@example.test'], rejected: [] };
  },
};

const app = express();
app.disable('x-powered-by');
app.get('/__qa/state', (_req, res) => {
  res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
  res.json(state);
});
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/api/leads') res.once('finish', () => {
    state.latestStatus = res.statusCode;
    const checked = validateLead(req.body);
    // Only bounded enums/numbers are kept. No name, email, phone, postcode or UTM data.
    if (checked.success) state.latestProfile = { ...checked.data.profile };
  });
  next();
});
app.use(createApp({ config, transport, distDir: resolve(import.meta.dirname, '../dist') }));
const server = app.listen(port, '127.0.0.1', () => {
  console.log(JSON.stringify({ service: 'AURA local QA API — simulated mail only', port, mode, pid: process.pid }));
});
server.requestTimeout = 30000;
server.headersTimeout = 15000;
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => server.close(() => process.exit(0)));
