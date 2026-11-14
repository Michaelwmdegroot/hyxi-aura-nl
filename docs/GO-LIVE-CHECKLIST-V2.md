# HYXI AURA 2.0 — Go-livechecklist en operationele overdracht
**Status:** checklijst, geen bewijs dat openstaande acties klaar zijn.

## V1-productie
- [x] Eigenaar bevestigt werkende website en 7/10 als ontwerpbasis.
- [x] CI voor Node24/productiebouw/browser/API/Hostinger-startsmoke groen.
- [x] Basis product- en energie-ervaring, Q7/Q9 en adviesformulier aanwezig.
- [ ] Controleer feitelijke openbare /api/health status en variabele leadEnabled.
- [ ] Bevestig één echte herkenbare testaanvraag in leads@thuisbatterijteam.nl met juist gekozen product.
- [ ] Controleer SPF/DKIM/DMARC, Reply-To, spamfolder en verzendfoutscenario.
- [ ] Wijs mailboxbeheerder, escalatie bij uitval en opvolgroutine aan.
- [ ] Verifieer Search Console-eigendom, sitemap en indexatie.
- [ ] Controleer werkelijke privacyrollen, mailbox- en archiefretentie.

## Voordat DB/auth/dashboard live gaan
- [ ] Hostinger MySQL en minimaal bevoorrechte databasegebruiker via hostingomgeving.
- [ ] DB-omgeving variabelen privé invoeren (geen secrets in Git/issue/chat).
- [ ] Back-up, terugzetten en schema rollback getest met fictieve data.
- [ ] Eigenaartoegang, rollen en MFA-toegang goedgekeurd.
- [ ] Autorisatietests, sessieverval, CSRF, rate limiting en privacycheck uitgevoerd.
- [ ] Formulieropslag en e-mailnotificatie apart en zichtbaar gecontroleerd.
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
