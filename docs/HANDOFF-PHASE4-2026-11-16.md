# HYXI AURA — definitieve Phase 3-oplevering en Phase 4-handoff

**Datum:** 16 november 2026  
**Status:** Phase 3 technisch afgerond, code gemerged naar `main`; Phase 4 kan direct bouwen op bestaande code.  
**Productie:** https://hyxi-aura.nl · https://hyxi-aura.nl/offerte/ · https://hyxi-aura.nl/beheer  
**Repository:** https://github.com/Michaelwmdegroot/hyxi-aura-nl  
**Masterissue:** https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/10

> **Dit is de leidende overdracht vanaf 16 november.** Oudere overdrachten en startprompts bevatten historische P0- en P1-acties en mogen niet als nieuwe opdrachten worden herhaald. De opvolgende agent leest eerst dit document, `AGENTS.md`, de [actuele roadmap](ROADMAP-FASTLANE-2026-11-16.md), [Phase 3-bewijs](PHASE3-VERIFIED-2026-11-16.md) en de [Phase 4-startprompt](STARTPROMPT-PHASE4-2026-11-16.md).

## 1. Exacte technische uitgangspositie

- `main` op overdrachtsmoment: **`8a19072aec9f96e8273833010e2a1462a37d1fcd`** (gemergede documentatie-PR #28).
- Volledige [Build & verify-run 43786070506](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43786070506) **SUCCESS**. Daarin: Node.js 24, tests, productiebouw, geïsoleerde MySQL, browserreizen op desktop/mobiel, beheer, toegankelijkheid en Lighthouse volgens bestaande CI.
- Onafhankelijke [publieke productiecheck 43786070507](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43786070507) **SUCCESS**: **7/7** checks waaronder publieke intake ingeschakeld, privacy live, `/offerte/`, sitemap, robots en Beheer-lead-API 401 zonder sessie. **Deze publieke check leest geen echte privé-dossiers of SMTP-inbox.**
- Op overdrachtsmoment **geen open pull requests**. De volgende agent maakt nieuwe gerichte branches vanaf actuele `main`.
- Hostinger Node.js 24 + MariaDB 11.8.9; migraties **001–004** en eigenaaraccount bestaan; login **e-mailadres + één wachtwoord zonder MFA/TOTP** is een bindend eigenaarbesluit. Beheer: `/beheer`; herhaal databasebootstrap of migraties niet.
- Hostinger maakt volgens eigenaar **dagelijks automatisch back-ups**; voorziening door hem afgevinkt. Geen eigen back-upsysteem of restoreproef als actieve Phase 4-blokkade; een onafhankelijke herstelproef is **niet** uitgevoerd/geclaimd. Sleutels en backups nooit in GitHub.

## 2. Productieacceptatie, strikt gescheiden van code/CI

| Onderdeel | Status | Bewijs / grens |
| --- | --- | --- |
| Adviesaanvraag | **Productiebewezen** | [Eenmalige live test 43740720501](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43740720501): HTTP 201 na MariaDB-commit, correlatie-ID `AURA-5c724b2b-2f4a-40f3-849e-41c7f42db7ad`; corresponderende mail werkelijk aangetroffen in `leads@thuisbatterijteam.nl` |
| Doorzet naar Odoo CRM (advies) | **Door eigenaar bevestigd** | Dezelfde advies-ID was zichtbaar als verkoopkans in Odoo, via **inkomende e-mailimport** en automatische toewijzing. Geen directe HYXI→Odoo-API |
| Aparte `/offerte/` | **Productiebewezen tot en met mailbox** | [Eenmalige quote-test 43785349123](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43785349123): HTTP 201 na commit, ID `AURA-3b22e306-ebee-406f-94f8-8d72b74ffbab`; corresponderende `Nieuwe offerteaanvraag` in `leads@` INBOX, 3 × BAT-Q7 en synthetische projectwensen gecontroleerd. **Odoo voor deze tweede offerte niet onafhankelijk herbevestigd** |
| Live Beheer-eigenaarlogin | **Eerder door eigenaar bevestigd** | Bestaand password-only dashboard, zonder authenticator |
| Nieuwe admin/privacy-, vervolg- en KPI-schermen | **Gemerged + CI/beveiliging/browsertests groen** | Geen afzonderlijke ingevoerde productie-beheersessie met eigenaarwachtwoord uitgevoerd door deze agent. Geen productieprivacy-deletietest |

**Voorkom extra synthetische live-leads:** beide relevante publieke paden hebben al éénmalig ontvangst- en mailboxbewijs; de eenmalige QA-branch voor de quote is uitsluitend historisch bewijs, **geen reguliere CI-opdracht** en mag niet opnieuw worden gestart. Dit is geen commerciële lead.

## 3. Wat volledig is gebouwd: niet opnieuw beginnen

1. **Site/UX-basis:** premium landingspagina met Three.js energiewoning en SVG/WebGL-fallback, scenario's en modulaire HYXI BAT-Q7/BAT-Q9-configurator (1–6 modules), bestaande eigenaarsscore **7/10**.
2. **Aanvragen:** beveiligd adviesformulier en aparte mobiele `/offerte/`, met validatie, Origin/CSRF, idempotentie, versleutelde MariaDB-commit, transactionele SMTP-outbox en ontvangstnummer uitsluitend na geslaagde opslag. Interne leadmail: `leads@thuisbatterijteam.nl`.
3. **Beheer:** password-only, rollen `admin`/`sales`, afgeschermde API, statussen, toewijzing, zoeken op aanvraagnummer, dossierdetails, geauditeerde versleutelde notities en vervolgdatum, mailincidenten en handmatige privacyacties (geen nieuwe accounts).
4. **Privacy P1 — [PR #24](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/24):** beveiligde admin-export en expliciet bevestigde verwijdering van één HYXI-databaselead. Dit verwijdert **geen** e-mail-/Odoo-/Hostinger-backupkopieën en handhaaft **nog niet automatisch** de zesmaandenretentie. [Runbook](PRIVACY-P1-MANUAL-OPS-2026-11-16.md).
5. **Vervolgacties — [PR #26](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/26):** vandaag/verlopen tab voor geautoriseerde gebruikers, kalenderdatum in `Europe/Amsterdam`. **Schaalgrens:** maximaal 2.500 actieve dossiers server-side scannen en eerste 100 acties tonen; UI waarschuwt voor mogelijke onvolledigheid. **Geen automatische herinneringsmail of directe Odoo-koppeling.** [Details](P1-DUE-FOLLOWUPS-2026-11-16.md).
6. **Privacyvriendelijke bron-KPI's — [PR #27](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/27):** Beheer-tab `Cijfers` met 14 UTC-dagen uit nog aanwezige, gecommitte leads: advies/offerte/overig, ontbrekende dagen nul, admin organisatiebreed/sales alleen huidige eigen toewijzing. **Geen pageviews, echte conversieratio's, contacttijd of omzet**; geen extra pixels/cookies. [Definities](P2-LEAD-KPIS-2026-11-16.md).
7. **SEO-basis:** `/`, `/privacy/`, `/bronnen/`, `/offerte/`, canonicals, robots en sitemap, officiële HYXI-afbeeldingen en eerdere bronvastlegging. **Google Search Console-eigendom, werkelijke indexatie en organisch verkeer niet bevestigd**. [SEO-strategie](SEO-STRATEGY.md).

## 4. Werkelijk OPEN, gerangschikt voor Phase 4

**Eerst — [#7 SEO](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/7):** verifieer bestaande Search Console-koppeling als passende toegang beschikbaar is, maar **blokkeer niet** op ontbrekende accountrechten. Implementeer direct één of twee inhoudelijk unieke, nuttige Nederlandse HYXI-kennis-/keuze-pagina's op basis van **actuele officiële productbronnen**: denk aan dimensionering/Q7 versus Q9, voorwaarden bij stroomuitval of installatieafwegingen. Iedere pagina: eigen zoekintentie, verifieerbare feiten, geen overgenomen fabrikanttekst, eigen title/H1/meta/canonical/structured data indien passend, intern linken, sitemap/robots/check/browser; werk `src/product-data.mjs` en bronlog alleen bij verifieerbare wijzigingen bij. Geen prijzen/garanties/opbrengsten fabriceren, voorlopige datasheets niet als definitief presenteren. Vermijd duplicate/doorway-sites.

**Daarna — [#6 premium UX](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/6):** gerichte visuele verbetering van de bestaande 7/10 richting premium vertrouwen en conversie. Gebruik hoogwaardige officiële HYXI-productbeelden en duidelijke NIVO/Thuisbatterij Team-relatie; verbeter bestaande hero, CTA's en mobiele ervaring zonder volledige rebuild of generieke AI-look. Behoud Three.js + SVG-fallback, snelheid, keyboard, reduced-motion. Laat concrete voor/na-bewijzen in GitHub zien.

**Gericht later — [#2 privacy](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/2), [#4 werkbak](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/4), [#8 analytics](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/8), [#9 operations](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/9):** echte datum van laatste menselijk contact/afhandeling voor zesmaandenretentie, verwerking van mailbox-/Odoo-kopieën, uitsluitend bij volumebehoefte due-datum indexeren, reminders alleen wanneer Odoo dit niet al doet, en correcte privacygrondslag voor echte bezoek→aanvraag-conversie. Huidige 14-daagse lead-KPI's zijn **geen** funnelstatistiek. Geen onnodige nieuwe infrastructurele trajecten.

**Toekomstige fast-lane herbruikbaarheid [#10](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/10):** pas uitbouwen na inhoudelijke SEO/UX-volwassenheid; nieuwe sites moeten onderscheiden doelgroep/gebruikerswaarde hebben en mogen geen doorway-netwerk worden.

## 5. Werkmethode en veiligheidsgrenzen

- Werk **direct in bestaande GitHub-code**: lees actuele `main`, maak een kleine featurebranch, implementeer, documenteer, maak PR, draai volledige CI, merge **alleen** als alle relevante jobs groen zijn, verifieer publieke readiness na Hostinger-uitrol, werk issue #10 en relevante issue bij.
- **Geen generieke herbouwplannen** of eindeloze tussenfasen; liever één aantoonbaar werkende, inhoudelijk sterke publicatie dan tien kale SEO-pagina's.
- Nooit echte lead-/inloggegevens, private mailbody, SQL-export, encryptie-/SMTP-/DB-secret in GitHub, logs, tests of screenshots. Geautomatiseerde tests gebruiken alleen disposable MySQL en testtransporten; voer geen echte bulkmail/leadspam uit.
- Geen MFA, nieuwe database, nieuwe eigenaarbootstrap, nieuwe backupworkflow, directe Odoo/Portal-integratie of permanent draaiende Mac als voorwaarde. Geen heimelijke wijzigingen aan `LEAD_*` flags, SMTP, secrets of privacyretentie.
- **Productinformatie:** `docs/PRODUCT-SOURCES.md`, `src/product-data.mjs` en bronpagina; datasheets zijn voorlopige versies. Geen verzonnen reviews, voorraad, garantie, premie, subsidie of prijs.
- **Kwaliteitspoort:** `npm run build`, `npm test`, `npm run check`, geïsoleerde MySQL-integratie, Chromium desktop/mobiel, WCAG/keyboard, Lighthouse en publieke status. Gerapporteerde snelheidsscores gelden uitsluitend voor de geteste fixture/omgeving.

## 6. Definitie van een geslaagde opvolgende sprint

- Ten minste één nuttige, originele **live inhoudelijke SEO-pagina** met correcte bronverwijzing, canonicals, sitemap en interne links, aantoonbaar indexeerbaar (niet hetzelfde als door Google geïndexeerd), plus gerichte UX/conversieverbetering waar getest.
- Geen regressie in het geverifieerde advies-/offertepad, de privéwerkbank of mailverwerking.
- Tests/CI groen, `main` gemerged, externe live-readiness groen en relevante issues/documentatie geüpdatet.
- Open afhankelijkheden (bijv. Search Console-eigendom of Odoo-specifieke contactregistratie) eerlijk afzonderlijk noemen, zonder een niet-uitgevoerde controle als geslaagd te presenteren.

**Start hierna met:** [`STARTPROMPT-PHASE4-2026-11-16.md`](STARTPROMPT-PHASE4-2026-11-16.md).
