# HYXI AURA Beheer — uitvoering en activering

Bijgewerkt 15 november 2026. De implementatie is samengebracht in [PR #13](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/13), inclusief de eerdere database- en authenticatiebranches. Een build of merge schakelt databaseopslag en beheer niet automatisch in.

## Werkende onderdelen

- Responsive beheerinterface op /beheer met login, overzichtscijfers, statusfilter, paginering, dossierdetails en opvolgstatus.
- Wachtwoord + verplichte authenticatorcode, acht uur geldige sessie, persistente loginlimieten, server-side rechten en CSRF/Origin-beveiliging.
- Admin ziet alle dossiers; sales uitsluitend toegewezen dossiers. Admin kan toewijzen aan actieve medewerkers en toewijzingen verwijderen.
- Mailcontrole voor mislukte/onzekere teamnotificaties. De beheerder controleert eerst de ontvangende mailbox en kiest dan expliciet tussen ontvangst bevestigen en opnieuw klaarzetten.
- 'accepted' betekent SMTP-acceptatie; 'confirmed' betekent door een beheerder bevestigde inboxontvangst. Het zijn verschillende statussen.
- Statuswijzigingen, toewijzingen, dossierinzage en mailbeslissingen worden geaudit. Verouderde mailbeslissingen worden op zowel status als verzendpoging afgewezen.
- Eerste eigenaar, vervolgaccounts, herstel van wachtwoord én MFA, uitschakelen en sessies intrekken via de vertrouwde interactieve terminal. Geen publieke registratie of herstelmail.
- Herstel trekt sessies atomisch in en sluit de race met een al gestarte login met oude credentials. De laatste actieve admin blijft beschermd.
- SMTP_DAILY_LIMIT wordt in database-modus gedeeld door alle workers en blijft behouden na een herstart. Ook mislukte en herhaalde pogingen tellen mee.
- Beheer blijft bereikbaar als de publieke aanvraaginname uitstaat of SMTP-configuratie ontbreekt, mits database en authenticatie kloppen.
- Het frontend ververst CSRF voor mutaties en afmelden. Verlopen sessies en late netwerkantwoorden kunnen gewiste dossiergegevens niet opnieuw plaatsen.

## Voorbereiden

Laat LEAD_STORAGE_MODE=mail en ADMIN_ENABLED=false staan. Gebruik [config/beheer.env.example](../config/beheer.env.example) als aanvulling op de bestaande Hostinger-omgeving. Vul DB-gegevens en vier onafhankelijke cryptosleutels uitsluitend privé in; behoud de werkende SMTP-, ontvanger-, domein- en CSRF-instellingen.

Vanuit de Node-appmap, met Node.js 24 en de juiste private omgeving:

```sh
npm run db:check -- --connection
DB_SCHEMA_APPLY=explicit-review-completed npm run db:prepare
npm run db:check
ADMIN_BOOTSTRAP=interactive-confirmed npm run admin:create
```

db:prepare voert migraties 001–004 expliciet en in volgorde uit, met checksums en controle van de werkelijke tabellen. Het verandert geen featureflag, maakt geen account aan en verstuurt geen mail. Voer de inrichting eerst met fictieve gegevens op de geïsoleerde testdatabase uit en controleer backup/restore voordat de productiedatabase wordt ingericht. DDL draait nooit tijdens build, deployment of startup.

Het eigenaarsscript werkt al in mailmodus terwijl beheer gesloten is. Vanaf de fast-lane-correctie vraagt de terminal het zelfgekozen Beheer-wachtwoord slechts één keer (minimaal 12 niet-lege tekens) in plaats van twee verborgen prompts. Dat is het enige inlogwachtwoord; MFA blijft verplicht. Het toont de authenticatorinstelling alleen in de vertrouwde terminal. Wacht na bevestiging op een nieuwe code voordat je inlogt: de instelcode mag niet worden hergebruikt.

Vervolgbeheer:

```sh
ADMIN_OPERATIONS=interactive-confirmed npm run admin:manage
```

Acties: list, create, reset, disable en revoke. Controleer de identiteit van de accounthouder rechtstreeks vóór herstel. Een uitgeschakeld account blijft ook na herstel uitgeschakeld.

## Activeren en controleren

Na schema-inrichting, herstelproef, eigenaar/MFA, privacy/retentieafspraak en operationele mailboxcontrole:

```dotenv
LEAD_STORAGE_MODE=database
ADMIN_ENABLED=true
LEAD_ENABLED=true
```

LEAD_ENABLED=true vereist daarnaast complete SMTP-instellingen. Controleer na herstart /api/health, afgeschermde toegang zonder login, eigenaarlogin, één herkenbare testaanvraag, ontvangstnummer in beheer en echte ontvangst in leads@thuisbatterijteam.nl. Geautomatiseerde tests voeren die echte mailboxproef nooit uit.

## Verificatie en grens

- De overgenomen commit b834828 had twee geslaagde volledige CI-rondes. De nieuwe exacte commit en bijbehorende testrun staan in PR #13.
- npm test: modellen, mail-API, cryptografie en terminalgrenzen. npm run check: publieke pagina's, assets, SEO en buildgrenzen.
- npm run test:db: echte disposable MySQL 8 met fictieve accounts/aanvragen en fake mailtransporten. Auth, rollen, MFA, sessieverval, recovery/races, auditrollback, toewijzing, mailbeslissingen, budgetconcurrency en schema-afwijkingen.
- npm run test:beheer: Chromium en axe voor desktop en 390px mobiel, inclusief CSRF-verversing, late antwoorden, rollen, toewijzing en mailcontrole. Publieke browserreis en Lighthouse blijven aparte CI-stappen.
- De live-read vóór deze wijzigingen op 15 november gaf leadEnabled:false. Online aanvraaginname stond toen uit. Dit bewijst niet welke variabele ontbreekt of dat SMTP werkt.
- Echte Hostinger-DB, backup/restore, eigenaaraccount en inboxontvangst zijn vanuit deze ontwikkelomgeving niet geverifieerd. Productie-activering blijft een aparte hostinghandeling.

## Afzonderlijk vervolgwerk

Interne notities, vervolgdatum/taken, zoeken, auditexport, automatische retentie/verwijdering, uitnodigingen per e-mail, offertegenerator en NIVO Portal-koppeling blijven aparte producttaken. Issues #2–#4 blijven open voor de resterende product- en operationele scope.

Zie [Hostinger-stappen](DATABASE-HOSTINGER-V2.md), [beveiliging](BEHEER-SECURITY.md) en [overdracht 15 november](BEHEER-RELEASE-2026-11-15.md).
