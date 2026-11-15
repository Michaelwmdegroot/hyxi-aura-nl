# HYXI AURA — definitieve faseoverdracht | 15 november 2026

**Status:** website, database en privé-dashboard zijn live / door eigenaar bevestigd; **volledig geautomatiseerde leadmachine is nog NIET bewezen of afgerond**. Dit document vervangt verouderde statusaannames in eerdere projectplannen, maar wist de historische documenten niet.

**Project:** https://hyxi-aura.nl · **Repo:** https://github.com/Michaelwmdegroot/hyxi-aura-nl · **productiebranch:** main · **hoofdissue:** #10 · **projectstartprompt:** [NEXT-AGENT-LEADGEN-2026-11-15.md](NEXT-AGENT-LEADGEN-2026-11-15.md).

## 1. Missie en eigenaarbesluiten

Een **zelfstandig draaiende, SEO- en conversiegerichte HYXI AURA-leadgenerator** voor NIVO Groep Holland B.V., met opvolging/uitvoering bij **Thuisbatterij Team**. Leads horen in de beveiligde database en een interne melding hoort naar **leads@thuisbatterijteam.nl**. De site moet zonder draaiende privé-Mac, Codex, OpenClaw of NIVO Portal blijven werken. Portal-integratie komt pas wanneer het ontvangende systeem klaar is.

**Fast lane is bindend:** de eigenaar wil veel vergelijkbare websites realiseren. Lever bruikbare resultaten zonder langdurig debat over infrastructuur of steeds extra prompts. Behoud beveiliging op de achtergrond, maar **geen MFA/TOTP/zescijferige code** voor HYXI Beheer. Beheer gebruikt **één persoonlijk inlogwachtwoord** plus e-mailadres; géén publieke registratie. Hero/UX is naar oordeel eigenaar 7/10: een werkende basis, niet de eindkwaliteit.

De website is **geen officiële HYXI-fabrikantwebsite**. Geen gefingeerde productdata, reviews, garantie, prijzen, subsidies, opbrengsten of ROI. Offertes worden pas bindend na menselijke technische/commerciële beoordeling. Houd de productdata herleidbaar; de datasheet van 26 oktober 2026 was voorlopig.

## 2. Geverifieerd en afgerond

| Onderdeel | Bewijs / status |
| --- | --- |
| Website op Hostinger | Eigenaar heeft werkende publieke landingspagina bevestigd, 14 nov 2026 |
| Productbeleving | Three.js energiewoning met SVG-fallback, scenario's, BAT-Q7/Q9-configurator 1–6 modules, 3-staps adviesaanvraag; gebouwd en CI-getest |
| Backend | Node.js 24, Express 5, Vite, Zod, Nodemailer, mysql2; Hostinger deployt vanaf main |
| Database | Eigenaar voerde via Hostinger-SSH verbindingstest uit: **11.8.9-MariaDB-log**, aanvankelijk **0 tabellen** |
| Migraties | 001_initial_leads, 002_admin_auth, 003_account_audit, 004_notification_budget **alle vier applied**; volledige schema/checksum-check **geslaagd** |
| Eigenaarsaccount | Eigenaar zag in SSH: **Beheeraccount aangemaakt: info@hyxi-aura.nl** |
| Dashboard | Eigenaar heeft 15 nov screenshot aangeleverd van **ingelogde** https://hyxi-aura.nl/beheer; overzicht, statusfilter en Mailcontrole zichtbaar; **0 aanvragen** |
| Beveiliging | E-mailadres + **één** wachtwoord zonder TOTP (PR #15); salted scrypt, loginlimieten, rollen admin/sales, CSRF/Origin, sessies, audit, geen openbare signup |
| Lead-opslag in code | Versleutelde MySQL-payload, idempotentie, transacties, gebeurtenislog, notificatie-outbox met dagbudget, fout-/onzekere-mailcontrole; code en disposable MySQL8 CI-tests klaar |
| CI / release | main op overdracht: **4403c343c63fa0d0b34da7d01bdc6e0c3a6b7668** (PR #15); Actions-run **43668258454**: drie jobs groen (Hostinger productie-install/start, MySQL8 integraties, browser/a11y/SEO/Lighthouse) |
| Repositories | PR #13 basisopslag/dashboard; PR #14 eenvoudiger wachtwoordinvoer; PR #15 definitieve **password-only** auth; alle samengevoegd in main |

**Belangrijk onderscheid:** een werkend dashboard met 0 records bewijst alleen dat beheer bereikbaar en geauthenticeerd is. Het **bewijst NIET** dat een bezoeker een aanvraag kan verzenden, dat die duurzaam als lead verschijnt, of dat een bericht de teammailbox bereikt. De eerdere healthcheck op 15 nov **vóór** activering gaf `leadEnabled:false`; de actuele waarde is van buitenaf niet opnieuw bevestigd. Controleer dus opnieuw `/api/health`, zonder de oude uitslag als actuele status te herhalen.

## 3. Wat functioneel al in code zit (niet opnieuw bouwen)

- Publieke configurator, scenario's, driedelige adviesflow, servervalidatie, CSRF/origin- en rate-limit-beveiliging.
- Databasemodus: `aura_leads`, `aura_submission_keys`, `aura_lead_events`, `aura_notification_outbox`, `aura_notification_daily_budget`; commit van dossier + outbox vóór ontvangstbevestiging.
- Beheer op `/beheer`: dashboardtotalen, werkvoorraad, statusfilter/paginering, detail en gekozen configuratie, statussen, toewijzen aan admin/sales, rollen, audit, login/logout.
- Mailcontrole: afzonderlijke status **pending / retry_wait / accepted / failed / uncertain / confirmed**. SMTP-acceptatie is **niet** hetzelfde als echte inboxontvangst. Onzekere aflevering wordt niet automatisch dubbel verzonden.
- De uitgaande outboxworker draait in het Node-proces; er is niet zonder meer een afzonderlijke externe cron of procesgarantie.
- Accounts: eerste eigenaar is aangemaakt, vervolgaccounts/reset/disable/revoke via vertrouwelijke interactieve SSH-terminal; **geen MFA** en geen extra migratie nodig.
- Geen automatische commerciële klantreacties, offertes, uitgebreide opvolging of CRM-synchronisatie claimen.

## 4. Openstaande taken — **volgorde op zakelijke impact**

### P0 — maak het echt een werkende leadmachine

1. **Actuele productieconfiguratie lezen, read-only**: controleer `/api/health`, formulier-API, databasemodus en Hostinger runtime logs. Het ingelogde dashboard impliceert dat Beheer operationeel is, **niet** dat `LEAD_ENABLED` waar is. Beoordeel geen geheimen in chat.
2. **Één echte, herkenbare end-to-end proef** vanaf publieke configurator met eigen testgegevens en bekende keuzes: verzending → server-ontvangstnummer → precies één databaselead in `/beheer` → juiste profielgegevens/status/bron → notificatie in `leads@thuisbatterijteam.nl`. Controleer ontvangst inclusief spamfolder, afzender, SPF/DKIM/DMARC en Reply-To. Bewaar alleen bewijs zonder PII/secrets in GitHub.
3. **Privacyverklaring dringend corrigeren vóór verdere echte intake**: `privacy/index.html` beweert momenteel letterlijk dat de app **geen aparte database met aanvragen** bewaart en dat deduplicatiehashes alleen in servergeheugen staan. Dat is **achterhaald door de ingeschakelde versleutelde database-/outboxmodus**. Leg correct vast: verwerkingsverantwoordelijke, ontvangers, opslag (versleutelde leads, metadata, outbox), bewaartermijnen, rechten, werkelijke handmatige/automatische verwijdering, mailbox-kopieën. Neem bestaande vermelde zesmaandenafspraak niet blind als technisch afgedwongen beleid; afstemming met NIVO/TBT nodig.
4. **Back-up & herstelminimum** voor productie-DB en encryptiesleutels: controleer Hostinger-back-up/SQL-export, veilig herstel en eigenaarschap; geen destructieve test op live. Er is tot nu toe geen geverifieerde herstelproef gerapporteerd. Leg korte incidentprocedure vast voor DB- en SMTP-uitval.
5. **Mailbox-eigenaarschap en opvolging**: wijs aan wie `leads@` dagelijks opvolgt, hoe een ontbrekende mail wordt gesignaleerd en hoe teamleden direct vanuit Beheer op leads reageren. Verlies geen records door onzichtbare filters.

**P0 Definition of Done:** geldige testaanvraag staat duurzaam in database én is aangetroffen in de teammailbox; er is geen vals succes; openbare privacybeschrijving matcht het systeem; eenvoudige back-up/herstel- en escalatieroute is vastgelegd; screenshot of korte log van groen resultaat zonder persoonsgegevens.

### P1 — maak de leadverwerking zo automatisch mogelijk

6. **Opvolgwerkbank afronden** (issue #4): interne notities, vervolgdatum, volgende actie, zoekfunctie, duidelijke eigenaar, eenvoudig te gebruiken lead-status/kwalificatie. Behoud 1-scherm-overzicht en responsive dashboard, geen zware CRM-kloon.
7. **Offerteaanvraag 2.0** (issue #5): tweede expliciete CTA naast advies, slimme conditionele intake, behoud gekozen Q7/Q9-profiel, in database zichtbaar als apart aanvraagtype. Geen automatische bindende prijs. Optionele offerte-engine pas met goedgekeurde verkoopvoorwaarden.
8. **Mailautomatisering**: notificatie-outbox en mailboxprocedure in P0 testen; daarna nette interne leadmeldingen, optionele ontvangstbevestiging aan consument en opvolgreminders. Transactieberichten alleen bij passende grondslag en met goedgekeurde teksten. Geen ongecontroleerde commerciële e-mailblast.
9. **Betrouwbaar beheer**: beoordeel datagebruik, verplichte opschoning en privacyrechten; herstelprocedure en foutdetectie; bewaak `failed`/`uncertain` zonder PII in logs; bouw automatische verwijdering pas na expliciete bewaartermijnbesluiten.

### P2 — structureel verkeer en conversie

10. **SEO production proof** (issue #7): Search Console eigendomsverificatie, `robots.txt`, `sitemap.xml`, canonical, 404/redirects, indexatie en mobiele echte webprestaties; originele inhoud op HYXI-vragen (werking, capaciteit, installatie, back-up, kostenfactoren) uit actuele officiële bronnen.
11. **Conversiemetingen en KPI's** (issue #8): privacyvriendelijke events voor start/voltooiing, aanvragen, kwalificatie en doorlooptijd eerste contact; deduplicatie. Metingen zonder persoonsgegevens in advertentietrackers. Koppel GSC wanneer eigenaar toestemming/toegang geeft.
12. **Conversie-UX van 7/10 naar aantoonbaar beter** (issue #6): hero/CTA, configurator-overzicht en mobiel; designverbetering mag leadflow, toegankelijkheid, prestaties en SEO niet breken.
13. **Schaalbare fast-lane blauwdruk**: herbruikbare Node/Hostinger-leadkit, env-checks, dashboard/login, mailrouting, SEO/schema, tests en release-playbook voor volgende domeinen. **Geen 100 bijna identieke doorway-sites/linkfarm:** per domein een echte eigen functie, doelgroep en zoekintentie, of canonieke samenvoeging.

### P3 — later, géén huidige blokkade

14. **NIVO Portal / Odoo-koppeling** pas als ontvangende API, rechten, contract, idempotentie en veilige replay klaarstaan (issue #9). HYXI moet **zonder die koppeling volledig zelfstandig leads opleveren**.
15. Grotere accountadministratie, geavanceerde rapporten, slimme leadscoring, goedgekeurde offerte-PDF's, experimenten en beheer van meerdere merken pas nadat P0 werkt.

## 5. Actuele issuekaart

| Issue | Betekenis | Eerlijke status |
| --- | --- | --- |
| [#1](../issues/1) | echte lead-mail, privacy | **P0 OPEN**, niet aangetoond |
| [#2](../issues/2) | duurzame DB/outbox | **technische kern GO**, live e2e/retentie/backup OPEN |
| [#3](../issues/3) | auth/accounts | **password-only kern LIVE**, uitnodigingen/comfort OPEN; oude MFA-eis vervallen door eigenaarbesluit |
| [#4](../issues/4) | dashboard/CRM-lite | **MVP LIVE**, notities/taken/zoeken/export OPEN |
| [#5](../issues/5) | offerte-aanvraag | OPEN |
| [#6](../issues/6) | UX/design | OPEN, eigenaar geeft 7/10 |
| [#7](../issues/7) | SEO/GSC | OPEN |
| [#8](../issues/8) | analytics/KPI | OPEN |
| [#9](../issues/9) | monitoring/backup/later Portal | OPEN |
| [#10](../issues/10) | masterplan | dit overdrachtsdocument is de nieuwe statusbron |

## 6. Technische handgrepen voor nieuwe agent

- **Repo:** `Michaelwmdegroot/hyxi-aura-nl`; `main` is Hostinger productie. Werk via kleine featurebranch/PR naar `main`, test en merge wanneer groen; houd productie-ervaring intact.
- **Runtime:** Node.js 24 + Express 5 + Vite 8, mysql2, Nodemailer; Hostinger-app-root `/home/u886757484/domains/hyxi-aura.nl/hbuilds/current/nodejs`. Terminal kan standaard in een **ander domein** openen: gebruik een expliciete `cd`.
- **Configuratie:** `LEAD_STORAGE_MODE=database`, `ADMIN_ENABLED=true` zijn nodig voor de geauthenticeerde live werkbank. Verifieer `LEAD_ENABLED=true` afzonderlijk. `LEAD_TO=leads@thuisbatterijteam.nl`. De backend kan database- en beheerfuncties testen bij gesloten intake.
- **Privé-variabelen:** databasegegevens, `SMTP_*`, `LEAD_ENCRYPTION_KEY`, `LEAD_HASH_SECRET`, `ADMIN_SESSION_SECRET` blijven uitsluitend in Hostinger/kluis. `ADMIN_MFA_KEY` is verouderd en wordt niet gebruikt. **NOOIT** sleutels, wachtwoorden, authenticator-URI's, PII of volledige env-exports in issues/PR's/chat.
- **Migrations:** bestaande `001–004` uitgevoerd op productie. Geen nieuwe migraties/herhaald bootstrap als de schemacontrole goed is. Het eigenaaraccount bestaat al; nooit tweede bootstrap proberen.
- **Code & tests:** `server.mjs`, `server/app.mjs`, `server/db/`, `server/auth/`, `admin/`, `db/migrations/`, `tests/`. Commands: `npm run build`, `npm test`, `npm run check`, `npm run test:db` **alleen geïsoleerde CI**, `npm run test:beheer` met Chromium. Run 43668258454 was groen.
- **Statusbron:** laatste bekende productie-screenshot = ingelogd /beheer met **0 aanvragen**. Publieke URLs kon de overdragende agent tijdens dit gesprek niet opnieuw vanuit zijn browseomgeving ophalen; gebruik dus geen actuele health-/indexatieclaims zonder nieuwe check.
- **Productdata:** `src/product-data.mjs` en `docs/PRODUCT-SOURCES.md`; bewaar SVG-fallback, browsertoegankelijkheid en juiste bron-/juridische merkverklaring.
- **Privacyrisico:** `privacy/index.html` is nu een concreet uitstaand releaseblokkerend document; vergelijk website met nieuwe DB-mode. De oude `docs/HOSTINGER.md`, `docs/PROJECT-PLAN-V2-2026-11-14.md` en `docs/ARCHITECTURE-V2.md` zijn deels historische mail-only/V1-stukken, niet de actuele productiekaart.

## 7. Wat is nog nodig van de eigenaar?

Beperk dit tot de informatie die alleen de eigenaar kan aanleveren: (a) screenshot of leesbare uitslag van `/api/health` als de agent die niet zelf kan bereiken; (b) bevestiging van één testaanvraag en ontvangst in de teammailbox; (c) verantwoordelijke voor mailboxopvolging en bewaartermijn/AVG-afspraken; (d) later goedgekeurde offerteprijzen/productvoorwaarden en Search Console-verificatie. Vraag **niet** opnieuw om DB-aanmaak, migraties, MFA, eerste account of reeds gedeelde gegevens.

## 8. Afsluiting en overdracht

De mijlpaal **landing + Hostinger + MariaDB + password-only Beheer** is afgerond. De volgende agent neemt uitsluitend het **P0 end-to-end bewijs en privacycorrectie**, gevolgd door P1 automatisering en P2 SEO/conversie, over. Houd voortgang zichtbaar in issue #10 en gebruik een korte, éénstaps actie voor de eigenaar wanneer nodig. Geen voortijdige claim dat het systeem al autonoom of leads-genererend is.

**Gerelateerde CI:** https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43668258454 · **Startprompt:** [NEXT-AGENT-LEADGEN-2026-11-15.md](NEXT-AGENT-LEADGEN-2026-11-15.md).
