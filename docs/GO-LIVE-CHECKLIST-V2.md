# HYXI AURA 2.0 — Go-livechecklist en operationele overdracht

> **Actueel 16 november 2026:** de live adviesaanvraag is aangetoond van HTTP 201/databasecommit tot werkelijke teammail en Odoo-verkoopkans via inkomende e-mail. `/offerte/` is eveneens live (publieke monitor 7/7 PASS). **Eigenaarbesluit: dagelijkse automatische Hostinger-backups zijn een geaccepteerde voorziening en afgevinkt; geen extra backup-/restoreproject als ontwikkelgate.** Niet door ons getest is een afzonderlijke restore. Open: retentie/daadwerkelijke verwijdering, opvolgreminders, KPI's, SEO/GSC en één gecontroleerde live quoteproef. Zie [actuele roadmap](ROADMAP-FASTLANE-2026-11-16.md).
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

## Oorspronkelijke database-/beheeracceptatie (inmiddels live)
- [x] Hostinger MariaDB 11.8.9 en specifieke DB-gebruiker; verbinding en schema gevalideerd via SSH (minimale privileges afzonderlijk beoordelen).
- [x] DB-omgeving privé ingesteld; gebruiker bevestigde verbinding en 4 migraties, zonder geheimen te delen.
- [x] Hostinger's dagelijkse automatische back-upvoorziening **door eigenaar bevestigd en geaccepteerd**; geen eigen backupsysteem nodig. Een onafhankelijke restore is niet als uitgevoerd gerapporteerd en geen ontwikkelblokkade.
- [x] Eerste eigenaaraccount en productie-login bevestigd; password-only (geen MFA) is expliciet door eigenaar gekozen.
- [x] CI-testdekking voor autorisatie, sessieverval, CSRF, loginlimieten en afgeschermde API, met disposable MySQL en browser/a11y; geen claim over een onafhankelijke live penetratietest.
- [x] Productie-integratiebevestiging: één synthetische aanvraag is na databasecommit werkelijk in leads@ en Odoo teruggevonden.
- [ ] Optioneel: visueel hetzelfde dossier onder de bestaande login in /beheer terugvinden; geen nieuwe DB-migratie of account aanmaken.
- [ ] Geen persoonsgegevens in fouten, logs, analytics of tests.

## Offerte- en SEO-/groeivervolg
- [ ] Actuele fabrikantdatasheets en beperkingen opnieuw bevestigen.
- [ ] Alleen geautoriseerde kosten, montage, BTW, garantie en levertijdregels gebruiken.
- [ ] Websitevisie/-screens van 7/10 naar volgende designreview brengen.
- [x] Aparte offertepagina met eigen zoekintentie en canonical/sitemap is live; externe probe 7/7 groen.
- [ ] Meer inhoudelijke SEO-pagina's per eigen bezoekersvraag publiceren; Search Console nog niet geverifieerd.
- [ ] Domeinbesluit vastleggen: eigen functie vs technisch samenvoegen.
- [ ] Meetmodel en cookiebesluit afstemmen vóór analytics.
- [ ] Echte prestaties na livegang en marketingeffect monitoren.

## Elke release
- [ ] Review changeset, security, privacy en productclaims.
- [ ] npm ci, productiebuild, tests, checks, browsers en Lighthouse.
- [ ] Start vanaf productie-only dependencies; direct en hosting-import.
- [ ] Migratie/rollback zonder leadverlies; staging en fallback aanwezig.
- [ ] Verifieer op productie en actualiseer issue + documentatie.
