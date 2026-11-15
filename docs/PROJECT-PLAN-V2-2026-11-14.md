# HYXI AURA 2.0 — Projectplan en mijlpaaloverdracht
> **Historisch document (stand 14 november 2026).** Sindsdien heeft de eigenaar MariaDB 11.8.9 met migraties 001–004 en het live password-only /beheer bevestigd. Actuele stand, resterende P0-werkzaamheden en volgorde staan in [HANDOFF-LEADGEN-2026-11-15.md](HANDOFF-LEADGEN-2026-11-15.md); dit document is niet langer de actuele productie-statusbron. Echte lead- en mailboxontvangst plus privacycorrectie zijn nog open.

**Datum:** 14 november 2026  
**Status:** V1 live bevestigd door eigenaar, V2 als roadmap (nog niet gebouwd)  
**Hoofdissue:** https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/10

## 1. Mijlpaal 1 — wat staat er nu?
De eigenaar heeft bevestigd dat https://hyxi-aura.nl werkt en de visuele kwaliteit op 7/10 beoordeeld. Dit is een subjectieve baseline en een goede basis, geen onafhankelijk UX-onderzoek.

**Gebouwd en getest in de repository:** Node.js 24 / Express / Vite / Three.js, interactief energiehuis met SVG-fallback, Q7/Q9-configurator met 1–6 modules, drie-staps adviesaanvraag, servervalidatie, CSRF, idempotency, SMTP, fabrikantbronnen, privacy- en bronpagina's, sitemap, canonical, GitHub Actions. De CI-productie-startcontrole is groen.

**Nog niet bewezen:** ontvangst van een echte productiemail in de mailbox, Google-indexatie/Search Console, actuele bezoekerscijfers, echte gekwalificeerde aanvragen, leverbaarheid en definitieve prijzen. Huidige productspecificaties komen uit een voorlopige fabrikantdatasheet van 26 oktober 2026.

**Niet gebouwd:** MySQL-leadregister, login/dashboard, offerteaanvraag als apart dossier, analytics, NIVO Portal-koppeling en automatische offertes.

## 2. Productmissie
Een gespecialiseerde Nederlandse HYXI AURA-productervaring die bezoekers helpt het systeem te begrijpen, een passende configuratie te verkennen en vrijwillig advies of een offerteaanvraag bij Thuisbatterij Team te starten. De website is geen officiële HYXI-fabrikantwebsite. De publieke ervaring moet ook zonder account bruikbaar blijven.

Eigenaar/marketing: betrouwbaar organisch bereik, kwalitatieve leads, inzicht in funnel en snelle opvolging. Team: alle aanvragen terugvindbaar in een lichte, veilige werkbank. Niet-doelen voor V2: een complete CRM-kloon, autonome prijsbeloften, ongerichte linkruil tussen identieke sites of voortijdige NIVO Portal-integratie.

## 3. Prioriteiten
| Prioriteit | Werkpakket | Issue | Resultaat |
|---|---|---|---|
| P0 | SMTP en leadbestemming | [#1](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/1) | Werkelijke aflevering in leads@ bewezen; privacy en fallback kloppen |
| P1 | MySQL en notificatie-outbox | [#2](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/2) | Lead veilig opgeslagen, ook als e-mail tijdelijk wegvalt |
| P1 | Dashboardauthenticatie | [#3](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/3) | Inloggen, MFA voor beheer, rollen en API-authorisatie |
| P1 | Leaddashboard en opvolging | [#4](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/4) | Inbox, status, toewijzing, notities, historie |
| P2 | Offerteaanvraag als tweede conversiepad | [#5](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/5) | Slimme intake, config mee, menselijke offertecontrole |
| P2 | Premium design V2 / interacties | [#6](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/6) | Overtuigender dan huidige 7/10, zonder snelheid te verliezen |
| P2 | Search Console, SEO en domeinplan | [#7](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/7) | Eigen zoekintentie, nuttige content, relevante verwijzingen |
| P2 | Privacyvriendelijke analytics en KPI's | [#8](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/8) | Vertrouwbare funnel en kwaliteit van aanvragen |
| P3 | Monitoring, backups, Portal-gereedheid | [#9](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/9) | Bedrijfszeker beheer en later veilige integratie |

**Volgorde:** #1 nu. #2 vóór #4 en vóór e-mail niet langer enige bewaarplaats is. #3 vóór elke persoonsgegevenspagina in #4. #5 bouwt voort op #2/#4. #6 en SEO-contentvoorbereiding #7 mogen parallel zonder storing van productie. #9 stelt vanaf het begin release-eisen, maar de daadwerkelijke NIVO Portal-koppeling blijft uitgesteld.

## 4. Publieke productervaring
1. **Ontdekken:** sterke hero met authentieke HYXI-productbeelden, helder voordeel en eerste CTA.
2. **Begrijpen:** woning + wissel zonnige middag/avond/stroomuitval; met of zonder batterij; scenario's als *illustratie*.
3. **Samenstellen:** Q7/Q9, nominale vs bruikbare capaciteit, visuele stack met duidelijke beperkingen.
4. **Geschiktheid:** zo min mogelijk vragen over zonnepanelen, verbruik, doel, netaansluiting en indien nodig installatie.
5. **Kiezen:** gratis advies aanvragen of een uitgebreidere offerteaanvraag; de configuratie blijft behouden.
6. **Afronden:** mobiel formulier met duidelijke toestemming, fout-/successtatus en herkenbaar ontvangstnummer.

UX-eisen: rustig, premium, Apple-achtig maar eigen identiteit, wit/offwhite, beperkt accent, hoogwaardige fotografie zonder misleidende AI-productfoto's, subtiele beweging, toetsenbord en reduced motion. Bij interactieve stappen passen keuze en resultaat waar praktisch mogelijk in één scherm; geen overvolle overlays. Richting wordt getoetst met echte Safari/Chrome screenshots op 1440/1280/768/390/320px.

## 5. Backoffice MVP
Secties: **Overzicht** (nieuwe en urgente aanvragen), **Aanvragen** (lijst, zoekfilter, bron), **Aanvraagdetail** (contact en configuratie), **Opvolging** (status, behandelaar, volgende actie), **Statistieken** (later), **Instellingen** (alleen admin). Geen openbare registratie.

Voorgestelde statusflow: Nieuw → Contact gepland → In behandeling → Offerte gevraagd → Offerte verzonden → Gewonnen / Verloren / Niet passend. Iedere statusmutatie heeft een actor, datum en audit-event. Technische opslag en e-mailnotificatie zijn aparte statussen.

## 6. Offerteaanvraag
Een nieuw aanvraagtype voor bezoekers die een concreet voorstel willen. Conditionele velden en een heldere samenvatting, geen volledige technische schouw via een formulier. Aanvraaggegevens komen in dezelfde veilige database en werkbank. Geen definitieve verkoopprijs, rendement of garantieclaim voordat officiële productspecificaties, installatiekosten, BTW en voorwaarden zijn geverifieerd en de offerte door een medewerker is goedgekeurd. Een PDF-offertetool kan later volgen.

## 7. SEO en de circa twintig domeinen
Begin met één betrouwbare, inhoudelijk sterke hyxi-aura.nl. Verifieer indexeerbaarheid, sitemap, canonicals en Search Console. Bouw alleen verdiepingspagina's als ze een eigen bezoekersvraag daadwerkelijk beantwoorden, zoals werking, capaciteit, stroomuitval, technische eisen, kostenfactoren, installatie en echte cases.

Voor elk ander domein beslissen we expliciet: eigen doelgroep/taal/tool met onafhankelijke meerwaarde óf technisch consolidatieadvies via 301/canonical. De eigenaar wil ook aparte sites bouwen; er wordt nu geen domein omgeleid of veranderd. Een andere kleur of herschreven producttekst alleen creëert geen unieke site. Geen sitewide wederzijdse linkruil of doorway-netwerk. Link wel waar zinvol transparant naar HYXI-bronnen, Thuisbatterij Team en NIVO.

Bronbeleid: fabrikantdocumenten + datum + controle, geen gefingeerde reviews, prijzen of voorraad. Google Search Essentials en spamrichtlijnen zijn leidend: https://developers.google.com/search/docs/essentials/spam-policies

## 8. Meetkader
**Primaire KPI's (pas na datamodel, met eenduidige definities):**
- **Ontvangen aanvragen:** unieke geldige aanvragen die duurzaam zijn opgeslagen, uitgesplitst naar bron en dag.
- **Kwalificatiegraad:** gekwalificeerd / beoordeelde aanvragen; criteria vaststellen met sales.
- **Mediaan tijd eerste contact:** tijd tussen ontvangst en eerste vastgelegde menselijke contactactie.

**Drivers:** conversie formulier = ontvangen / gestart, en organische klikken uit Google Search Console. **Guardrails:** mislukt opslag-/mailpercentage en formulierfouten. Geen ongefundeerde KPI-doelwaarden zonder baseline. Minimaal meten en bij voorkeur geaggregeerd, zonder persoonsgegevens in marketinganalytics.

## 9. Definitie van klaar
Iedere release heeft broncode met tests, API/autorisatiecontrole, mobiele browserinspectie, prestatie- en SEO-regressiecheck, privacy/security-impactanalyse, veilige database-migratie waar nodig, Hostinger-deploy en rollbackprocedure, en één post-live acceptatiecheck. Main blijft productiegereed; geen echte persoonsgegevens of secrets in repository, logs, test-exports of issue-tekst.

## 10. Eigenaarshandelingen op het juiste moment
**Nu:** bevestig een echte testaanvraag in leads@thuisbatterijteam.nl en wie die mailbox monitort.  
**Voor DB-fase:** Hostinger MySQL aanmaken, DB-geheimen privé in omgevingsvariabelen plaatsen.  
**Voor beheer:** gewenste gebruikers/rollen bepalen, eigenaaradmin veilig activeren.  
**Voor prijzen:** goedgekeurde prijs- en garantiebronnen, BTW, montage en leverinformatie.  
**Voor SEO-meting:** Search Console verifiëren.  

Gebruik [de checklist](GO-LIVE-CHECKLIST-V2.md), [de technische architectuur](ARCHITECTURE-V2.md), [de bestaande SEO-strategie](SEO-STRATEGY.md) en [masterissue #10](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/10).
