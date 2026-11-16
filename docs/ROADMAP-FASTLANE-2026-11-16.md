# HYXI AURA — actuele fast-lane roadmap en besluiten
**Statusdatum:** 16 november 2026  
**Productie:** https://hyxi-aura.nl · https://hyxi-aura.nl/offerte/ · https://hyxi-aura.nl/beheer  
**GitHub:** https://github.com/Michaelwmdegroot/hyxi-aura-nl · `main`  
**Masterissue:** [#10](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/10)

> **Deze roadmap is vanaf 16 november 2026 de actuele statusbron.** Documenten van 14–15 november beschrijven grotendeels historische implementatie- en activeringsstappen. Lees deze roadmap vóór je oude TODO's opnieuw uitvoert.

Zie ook [Phase 3-bewijs en exacte productietests](PHASE3-VERIFIED-2026-11-16.md). **Voor de overname na deze afgeronde fase zijn [de definitieve Phase 4-handoff](HANDOFF-PHASE4-2026-11-16.md) en [de volgende agent-startprompt](STARTPROMPT-PHASE4-2026-11-16.md) leidend.**

## 1. Vaststaande eigenaarbesluiten

- **Fast lane:** bouw concrete verbeteringen op de werkende site; geen nieuwe architectuur, onnodige stagingfases, accountprocedures of langlopende procesdiscussie.
- **Back-ups: GEREED / beheer door Hostinger.** De eigenaar bevestigt dat Hostinger dagelijks automatische back-ups maakt en dat dit systeem naar zijn oordeel goed werkt. Voor dit project geldt dat als **geaccepteerde back-upvoorziening**. **Niet opnieuw een back-upsysteem bouwen of een aparte herstelproef als actieve ontwikkelblokkade opvoeren.** Er is in deze projectdocumentatie geen onafhankelijk uitvoerde hersteltest aangetoond: suggereer dat dus niet. Bij een werkelijk herstelincident Hostinger-backups en de beveiligd bewaarde encryptiesleutel gebruiken.
- **Beheer:** e-mailadres + één wachtwoord. Geen MFA, TOTP, authenticator, zescijferige code, extra wachtwoord of publieke registratie. MariaDB 11.8.9, migraties 001–004 en eigenaaraccount bestaan al.
- **Autonoom:** HYXI functioneert op Hostinger met eigen database, Node-app, SMTP en beveiligd /beheer; geen draaiende Mac, OpenClaw of NIVO Portal nodig.
- **Odoo:** de binnenkomende HYXI-notificatie wordt door de **bestaande e-mailimport** automatisch een Odoo-CRM-verkoopkans en toegewezen aan de teamleider. **Er is geen HYXI→Odoo REST- of Portal-API-koppeling**; die is momenteel niet nodig.
- **Zakelijke claims:** geen verzonnen prijzen, besparingen, technische specificaties, voorraad, subsidie, garantie of automatische bindende offerte. Productfacts verwijzen naar `src/product-data.mjs` en `docs/PRODUCT-SOURCES.md`, met de voorlopige fabrikantdatasheets als bron.
- **Privacy:** echte contactdata, notities en geheimen nooit in GitHub, issuecommentaren, Analytics of testfixtures.

## 2. Bewijs — wat is daadwerkelijk klaar?

| Component | Actuele status | Controle / bewijs |
| --- | --- | --- |
| Premium publieke HYXI-basis | **LIVE** | Productervaring, Three.js/SVG-fallback, Q7/Q9-configurator en adviesflow; eigenaarsscore historisch 7/10 |
| Hostinger / database / Beheer | **LIVE** | MariaDB 11.8.9, migraties 001–004, password-only /beheer; eigenaar heeft ingelogd |
| Veilig aanvragen opslaan | **PRODUCTION PROVEN** | [Eenmalige synthetische actie](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43740720501): HTTP 201 met ontvangstnummer na succesvolle databasecommit |
| E-mail naar verkoopteam | **PRODUCTION PROVEN** | Corresponderende HYXI-mail aangetroffen in echte `leads@thuisbatterijteam.nl`-INBOX; juiste aanvraag-ID en BAT-Q9-profiel |
| Odoo CRM-doorzet | **EIGENAAR BEVESTIGD** | Screenshot: dezelfde aanvraag-ID automatisch als verkoopkans aangemaakt en aan teamleider toegewezen, via e-mailimport |
| Privacyverklaring | **LIVE GECORRIGEERD** | [PR #17](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/17), werkelijke versleutelde opslag en outbox beschreven; **dit betekent niet dat verwijdering al automatisch werkt** |
| Dashboard CRM-light | **GEBOUWD / CI GROEN** | Statussen, toewijzing, zoeken op ID, versleutelde notities en vervolgdatum: [PR #19](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/19) en [PR #20](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/20) |
| Afzonderlijke `/offerte/` | **LIVE, CI GROEN** | [PR #21](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/21); eigen `request_type=quote`, configuratoroverdracht, validatie en interne mail. Een echte afzonderlijke quote-inzending is nog niet aangetoond |
| Productie- en kwaliteitschecks | **ACTIEF** | [Live public-readiness 7/7](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43775254123), [Build & verify](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43775254161) groen |
| Automatische Hostinger-back-ups | **AFGEVINKT OP EIGENAARSAFSPRAAK** | Door eigenaar bevestigd: dagelijks door Hostinger beheerd; geen eigen back-upontwikkeling nodig; restore niet onafhankelijk getest |

De bestaande proef gebruikte correlatie-ID `AURA-5c724b2b-2f4a-40f3-849e-41c7f42db7ad`. Publiceer nooit de volledige mailboxbody of een screenshot met klantgegevens in de repository.

## 3. Echt nog te doen — geprioriteerd op waarde

### Eerst: P1 — afmaken wat bestaande leads oplevert

**A. Privacy & bewaartermijnen ([#2](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/2), [#9](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/9)).** **GEREALISEERD in [PR #24](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/24):** actieve HYXI-beheerders kunnen één dossier inclusief versleutelde notities geauditeerd exporteren en via een dubbele handmatige, streng gevalideerde bevestiging uit de HYXI-database verwijderen. Een lopende mailverzending of gewonnen klantdossier wordt niet stilzwijgend verwijderd; audit behoudt een niet-herleidbaar actie-/redenbewijs. **OPEN:** de zesmaandenbewaarafspraak wordt nog **niet automatisch** afgedwongen, omdat een betrouwbare datum van laatste klantcontact ontbreekt. Het rechtmatige verwijderproces voor e-mail- en Odoo-kopieën vergt aparte uitvoering; Hostinger-backups volgen het door eigenaar geaccepteerde hostingschema. Niet opnieuw de handmatige export/delete-flow bouwen. Lees [de P1 privacy-uitvoeringsdocumentatie](PRIVACY-P1-MANUAL-OPS-2026-11-16.md).

**B. Vervolgacties in Beheer ([#4](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/4)).** **GEREALISEERD in [PR #26](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/26):** vandaag/verlopen taken in eigen tab, Europe/Amsterdam-datum, admin/sales-scope en dossieropening. **Bewuste schaalgrens:** de versleutelde due-datum vergt een server-side scan van maximaal 2.500 actieve dossiers, met zichtbare waarschuwing voor onvolledigheid en maximaal 100 getoonde acties. **OPEN:** een geïndexeerde due-projectie als de leadvolumes werkelijk tegen die limiet lopen en alleen na afstemming met Odoo eventueel een enkele idempotente herinnering. Geen parallel CRM bouwen. [Technisch document](P1-DUE-FOLLOWUPS-2026-11-16.md).

**C. Productieacceptatie offerte ([#5](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/5)).** **GEREED voor de HYXI→mail-keten:** de aparte `/offerte/` is live; [de eenmalige productietest](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43785349123) gaf HTTP 201 na commit, met offerte-ID `AURA-3b22e306-ebee-406f-94f8-8d72b74ffbab`; echte `leads@`-INBOX-ontvangst met 3 × BAT-Q7 en aanvullende wensen is bevestigd. Voor juist deze quote is het Odoo-record niet afzonderlijk gecontroleerd en was er geen ingelogde production-Beheer-dossierinzage. **OPEN:** eventuele aanvullende intake/UX en na noodzaak operationele Odoo-afstemming, geen herhaalde testleads.

**D. Operationele mailcontrole concreet maken ([#9](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/9)).** De SMTP-outbox en Beheer 'Mailcontrole' werken. Verbeter zo nodig de zichtbaarheid van `failed`/`uncertain`, met een eenvoudige escalatie; `accepted` is SMTP-acceptatie en niet automatisch werkelijke inboxontvangst. De e-mailroute naar Odoo werkt al: geen vervangende API bouwen. SPF/DKIM/DMARC, fallback-owner en privacyretentie in mailbox/Odoo zijn onderhoudspunten, geen reden om nieuwe leadcampagnes onnodig te blokkeren.

### Daarna: P2 — groei en sturen op conversie

**E. Privacyvriendelijke KPI's ([#8](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/8)).** **GEREALISEERD in [PR #27](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/27):** 14 dagen werkelijke opgeslagen aanvragen in UTC, advies/offerte/overige, ontbrekende dagen nul en admin/sales-scope, zonder pixels of analytische PII. De gegevens gelden voor **nu nog aanwezige** records, dus geen historische ontvangstgarantie bij verwijdering. **OPEN:** bezoekers-denominator, echte eerste contacttijd en kwalificatie alleen na betrouwbare sales-/Odoo-bron en privacytoets vastleggen; niet zomaar ratios verzinnen. [Definities](P2-LEAD-KPIS-2026-11-16.md).

**F. SEO en Search Console ([#7](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/7)).** Canonicals, vier publieke pagina's, robots en sitemap zijn bereikbaar. Zoekmachine-eigendom en indexatie zijn **niet** geverifieerd. Regel Search Console zodra er passende eigenaarsrechten zijn en publiceer originele informatiepagina's per echte zoekintentie: werking, Q7/Q9-capaciteit/dimensionering, installatiefactoren, noodstroom en prijsbepalende factoren. Citeer actuele officiële fabrikantinformatie. Geen gekopieerde websiteteksten, doorway-varianten of verzonnen prijzen.

**G. Conversie- en visuele kwaliteit ([#6](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/6)).** De door eigenaar gegeven designbaseline is 7/10. Verbeter hero, vertrouwen, productpresentatie en CTA's doelgericht; test 390px/320px mobiel, Safari, keyboard, reduced-motion, WebGL-fallback en echte leadjourney. Gebruik hoogwaardige originele HYXI-beelden; inhoudelijk kloppende illustraties, geen kunstmatig 'AI-landingpage'-gevoel. Geen volledige rebuild of zwaar effect dat laadtijd/leesbaarheid schaadt.

### Later / expliciet niet nodig als P0

**H. Herbruikbare fast-lane starter ([#10](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/10)).** Pas nadat kernworkflows stabiel zijn: merkconfiguratie (domein, ontvangers, thema, legaal), vaste beveiligde lead-api/outbox, minimale Beheer-module, SEO- en testharnas, Hostinger `main`-release. Nieuwe sites moeten eigen waarde/zoekintentie hebben. Vermijd een fictieve oplevering van tientallen identieke landingspagina's.

**Niet nu:** eigen backupsysteem, onafhankelijke restore-oefening als ontwikkelgate, MFA, nieuwe MariaDB, nieuwe eigenaarbootstrap, native Odoo/NIVO Portal API, zware CRM-kloon, ongetoetste automatische offerteprijzen of extra marketingplatforms.

## 4. Huidige issuekaart

| GitHub-issue | Feitelijke status | Wat nog nodig is |
| --- | --- | --- |
| #1 SMTP/livegang/privacy | **Kern gereed en productiebewezen** | Restpunten mailoperatie kunnen naar #9; niet opnieuw de leadflow bouwen |
| #2 MySQL/outbox | **Engine plus handmatige privacyexport/delete gereed** | Betrouwbare laatste-contactdatum, automatische bewaartermijn en externe kopieën blijven open |
| #3 Beheer-login/auth | **Afgerond voor eigenaarsscope** | Optionele uitnodigingen geen huidige afhankelijkheid |
| #4 Werkbank | **Vandaag/verlopen tab gereed** | Scanlimiet 2.500, latere index en evt. dedup Odoo-herinnering |
| #5 Offerte | **Pagina live, quote HTTP201 + inbox bevestigd** | Optionele intake/UX, Odoo-test niet herhaald |
| #6 Premium UX | **Open** | Volgende design-/mobiele verbeterfase |
| #7 SEO | **Technische basis live** | Search Console, indexatie en originele pagina's |
| #8 KPI's | **14-daagse register-KPI's gebouwd** | Betrouwbare bezoekers-/eerste-contactmeting en Search Console blijven open |
| #9 Operations / Portal later | **Back-ups door eigenaar afgevinkt** | Mailmonitoring, privacyoperatie en herstelprocedure; geen Portal nu |
| #10 Master | **Actief** | Deze roadmap is bron voor werkrangorde en fasen |

## 5. Releaseacceptatie en werkafspraken

- Voor elke wijziging: gericht op bestaande `main`, test en PR; volledige CI groen vóór merge. Publieke monitor na productiepush, maar niet verwarren met echte maildelivery.
- Geen geheimen, echte persoonlijke data of onbeschermde SQL-export in bronbeheer. Geen onverwachte bulkmail, automatische verwijderactie of directe Odoo-manipulatie.
- Track `DONE / OPEN / DEFERRED` met controleerbaar bewijs; geen percentage 'project af' verzinnen.
- De volgende agent **begint met hoogwaardige SEO-pagina's/GSC-verificatie en premium conversie-UX**, en werkt zo nodig de gegevensbron voor laatste-contactretentie en schaal/indexering van due-werkvoorraad uit. Bouw **niet opnieuw** geauditeerde privacyexport/delete, vandaag/verlopen, basale lead-KPI's, database, SMTP of Hostinger-backups.
