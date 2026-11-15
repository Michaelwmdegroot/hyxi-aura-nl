# Working on HYXI AURA

> **Current verified status — 16 Nov 2026:** see [P0/P1 status](docs/STATUS-P0-P1-2026-11-16.md). The owner confirmed an Odoo CRM lead generated automatically from the same incoming HYXI test email. GitHub Actions proved one HTTP 201 public lead accepted after DB commit and the corresponding email was independently found in `leads@`; this is email-to-CRM routing, **not a direct Portal/Odoo API**. Password-only Beheer, 001–004 migrations and privacy correction are done. PRs #17–#21 are merged, including `/offerte/`. Remaining critical work: independently proven backup/restore and retention, actual owner/sales follow-up, Search Console and quote-route production acceptance. Do not re-create database, bootstrap users or introduce MFA.

- Use Node.js 24 and the committed npm lockfile. `npm run dev` runs the frontend and lead API together.
- Keep product facts traceable to `src/product-data.mjs` and `docs/PRODUCT-SOURCES.md`. The current manufacturer datasheets are preliminary. Never invent prices, savings, stock, guarantees, reviews or dealer status.
- FAQ content is generated from `src/product-data.mjs` during the build. Keep the visible specifications and explanations consistent with that data.
- The lead journey must preserve the chosen configuration. Show success only after the server confirms acceptance for the configured team recipient. Keep the direct contact route available on failure.
- Use injected test transports for verification; automated tests must never send real emails. Do not commit credentials, contact records or `.env`.
- Preserve keyboard navigation, reduced-motion behavior, narrow-screen layout and the functional SVG fallback when WebGL is unavailable.
- Before a release, run `npm run build`, `npm test` and `npm run check`. CI also verifies the browser journey and measures Lighthouse. Inspect concrete failures and audit findings.
- Production starts through `server.mjs` and serves only `dist`. Development/QA helpers and source files are not public production assets.
- Keep deploy instructions in `docs/HOSTINGER.md` current. Deployment targets `main`; domain, DNS, HTTPS and real SMTP configuration are separate hosting steps.

- Source defaults remain `LEAD_STORAGE_MODE=mail`; however the owner has already logged into production /beheer, which implies live database-mode administration. Do not incorrectly report production still in mail-only mode. Independently verify `LEAD_ENABLED` and actual end-to-end lead+SMTP delivery. Treat backup/restore and privacy/retention as priority release follow-up; no needless restaging or repeated DB migration.
- Keep `LEAD_ENCRYPTION_KEY`, `LEAD_HASH_SECRET` and all DB credentials only in secure Hostinger environment settings. A lost encryption key loses the ability to decrypt; a rotated HMAC key affects idempotency.
- The database receipt confirms only committed storage; SMTP acceptance and true inbox delivery must be tracked separately. Never silently fall back to SMTP-only after a DB outage.
- Use CI's disposable MySQL service for database regression tests; never connect tests to live database or send real mail.

- `ADMIN_ENABLED=false` is the code default; owner's production /beheer screenshot confirms active admin session. MariaDB migrations 001–004 and first owner account are already complete. Password-only trusted-terminal account management and the outbox incident workflow are implemented. Do not request new admin bootstrap, secret regeneration or TOTP. See docs/HANDOFF-LEADGEN-2026-11-15.md.
- Test dashboard security with disposable CI MySQL (tests/admin-integration.mjs) plus browser/accessibility tests (tests/beheer-browser.mjs) and never use real contacts or production credentials in QA.
- Browser dashboard must stay within a 390px viewport without document expansion; the mobile list uses responsive cards while maintaining semantic table cells.
