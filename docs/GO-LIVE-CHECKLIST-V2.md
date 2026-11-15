# HYXI AURA 2.0 — Go-livechecklist en operationele overdracht

> **Actueel 16 november 2026:** website, database, password-only `/beheer`, privacycorrectie en publieke aanvraag-API werken. Een synthetische productieaanvraag is als HTTP 201 opgeslagen, ontvangen in `leads@` en door inkomende-e-mailautomatisering in Odoo CRM als verkoopkans verschenen (eigenaarbewijs). Productiecode bevat nu ook `/offerte/` na PR #21; afzonderlijke quote-livecontrole blijft nodig. **Open P0-operations:** gecontroleerde back-up/herstelproef, retentie/verwijderproces en betrokken opvolgverantwoordelijken. Zie [status 16 november](STATUS-P0-P1-2026-11-16.md).
**Status:** checklijst, geen bewijs dat openstaande acties klaar zijn.

## V1-productie
- [x] Eigenaar bevestigt werkende website en 7/10 als ontwerpbasis.
- [x] CI voor Node24/productiebouw/browser/API/Hostinger-startsmoke groen.
- [x] Basis product- en energie-ervaring, Q7/Q9 en adviesformulier aanwezig.
- [x] Externe productiereadiness controleerde /api/health en /api/config: leadEnabled=true.
- [x] Één synthetische aanvraag met correct BAT-Q9-profiel is door de API bevestigd, daadwerkelijk in leads@ ontvangen en ook als Odoo CRM-lead geregistreerd.
- [ ] Controleer SPF/DKIM/DMARC, Reply-To, spamfolder en verzendfoutscenario.
- [ ] Wijs mailboxbeheerder, escalatie bij uitval en opvolgroutine aan.
- [ ] Verifieer Search Console-eigendom, sitemap en indexatie.
- [ ] Controleer werkelijke privacyrollen, mailbox- en archiefretentie.

## Voordat DB/auth/dashboard live gaan
- [x] Hostinger MariaDB 11.8.9 en specifieke DB-gebruiker; verbinding en schema gevalideerd via SSH (minimale privileges afzonderlijk beoordelen).
- [x] DB-omgeving privé ingesteld; gebruiker bevestigde verbinding en 4 migraties, zonder geheimen te delen.
- [ ] Back-up, terugzetten en schema rollback getest met fictieve data.
- [x] Eerste eigenaaraccount en productie-login bevestigd; password-only (geen MFA) is expliciet door eigenaar gekozen.
- [ ] Autorisatietests, sessieverval, CSRF, rate limiting en privacycheck uitgevoerd.
- [ ] **P0 restacceptatie:** het synthetische aanvraagnummer is na DB-commit ook in leads@ en Odoo bevestigd; nog visueel onder bestaande login in /beheer terugvinden.
- [ ] Geen persoonsgegevens in fouten, logs, analytics of tests.

## Voordat offerte- en SEO-fase uitrollen
- [ ] Actuele fabrikantdatasheets en beperkingen opnieuw bevestigen.
- [ ] Alleen geautoriseerde kosten, montage, BTW, garantie en levertijdregels gebruiken.
- [ ] Websitevisie/-screens van 7/10 naar volgende designreview brengen.
- [ ] Nieuwe SEO-pagina's schrijven voor unieke gebruikersvragen.
- [ ] Domeinbesluit vastleggen: eigen functie vs technisch samenvoegen.
- [ ] Meetmodel en cookiebesluit afstemmen vóór analytics.
- [ ] Echte prestaties na livegang en marketingeffect monitoren.

## Elke release
- [ ] Review changeset, security, privacy en productclaims.
- [ ] npm ci, productiebuild, tests, checks, browsers en Lighthouse.
- [ ] Start vanaf productie-only dependencies; direct en hosting-import.
- [ ] Migratie/rollback zonder leadverlies; staging en fallback aanwezig.
- [ ] Verifieer op productie en actualiseer issue + documentatie.
