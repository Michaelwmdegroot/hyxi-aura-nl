# Working on HYXI AURA

- Use Node.js 24 and the committed npm lockfile. `npm run dev` runs the frontend and lead API together.
- Keep product facts traceable to `src/product-data.mjs` and `docs/PRODUCT-SOURCES.md`. The current manufacturer datasheets are preliminary. Never invent prices, savings, stock, guarantees, reviews or dealer status.
- FAQ content is generated from `src/product-data.mjs` during the build. Keep the visible specifications and explanations consistent with that data.
- The lead journey must preserve the chosen configuration. Show success only after the server confirms acceptance for the configured team recipient. Keep the direct contact route available on failure.
- Use injected test transports for verification; automated tests must never send real emails. Do not commit credentials, contact records or `.env`.
- Preserve keyboard navigation, reduced-motion behavior, narrow-screen layout and the functional SVG fallback when WebGL is unavailable.
- Before a release, run `npm run build`, `npm test` and `npm run check`. CI also verifies the browser journey and measures Lighthouse. Inspect concrete failures and audit findings.
- Production starts through `server.mjs` and serves only `dist`. Development/QA helpers and source files are not public production assets.
- Keep deploy instructions in `docs/HOSTINGER.md` current. Deployment targets `main`; domain, DNS, HTTPS and real SMTP configuration are separate hosting steps.

- V2 encrypted MySQL mode is opt-in via `LEAD_STORAGE_MODE=database` and not enabled on production; default remains `mail`. Never switch production before backups, staging, privacy/retention and incident monitoring are independently validated.
- Keep `LEAD_ENCRYPTION_KEY`, `LEAD_HASH_SECRET` and all DB credentials only in secure Hostinger environment settings. A lost encryption key loses the ability to decrypt; a rotated HMAC key affects idempotency.
- The database receipt confirms only committed storage; SMTP acceptance and true inbox delivery must be tracked separately. Never silently fall back to SMTP-only after a DB outage.
- Use CI's disposable MySQL service for database regression tests; never connect tests to live database or send real mail.
