# HYXI AURA Beheer — uitvoering en activering

> **Huidige status 16 november 2026:** dit document bevat de historische activeringsstappen; **uitvoering is al bevestigd**. MariaDB-migraties 001–004, eigenaaraccount en password-only Beheer bestaan. Er zijn inmiddels echte leads tot Odoo bevestigd en de dashboardwerkbank ondersteunt statussen, zoeken, volgende actie, vervolgdatum en versleutelde notities. Herhaal accountbootstrap of migraties niet. De eigenaar heeft Hostinger's dagelijkse back-ups als voldoende geaccepteerd; geen eigen back-uptraject. Zie [de actuele roadmap](ROADMAP-FASTLANE-2026-11-16.md).

Bijgewerkt 15 november 2026. De implementatie is samengebracht in [PR #13](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/13), inclusief de eerdere database- en authenticatiebranches. Een build of merge schakelt databaseopslag en beheer niet automatisch in.

## Werkende onderdelen

- Responsive beheerinterface op /beheer met login, overzichtscijfers, statusfilter, paginering, dossierdetails en opvolgstatus.
- E-mailadres + één inlogwachtwoord, zonder authenticatorcode, acht uur geldige sessie, persistente loginlimieten, server-side rechten en CSRF/Origin-beveiliging.
- Admin ziet alle dossiers; sales uitsluitend toegewezen dossiers. Admin kan toewijzen aan actieve medewerkers en toewijzingen verwijderen.
- Mailcontrole voor mislukte/onzekere teamnotificaties. De beheerder controleert eerst de ontvangende mailbox en kiest dan expliciet tussen ontvangst bevestigen en opnieuw klaarzetten.
- 'accepted' betekent SMTP-acceptatie; 'confirmed' betekent door een beheerder bevestigde inboxontvangst. Het zijn verschillende statussen.
- Statuswijzigingen, toewijzingen, dossierinzage en mailbeslissingen worden geaudit. Verouderde mailbeslissingen worden op zowel status als verzendpoging afgewezen.
- Eerste eigenaar, vervolgaccounts, wachtwoordherstel, uitschakelen en sessies intrekken via de vertrouwde interactieve terminal. Geen publieke registratie of herstelmail.
- Herstel trekt sessies atomisch in en sluit de race met een al gestarte login met oude credentials. De laatste actieve admin blijft beschermd.
- SMTP_DAILY_LIMIT wordt in database-modus gedeeld door alle workers en blijft behouden na een herstart. Ook mislukte en herhaalde pogingen tellen mee.
- Beheer blijft bereikbaar als de publieke aanvraaginname uitstaat of SMTP-configuratie ontbreekt, mits database en authenticatie kloppen.
- Het frontend ververst CSRF voor mutaties en afmelden. Verlopen sessies en late netwerkantwoorden kunnen gewiste dossiergegevens niet opnieuw plaatsen.

## Voorbereiden

Laat LEAD_STORAGE_MODE=mail en ADMIN_ENABLED=false staan. Gebruik [config/beheer.env.example](../config/beheer.env.example) als aanvulling op de bestaande Hostinger-omgeving. Vul DB-gegevens en drie onafhankelijke cryptosleutels uitsluitend privé in; behoud de werkende SMTP-, ontvanger-, domein- en CSRF-instellingen.

Vanuit de Node-appmap, met Node.js 24 en de juiste private omgeving:

```sh
npm run db:check -- --connection
DB_SCHEMA_APPLY=explicit-review-completed npm run db:prepare
npm run db:check
ADMIN_BOOTSTRAP=interactive-confirmed npm run admin:create
```

db:prepare voert migraties 001–004 expliciet en in volgorde uit, met checksums en controle van de werkelijke tabellen. Het verandert geen featureflag, maakt geen account aan en verstuurt geen mail. Voer de inrichting eerst met fictieve gegevens op de geïsoleerde testdatabase uit en controleer backup/restore voordat de productiedatabase wordt ingericht. DDL draait nooit tijdens build, deployment of startup.

Het eigenaarsscript werkt in mailmodus terwijl beheer gesloten is. De eigenaar voert éénmaal zijn e-mailadres en één zelfgekozen inlogwachtwoord in (minimaal 12 tekens). Geen authenticator, geen tweede wachtwoord, geen 6-cijferige code. Legacy MFA-kolommen blijven leeg; de bestaande Hostinger-database hoeft niet opnieuw gemigreerd.

Vervolgbeheer:

```sh
ADMIN_OPERATIONS=interactive-confirmed npm run admin:manage
```

Acties: list, create, reset, disable en revoke. Controleer de identiteit van de accounthouder rechtstreeks vóór herstel. Een uitgeschakeld account blijft ook na herstel uitgeschakeld.

## Activeren en controleren

Na schema-inrichting, eerste eigenaarlogin, privacy/retentieafspraak en operationele mailboxcontrole:

```dotenv
LEAD_STORAGE_MODE=database
ADMIN_ENABLED=true
LEAD_ENABLED=true
```

LEAD_ENABLED=true vereist daarnaast complete SMTP-instellingen. Controleer na herstart /api/health, afgeschermde toegang zonder login, eigenaarlogin, één herkenbare testaanvraag, ontvangstnummer in beheer en echte ontvangst in leads@thuisbatterijteam.nl. Geautomatiseerde tests voeren die echte mailboxproef nooit uit.

## Verificatie en grens

- De overgenomen commit b834828 had twee geslaagde volledige CI-rondes. De nieuwe exacte commit en bijbehorende testrun staan in PR #13.
- npm test: modellen, mail-API, cryptografie en terminalgrenzen. npm run check: publieke pagina's, assets, SEO en buildgrenzen.
- npm run test:db: echte disposable MySQL 8 met fictieve accounts/aanvragen en fake mailtransporten. Auth, rollen, sessieverval, recovery/races, auditrollback, toewijzing, mailbeslissingen, budgetconcurrency en schema-afwijkingen.
- npm run test:beheer: Chromium en axe voor desktop en 390px mobiel, inclusief CSRF-verversing, late antwoorden, rollen, toewijzing en mailcontrole. Publieke browserreis en Lighthouse blijven aparte CI-stappen.
- De live-read vóór deze wijzigingen op 15 november gaf leadEnabled:false. Online aanvraaginname stond toen uit. Dit bewijst niet welke variabele ontbreekt of dat SMTP werkt.
- Hostinger MariaDB 11.8.9, de databaseverbinding en migraties 001–004 zijn door de eigenaar via SSH bevestigd; daarnaast is /beheer-login met één wachtwoord door een screenshot aangetoond. Backup/restore en echte inboxontvangst blijven te controleren. Productie-activering blijft een aparte hostinghandeling.

## Afzonderlijk vervolgwerk

Interne notities, vervolgdatum/taken, zoeken, auditexport, automatische retentie/verwijdering, uitnodigingen per e-mail, offertegenerator en NIVO Portal-koppeling blijven aparte producttaken. Issues #2–#4 blijven open voor de resterende product- en operationele scope.

Zie [Hostinger-stappen](DATABASE-HOSTINGER-V2.md), [beveiliging](BEHEER-SECURITY.md) en [overdracht 15 november](BEHEER-RELEASE-2026-11-15.md).

## Werkbank: zoeken zonder extra migratie

Vanaf de fast-lane vervolgrelease biedt het aanvraagoverzicht een toetsenbordvriendelijke zoekbalk voor **volledige of gedeeltelijke aanvraagnummer-ID's**. De server filtert op toegestane tekens en bewaakt bestaande admin/sales-toewijzingsrechten; geen gegevens verschijnen in de publieke API. Naam-/e-mailzoeken is bewust nog niet toegevoegd: de contactgegevens liggen versleuteld en we maken geen onbeschermde PII-index aan voor een snelle zoekfeature. Verzoeken met SQL-wildcards worden afgewezen. Dit is de eerste stap van issue #4; interne notities en vervolgacties blijven open.

## P1: versleutelde vervolgacties en interne notities

Binnen bestaande Beheer-authenticatie is een vervolgdossier toegevoegd: **volgende actie**, **vervolgdatum** en **append-only notities**. De drie velden worden als onderdeel van de bestaande AES-256-GCM versleutelde leadpayload opgeslagen. Daardoor is **geen nieuwe migratie** of ongecodeerde persoonsinformatie-index nodig. De update gebruikt een row-lock/transactie zodat een gelijktijdige notitie niet stilletjes wordt overschreven. Alleen geautoriseerde admin of aan dit dossier toegewezen sales mag lezen/schrijven; status, assignee, outbox en sessies blijven ongewijzigd.

Het admin-auditlog en lead-eventlog registreren **wie** een vervolgactie wijzigde, zonder notitietekst in logs, SQL-indexen of tests. Notities worden niet overschreven; maximaal 200 notities van 1000 tekens per dossier en in de UI worden de laatste 10 getoond. Beperk invoer tot zakelijke noodzakelijke informatie. Verwijder-/inzageverzoeken moeten ook deze notities meenemen. Er is nog **geen automatische reminder** of datumoverzicht; die functies blijven vervolgtaken. De HTML en API blijven noindex, CSRF-, sessie- en rollenbeschermd.

## P1 privacyoperaties: geauditeerde export en handmatige HYXI-verwijdering

Vanaf [PR #24](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/24) biedt het bestaande dossier onder **Privacy & dossierbeheer** twee acties exclusief voor actieve beheerders: een gecontroleerde JSON-export en een handmatige, met reden/aanvraagnummer en twee beoordelingen bevestigde databaseverwijdering. De mutatie wordt geaudit; openstaande mailverzendingen en gewonnen klantdossiers worden beschermd. Er is **geen automatische verwijdering op zes maanden** en een HYXI-delete verwijdert geen mailbox-/Odoo-/Hostinger-kopieën. Volledige scope, autorisatie, testbewijs en grenzen: [P1 privacyrunbook](PRIVACY-P1-MANUAL-OPS-2026-11-16.md).

## Phase 3 — vandaag/verlopen en echte lead-KPI's

[PR #26](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/26) heeft de huidige werkbank uitgebreid met een rollenafgeschermd tabblad **Vervolgacties** op basis van Europe/Amsterdam: vandaag/verlopen, zonder nieuwe Odoo-workflow of mailspam. De encrypted due-datum wordt in batches gelezen, maximaal 2.500 actieve dossiers en 100 getoonde acties; bij grotere aantallen toont Beheer een expliciete waarschuwing. [Technische grenzen](P1-DUE-FOLLOWUPS-2026-11-16.md).

[PR #27](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/27) biedt een tabblad **Cijfers** met 14 dagen daadwerkelijke HYXI-registeraanvragen per UTC-dag, advice/quote/overig, voor admin en toegewezen sales. Dit is geen websitebezoek-, funnel-, omzet- of eerste-contactmeting. Er is geen tracker, cookie, nieuwe migratie of externe analytische opslag. [KPI-definities](P2-LEAD-KPIS-2026-11-16.md).
