# HYXI AURA — launch-readiness checklist: van werkende basis naar automatische leadmachine
**Versie:** 16 november 2026 · **Prioriteit:** eigenaarsoordeel actuele visuele baseline **circa 7/10** (eerder 6/10), commerciële lanceergrens **minimaal 9/10**  
**Project:** https://hyxi-aura.nl · **Master:** https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/10 · **Design:** https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/6  
**Oorspronkelijke auditlezing:** main `69eb8efe4b7a0afa16aa1d6b0d5f9146fcc99d94`; latere designreleases zijn afzonderlijk vastgelegd. **Huidige Hero V4:** main `031b557f216867e32332d2950018c3f136a0b2a8`, 3/3 post-merge CI, **11/11 read-only productiechecks**.  
**Belangrijk:** de website is technisch LIVE, maar heeft op eigenaarsoordeel **NO-GO voor actieve commerciële lancering/advertentieverkeer**. Na een tussentijdse beoordeling van 6/10 heeft de eigenaar de bestaande hero herwaardeerd naar ongeveer **7/10**; dat is nog geen 9/10-lanceergoedkeuring. De 9/10-acceptatie is een **menselijke designreview**, geen Lighthouse-score.

## 1. Wat ‘automatisch leadgeneratieplatform’ betekent

Bezoeker komt binnen via Google of een toegestane campagne → krijgt een onderscheidende premium HYXI-productervaring → begrijpt opties en beperkingen → vraagt advies of offerte aan → aanvraag wordt veilig na databasecommit opgeslagen → interne mail en bestaande Odoo-e-mailimport zorgen voor CRM-kans en eigenaar → sales reageert op afgesproken tijd → kwaliteit en vervolg worden geregistreerd → uitval wordt opgemerkt → echte resultaten sturen SEO/UX/marketing. **Automatische leadontvangst is al bewezen; structurele instroom, opvolgsnelheid en economische resultaten zijn nog niet bewezen.**

### Technisch al gereed; niet opnieuw bouwen
- [x] Node 24/Vite op Hostinger, `main` auto-deploy, MariaDB 11.8.9, migraties 001–004, beveiligd password-only Beheer met bestaande eigenaarlogin.
- [x] Drie-staps adviesaanvraag, aparte offerteaanvraag en Q7/Q9-configurator met selecties, intakevalidatie, toestemming, server-CSRF/rate limit/honeypot.
- [x] Transactionele versleutelde opslag, idempotentie, SMTP-outbox en mailcontrole; éénmalige productieadvies-API→mail→Odoo door eigenaar bevestigd; een offerte-API→mail afzonderlijk bevestigd.
- [x] Beheer: rollen, status, zoekfunctie, toewijzing, versleutelde notities, vervolgdatum, vandaag/verlopen, geauditeerde handmatige export/verwijdering en 14-daagse **opgeslagen lead**-KPI's.
- [x] Drie originele HYXI-kennisroutes (Q7/Q9, noodstroom, installatiecheck), 7 sitemap-URL's, canonicals, interne links en fabrikantbronbeleid; 10/10 live read-only checks.
- [x] Hostinger dagelijkse automatische backups als eigenaar-geaccepteerde voorziening. **Geen onafhankelijk restorebewijs; geen eigen backupsysteem bouwen.**
- [x] Bestaande Odoo-routing is via **mailimport**, geen HYXI→Odoo API. Behoud de werkende keten.

## 2. P0 — DESIGN circa 7/10 → minimaal 9/10 [HARD COMMERCIAL LAUNCH GATE]

**Visuele V6-polish technisch afgerond en live:** [feature PR #41](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/41) verwijdert AI-achtige micro-labels/bolletjes en nummerstempels, maakt het footerwoordmerk TBT-first zoals de header en benadrukt de fabrikantbevestigde ingebouwde ATS-back-up, zonder overclaim. [V6-releasebewijs](PHASE5-EDITORIAL-POLISH-2026-11-16.md), [PR-head CI 3/3](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43938494028), [Hostinger **12/12** GET-check](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43939496350). **Nog open:** de subjectieve eigenaarsscore van V6, echte Safari-review en commerciële sales/SEO/privacy GO/NO-GO. Geen 9/10 of conversie-uplift zonder bewijs.

**Hero V5 is technisch gereed en live:** [PR #39](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/39) verwijdert het linker instructieblok volledig. De foto wisselt direct op linker-, middelste (32%) en rechterdeel van de **zichtbare batterijbreedte**, met GSAP-microbeweging; mobiele swipe/tap en toetsenbord zijn behouden. [Releasebewijs en technische regels](PHASE5-HERO-V5-ZONES-2026-11-16.md), [3/3 CI](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43929956182) en [11/11 productiereadiness](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43929956171). **Nog open:** eigenaarreview van V5 op desktop en echte mobiele Safari, volledige 9/10-lanceereis en overige sales/SEO/privacy-gates.


**Hero V4 is technisch gereed en live:** [PR #37](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/37), merklockup op twee regels, GSAP-gebaseerde vloeiende microbeweging, drie nauwkeurig gekalibreerde officiële productfoto's, mobile swipe, toegankelijkheidsfallback; [releasebewijs](PHASE5-HERO-V4-GSAP-2026-11-16.md). **Nog open:** eigenaarsscore van de nieuwe V4 en echte Safari-review; geen automatische commerciële GO.
**Eigenaar beslist pas GO na review van echte voor-/na-views**, desktop en mobiel. Niet volstaan met een technisch groene CI.

- [ ] **V0 visuele audit:** bewaar 1440/1280/768/390/320-screenshots van de complete pagina, de offerte, configurator en kennischeck. Beoordeel hiërarchie, scrolldiepte, tekstgrootte, witruimte, contrast, overliggende UI en productbeeld. Controleer Safari op een echte iPhone.
- [ ] **Drie serieuze creatieve richtingen** voor de hero, productfocus en geloofwaardige installateuridentiteit, met visuele previews; eigenaar kiest er één. Direct daarna in de bestaande site bouwen, niet blijven brainstormen.
- [ ] **Nieuw premium designsysteem:** consistente typografie, stevige kop-/bodyverhouding, voldoende contrast, redactionele compositie, meer eigen visuele identiteit, subtiele materiaal-/achtergrondkeuzes en consistente componenten. Vermijd generieke AI-landingspagina-cards, overladen badges en decoratie zonder functie.
- [ ] **Hero vanaf eerste scherm vernieuwen:** duidelijk geïntegreerd HYXI AURA-product, voor wie, waarom dit systeem interessant is, wie het verkoopt/installeert en één dominante volgende stap; officiële fabrikantproductbeelden nauwkeurig en geloofwaardig weergeven.
- [ ] **Productpresentatie naar high-ticket niveau:** kwaliteitsrender/productfotografie uit gecontroleerde HYXI-bronnen, echt passende context (bij voorkeur klant-/installatiefoto's met toestemming), aantrekkelijke animaties met informatie-inhoud; schematische energiewoning helder als illustratie markeren, niet als klantrealisatie of exacte simulatie.
- [ ] **Mobiele hiërarchie repareren:** CTA en vaste balk mogen product/tekst niet hinderlijk overlappen; galerij, configurator en formulieren met goed tappable controls en niet onnodig lange blokken; passende ruimte voor leesbare tekst op 390/320px.
- [ ] **Motion met mate:** Three.js uitsluitend waar techniek begrijpelijker wordt, soepele productview/energyflow, met correcte no-WebGL/SVG-, no-JS- en reduced-motion-uitvoering. Geen onnodige downloads of animatieblokkades.
- [ ] **Productidentiteit en menselijk vertrouwen:** heldere relatie HYXI (fabrikant), NIVO Groep Holland B.V. (initiatief) en Thuisbatterij Team (advies/aanvragen); echte team-/installatiebewijzen alleen met rechten/toestemming. Geen fictieve reviews, certificaten, garanties of 'vanaf'-prijzen.
- [ ] **Eigenaarreview ≥9/10:** screens en echte URL voor hero, mobiel, productsecties, CTA en offerte. Bij score 8/10 of lager opnieuw itereren. Geen commerciële GO onder de afgesproken 9/10-grens.
- [ ] **Objectieve guardrails:** bestaande API/leadflow en mobiel toegankelijk houden; toetsenbord, axe WCAG A/AA, contrast, echte Safari, WebGL-fallback, CLS/LCP en Lighthouse als richtwaarden. 3/3 CI groen + onafhankelijke live GET-readiness.

**Zichtbare aandachtspunten uit huidige CI-screenshots:** de lichtgrijze typografie en veel witruimte geven een afstandelijke indruk; er zijn meerdere overliggende hero-cards en een vaste mobiele CTA; de gestileerde/illustratieve energiewoning heeft een andere beeldtaal dan echte premium-productbeelden; mobiel is de journey lang. Dit zijn concrete ontwerpkandidaten ter verificatie, **geen bewezen effect op conversie**.

## 3. P0 — CONVERSIE EN MERKVERTROUWEN [BEFORE COMMERCIAL LAUNCH]
- [ ] Formuleer de hoofdbelofte in één zin: **wat kan HYXI AURA voor dit huishouden betekenen**, zonder ongetoetst ROI-, noodstroom- of installatiebelofte.
- [ ] Harmoniseer de twee conversieroutes: **‘advies aanvragen’** voor oriënterende bezoekers, **‘offerte aanvragen’** voor beslissers. Hero, configurator, installatiecheck en kennisartikelen moeten passende CTA's hebben zonder keuzeverwarring.
- [ ] Review de adviesdialoog en zelfstandige offerteformulieren op mobiele frictie, optionele invoer, foutmeldingen, sessieverval, toegankelijkheid en contactfallback. **De bestaande twee serverintents en toestemming behouden.**
- [ ] Toon een begrijpelijk overzicht van gekozen Q7/Q9-capaciteit en installatievragen. Onderscheid nominale versus bruikbare kWh; geen automatische geschiktheid/prijs suggereren.
- [ ] Controleer professionele contactpunten, privacytekst, bedrijfsidentiteit, bron- en garantievoorwaarden en een realistische verwachting over wanneer **Thuisbatterij Team** reageert (pas beloven na salesafspraak).
- [ ] Verzamel echte product-/installatievoorbeelden en beeldrechten; prioriteer authenticiteit boven fictieve testimonials of AI-gezichten.
- [ ] Valideer complete desktop/mobiele route tot **API-stub** in CI en de publiek leesbare productieschermen; maak niet zomaar extra productietestleads.

## 4. P0 — SALES & OPERATIONS [NO LEAD LEFT BEHIND]
- [ ] Wijs binnen NIVO/Thuisbatterij Team een **eigenaar + vervanger** voor de leadinbox en Odoo-invoer aan; definieer een werkbaar eerste-contact-SLA tijdens kantooruren en bij afwezigheid.
- [ ] Leg per aanvraagtype vast hoe in Odoo wordt toegewezen, gekwalificeerd, opgevolgd, geoffreerd en afgesloten. **Odoo is de commerciële opvolgbron; HYXI Beheer blijft intake-/incidentbron** tenzij expliciet anders besloten. Geen dubbel CRM-werk.
- [ ] Controleer in bestaande Odoo-mailimport of **quote** evenals **advice** correct als verkoopkans met uniek AURA-ID belandt. De adviesroute is eerder bewezen; voor quote is alleen DB→mail apart bewezen. Eerst bestaande of normale nieuwe dossiers bekijken; geen onnodige synthetische leads.
- [x] **Admin-only Beheer-incidentmelding en triageroute** voor SMTP-outbox `failed` / `uncertain` in [PR #43](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/43): aantallen direct na login en refresh, geen incident = geen paneel, overzichtsfout verbergt summary niet. Menselijke mailboxcheck en niet-blind-heraanbieden worden uitgelegd. Dit is géén proactieve externe notificatie.
- [ ] **Proactieve veilige escalatie** buiten het ingelogde dashboard: pas ontwerpen als verantwoordelijke, vervanger, contactmoment/SLA en alarmkanaal zijn vastgelegd. Een SMTP-acceptatie is **geen** bewezen inboxdelivery.
- [ ] SPF, DKIM, DMARC, Reply-To, spam-/bouncebeleid en afzenders/ontvangers van echte productie-e-mail controleren, zonder huidige werkende mailroute te pauzeren.
- [ ] Reconciliatie afspreken: ontvangen HYXI-aanvragen (bron), werkelijk mailstatus en Odoo-kansen; detecteer ontbrekende of dubbele overname via correlatie-ID zonder persoonlijke data in monitoringlogs.
- [ ] Beheer-vandaag/verlopen taken testen in echte dagelijkse routine. De huidige 2.500-scancap/100 getoonde resultaten is bekend; pas indexeren wanneer volumes dit vereisen. Automatische herinnering alleen als Odoo die niet al heeft.
- [ ] Go-live runbook: uitval mail, Odoo-import, Hostinger/deploy, geen bevestiging bij DB-fout, verantwoordelijke en veilige rollback. Dagelijkse publieke 10/10-monitor is reeds gebouwd; dit is **geen** E2E-mailmonitor.
- [ ] Beoordeel het deploy-race-scenario: nieuwe route was direct na merge eerst niet live (8/10), pas na Hostinger-uitrol 10/10. Verfijn read-only probe-/alerttiming zonder fouten te verbergen.

## 5. P0/P1 — PRIVACY & JUISTE PRODUCTCLAIMS
- [ ] Wijs gegevensverantwoordelijke en mailbox-/Odoo-beheerders aan voor inzage, klachten en verwijderverzoeken; vast proces voor alle kopieën. Handmatige HYXI-export/verwijdering **bestaat**, maar wist niet in Odoo of e-mail.
- [ ] Ontwerp een **betrouwbaar laatste-contactmoment** uit de echte commerciële opvolging voor het bestaande zesmaandenbeleid op afgesloten niet-klantleads. Pas na juridische/operationele bevestiging eventueel retentie automatiseren; niet blind vanaf eerste aanvraagdatum wissen.
- [ ] Beslis de juridische grondslag/consentvereisten vóór nieuwe website-events, pixels of retargeting. Persoonsgegevens niet in URL/Analytics/issue/screenshot zetten.
- [ ] Controleer of fabrikantdatasheets inmiddels definitief zijn; huidige lokaal geborgde documenten V2.1 van 26 oktober 2026 zijn **Preliminary**. Geen prijs, besparing, voorraad, installatieduur of garantie publiceren zonder bewijs.
- [x] De bestaande back-upvoorziening van Hostinger is door de eigenaar afgevinkt; geen eigen back-uptraject als nieuwe launch-blokkade.

## 6. P1 — VIND­BAARHEID EN AUTOMATISCHE BEZOEKERSINSTROOM
- [x] Technisch indexeerbaar: 7 publieke URLs met sitemap, robots, canonicals en intern gelinkte inhoud; twee originele kennisgidsen + installatiecheck.
- [ ] **Search Console-eigendom verifiëren** via geautoriseerd Google-account, sitemap indienen/controleren, URL Inspectie voor zeven pagina's en daadwerkelijke indexdekking vaststellen. De GSC Wizard-connector geeft `payment_required`; **indexatie is niet bewezen**.
- [ ] Zoekintentie-/concurrentieanalyse op *HYXI AURA*, *HYXI thuisbatterij*, modulecapaciteiten, *HYXI AURA kosten*, compatibiliteit bestaande zonnepanelen, 1 vs 3 fase, installatie en back-up. Brongetrouwe, originele pagina's; voorkom overlap met huidige check en Q7/Q9/noodstroompagina's.
- [ ] Eigen cases, beelden en vragen vanuit echte salesgesprekken als nuttige SEO-inhoud, inclusief interne links naar de meest passende aanvraagroute. Geen gekopieerde fabrikanttekst of gefingeerde ervaringen.
- [ ] Core Web Vitals en technische indexeerbaarheid op **daadwerkelijke productie** periodiek beoordelen, niet alleen CI-Lighthouse.
- [ ] Domeinaliasen (zoals hyxi-aura.com en hyxiaura.nl/.com) expliciet besluiten: permanente redirect naar de hoofdsite bij dezelfde doelgroep en inhoud, of uitsluitend echte eigen gebruikersfunctie. Geen doorway-websites of kunstmatige linkruil.
- [ ] Na 9/10-acceptatie **een beperkte campagnepilot** voorbereiden (bijv. Google Search voor hoogintente termen) met eigenaarsbudget, advertentieclaimscheck, relevante landingspagina's en negatieve zoektermen. Ads niet verplicht; pas opschalen op echte gekwalificeerde leads, niet klikken.
- [ ] Structurele content-/SEO-onderhoudsroutine vastleggen: eigenaar, broncontroledatum, test, publicatieritme en maandelijkse beoordeling van zoekvragen.

## 7. P1 — METEN, BIJSTUREN EN LEADKWALITEIT
- [x] Beheer heeft 14-daagse echte aantallen opgeslagen, **nog aanwezige** advies- en offerteaanvragen; geen bezoekerstracking of omzetclaim.
- [ ] Rechtmatig, privacyvriendelijk meetplan en bronimplementatie voor **bezoeken → configurator/check-start → formulierstart → bevestigde lead**, gededupliceerd en zonder PII in events. Geen conversiepercentages zolang noemer ontbreekt.
- [ ] UTM-bronbetrouwbaarheid testen voor beide aanvraagtypen; noteer organisch/betaald/direct uitsluitend als werkelijk vastgelegd. Geen 'AI-attributie' zonder data.
- [ ] Saleskwalificatiecriteria en eerste echte menselijke contactdatum met Odoo-ondersteuning definiëren: *new*, *qualified*, *contacted*, *offered*, *won/lost*, zonder HYXI-status alsof die automatisch gelijkloopt.
- [ ] Echte KPI's: unieke geldige leads, gekwalificeerde leads per bron, percentage kwalificatie, tijd tot eerste reactie, onbereikte leads, offertepercentage, verkoop, CPL (als er advertentiekosten zijn). Definities en bronbeperkingen publiceren.
- [ ] Eenvoudige wekelijkse review met verantwoordelijke: 7/14/30-dagentraject, zoekverkeer, leads, saleskwaliteit, fouten, volgend experiment. A/B-tests pas bij voldoende aantallen.
- [ ] Alerts voor uitzonderingen: intake disabled, mailstatus `failed/uncertain`, uitblijvende Odoo-toewijzing en uitzonderlijk lange openstaande opvolging, met privacyveilige output.

## 8. P2 — PAS NA EERSTE BEWEZEN COMMERCIËLE LEADS
- [ ] Itereren op basis van echte bezoekers-/salesgegevens en geverifieerde klantvragen; kleine gerichte UX-tests in plaats van willekeurig redesign.
- [ ] Eventueel automatische klantontvangstmail **zonder marketing** en één gededupliceerde follow-up volgens geaccordeerd proces; vermijd dubbele Odoo-reminders.
- [ ] Alleen met goedgekeurde prijzen, BTW, montage- en garantiecondities eventueel prijsindicatie/offertecalculator; definitieve offerte blijft gecontroleerd door mens.
- [ ] Herbruikbare starter voor **andere domeinen** pas na acceptatie van deze site en met aantoonbaar unieke doelgroepen; geen tientallen duplicaatlandingspagina's.
- [ ] Directe Odoo-/NIVO Portal-API alleen wanneer operationeel aantoonbaar beter dan de al werkende e-mailimport. **Geen afhankelijkheid van Mac, OpenClaw of een externe agent.**

## 9. Verplichte GO / NO-GO — commerciële lancering

**NO-GO zolang één harde voorwaarde ontbreekt:**
1. [ ] Eigenaar geeft het **gebouwde visuele ontwerp minstens 9/10** op desktop en echte mobiele Safari na review; geen nog onvoldoende beoordeelde V3 als definitieve commerciële GO aanmerken.
2. [ ] Boven-de-vouw propositie, echte product- en bedrijfsidentiteit, duidelijke CTA, telefoon/fallback en correcte productclaims zijn akkoord.
3. [ ] Complete advies-/offertejourneys, 320/390/768/1440, keyboard, reduced-motion, WebGL-fallback, echte Safari en CI zijn zonder kritieke regressies; live read-only readiness groen.
4. [ ] Sales eigenaar/vervanger, eerste-contactafspraak, mailincidentroute en werkende Odoo-kansen per intakevariant zijn operationeel gecontroleerd.
5. [ ] Actuele privacy-/contacttoestemming en veilige procedure voor HYXI + Odoo + mail zijn vastgesteld; nieuwe meting alleen na privacybesluit.
6. [ ] Basismeetplan en minimaal één **gekozen instroomkanaal** (GSC/organisch of gecontroleerde betaalde pilot) zijn klaar. Uitgaven pas na GO.

**Na launch / opschalen vereist daarnaast:** echte kwalitatieve instroom, contactmomenten, salesresultaten en wekelijkse terugkoppeling. **Technisch online ≠ 9/10-design ≠ aantoonbare autonome winstgevende leadmachine.**

## 10. Aanbevolen bouwvolgorde

1. **Sprint Design 9/10:** harde creatieve upgrade op bestaande basis, eerste uitgebreide desktop/mobile Safari review, opnieuw itereren tot owner ≥9/10. #6.
2. **Sprint Conversion:** hero/CTA, configurator → advies/offerte, formulierfouten, bedrijfstrust en echte praktijkbewijzen. #5/#6.
3. **Sprint Operations:** eigenaar/vervanger, e-mail/Odoo-reconciliatie en incident/escalatie, privacybeheer/laatste-contactafspraak. #2/#4/#9.
4. **Sprint Growth & measurement:** GSC, zoekintenties, privacyvriendelijke echte conversie-/sales-KPI's en beperkte instroompilot. #7/#8.
5. **Releasebesluit:** bovenstaande GO/NO-GO met screenshots, tests, bronverantwoording en operationele eigenaar; daarna eerste echte commerciële resultaten observeren.

## 11. Verificatiebronnen (geen aannames)

- [Masterissue #10](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/10), actuele [fast-lane-roadmap](ROADMAP-FASTLANE-2026-11-16.md), [Phase 3-releasebewijs](PHASE3-VERIFIED-2026-11-16.md) en [Phase 4-installatiecheck](PHASE4-INSTALLATIECHECK-2026-11-16.md).
- [PR #30](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/30), [PR #31](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/31), [PR #32](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/32), [PR #33](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/33); [laatste main CI](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43872785508), [10/10 publieke readiness](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43872785178).
- [Quote-productieacceptatie](PHASE3-VERIFIED-2026-11-16.md), [Odoo e-mailimportbewijs](STATUS-P0-P1-2026-11-16.md), [privacyrunbook](PRIVACY-P1-MANUAL-OPS-2026-11-16.md), [lead-KPI-definities](P2-LEAD-KPIS-2026-11-16.md) en [bronnen/beeldrechten](ASSETS.md).
- Visuele audit: Chromium CI-browserartifact `browser-verification-43872479169-1` (desktop/mobile page, experience, configurator, quote, knowledge & check screenshots), **niet** onafhankelijk echte Safari.
