# HYXI AURA — Google Ads en conversiemeting

**Status:** technische oplevering met commerciële NO-GO

**Datum:** 25 november 2026

**Website:** https://hyxi-aura.nl

**Target-account:** Google Ads-klant `727-613-6831` (alleen deze HYXI-scope)

**Productiecommit:** `main` @ `e7db9cc77774e780f03fe53c1a941c6debc1a918`

## Besluit in één oogopslag

De campagne is veilig gepauzeerd. De website implementeert nu een privacyvriendelijke, toestemming-afhankelijke conversiesignalering voor uitsluitend bevestigde advies- en offerteaanvragen. De lokale bouw-, unit-, statische-, browser- en toegankelijkheidscontroles zijn groen.

De commerciële campagne is nog **NO-GO**. De exacte GTM-container `GTM-KRT2VMF3` is publiek bereikbaar, maar niet zichtbaar in de ingelogde Tag Manager-werkruimte. De beschikbare werkruimte bevat alleen de bestaande TBT-container `GTM-KWTJK9SZ`; die is niet aangepast. Daardoor is nog geen gecontroleerde custom-eventtag, publicatieversie of Tag Assistant-bewijs voor de HYXI-conversie beschikbaar. Ook staat Final URL expansion in de PMax-campagne nog aan; dat moet vóór activering bewust worden uitgeschakeld of eigenaar-gecontroleerd.

Er is geen nieuwe campagne, geen tweede GTM-container en geen Odoo-koppeling gemaakt.

## 1. Google Ads-audit

### Account

De native Google Ads-accountcontrole bevestigde:

| Onderdeel | Gecontroleerde waarde |
|---|---|
| Accountstatus | Enabled |
| Valuta | EUR |
| Tijdzone | Europe/Amsterdam |
| Auto-tagging | Enabled |
| Saldo / kosten bij controle | €0,00 saldo; geen kosten vandaag zichtbaar |
| Betaling | Geen komende betaling zichtbaar; betaalmethode bleef ongemoeid |
| Promotie | Interface toonde €900 advertentietegoed na €1.400 campagne-uitgaven vóór 24 januari 2027; voorwaarden en daadwerkelijke kwalificatie zijn niet zelfstandig als gegarandeerd voordeel aangemerkt |

De bestaande TBT-accounts en campagnes zijn niet gebruikt of gewijzigd.

### Campagne

De eigenaar aangemaakte campagne `Campaign #1` (`24543992772`) is een **Performance Max**-campagne. De geverifieerde eindstatus is:

| Onderdeel | Waarde |
|---|---|
| Status | **PAUSED** |
| Campagnetype | Performance Max |
| Biedstrategie | Maximize conversions |
| Dagbudget | **€16,12** |
| Theoretisch plafond in een 31-daagse maand | €499,72 vóór Google Ads-dagvariatie |
| Geografie | Nederland |
| Locatieoptie | Presence or interest |
| Talen | Nederlands en Engels |
| Search themes | 33 bestaande thema’s gecontroleerd; niet uitgebreid |
| Audience signals | Geen ingesteld bij controle |
| Final URL expansion | **Aan bij controle — activatieblokker** |
| Text customisation / automatisch gegenereerde varianten | Aan bij controle; eerst eigenaarreview |
| Asset group | Eén groep; assets in beoordeling, ad strength `Poor` |

Het dagbudget is verlaagd van €19,91 naar €16,44 en daarna naar €16,12. Die laatste waarde houdt de expliciete maandgrens van €500 ook in een 31-daagse maand onder controle. Google Ads kan de feitelijke daguitgave laten variëren; de campagne blijft daarom gepauzeerd totdat budget- en campagnedoelen commercieel zijn vrijgegeven.

### PMax-beoordeling

PMax is behouden omdat de onboarding dit campagnetype al heeft aangemaakt en de opdracht geen stilzwijgende tweede campagne toestaat. Met €500 per maand, nul historische conversies en een assetgroep met `Poor` ad strength is PMax nog niet aantoonbaar efficiënt. Een Search-alternatief voor hoge-intentievragen kan later als afzonderlijk eigenaarbesluit worden uitgewerkt, maar is niet aangemaakt of geactiveerd.

Vóór een vrijgave moeten minstens Final URL expansion, automatische tekstvarianten, landingspagina-keuze, advertentieclaims, geografisch installatiegebied en assetkwaliteit opnieuw worden beoordeeld. Zolang dat niet is gebeurd, kan Google zelfstandig pagina’s of varianten kiezen die niet bij de commerciële scope passen.

## 2. Conversieactie

De bestaande websiteconversie is in het target-account aangepast en via de Ads API nagelezen:

| Instelling | Eindwaarde |
|---|---|
| Naam | **HYXI AURA — Bevestigde aanvraag** |
| Bron / type | Website / Webpage |
| Categorie | Submit lead form |
| Optimalisatie | Primary |
| Tellen | One per click |
| Waarde | Geen waarde gebruiken; standaardwaarde 0 |
| Opnemen in conversions | Ja |
| Click-through window | 30 dagen |
| Conversion ID | `18595797698` |
| Conversion label | `3LhMCJC0tr8dEMK1laNF` |
| Ads conversion action ID | `7917640208` |

De Google-hosted actie `Lead form - Submit` (`7917709129`) is **Secondary** gemaakt en telt niet meer mee in de accountconversies. Daarmee blijft de websiteactie de enige primaire leadactie; formulieren, CTA-klikken, telefoonnummers en paginaweergaven zijn geen primaire conversies.

De campaign gebruikt het accountdoel `Submit lead forms`. Omdat de Google-hosted actie secondary is en de websiteactie de enige primary/included actie is, is de primaire accountdoelset nu beperkt tot bevestigde websiteaanvragen. Een afzonderlijk campaign-specifiek doel is niet aangemaakt om geen extra doelduplicatie te introduceren.

## 3. Websiteconversie en privacy

De bestaande serverbevestiging blijft het enige moment waarop een conversiesignaal kan ontstaan:

1. De advies- of offerteaanvraag wordt naar de bestaande API gestuurd.
2. Alleen een geaccepteerde response (`201` nieuw of `200` idempotent opnieuw bevestigd) geeft een intern `hyxi:lead-accepted`-event.
3. Het event bevat alleen `advice` of `quote` en een willekeurige, opaque `hxa_...`-referentie.
4. Bij geldige advertentiemetingstoestemming wordt één `hyxi_lead_success`-object naar de GTM `dataLayer` gepusht.
5. Een `sessionStorage`-sleutel voorkomt dubbele meting van dezelfde referentie door dubbelklikken, verloren response en retry binnen dezelfde sessie.

De website verstuurt nooit naam, e-mailadres, telefoonnummer, postcode, vrije tekst, interne aanvraag-ID, Odoo-gegevens of CRM-data naar Google. Er is geen Enhanced Conversions, geen remarketing en geen GA4-primary-conversie ingericht.

### Consent Mode v2 — Basic Mode

Bij eerste bezoek worden lokaal alleen deze defaults in de `dataLayer` gezet:

```text
ad_storage: denied
ad_user_data: denied
ad_personalization: denied
analytics_storage: denied
```

Zonder keuze wordt geen Google Tag Manager-script geladen en worden geen externe Google-trackingrequests verstuurd. Na expliciet accepteren worden alleen `ad_storage` en `ad_user_data` granted; `ad_personalization` en `analytics_storage` blijven denied. Weigeren of intrekken blokkeert verdere lead-events. De aanvraag zelf blijft werken zonder advertentietoestemming.

De melding is compact, toetsenbordbedienbaar en mobiel responsive. “Accepteren” en “Weigeren” zijn gelijkwaardig beschikbaar. Via “Cookievoorkeuren” kan de bezoeker de keuze later wijzigen. De bestaande aanvraagtoestemming is niet hergebruikt als advertentietoestemming.

De privacytekst op `/privacy/` beschrijft deze werking. Er is geen tracking in `/beheer` en geen wijziging aan MariaDB, SMTP, outbox of de bestaande `leads@` → Odoo-mailimport.

## 4. GTM-status

De opgegeven container `GTM-KRT2VMF3` gaf publiek HTTP 200 terug. De gepubliceerde JavaScript-respons bevat de Ads-destination `AW-18595797698`, maar dat is geen bewijs dat de custom trigger, conversion tag en consentinstellingen correct zijn gepubliceerd.

In de ingelogde Tag Manager-omgeving was `GTM-KRT2VMF3` niet beschikbaar. Alleen de bestaande TBT-container `GTM-KWTJK9SZ` was zichtbaar. Die container is bewust niet geopend, aangepast of gepubliceerd.

Nog te doen door een eigenaar met toegang tot de juiste container:

- controleer de juiste workspace en versie;
- voeg, indien nog niet aanwezig, één Google Tag/Conversion Linker en één Google Ads-conversietag toe;
- trigger uitsluitend op `hyxi_lead_success`;
- map `hyxi_lead_intent` en de niet-persoonlijke referentie alleen waar nodig voor deduplicatie;
- controleer de Consent Mode v2-instellingen en tag consent checks;
- publiceer pas na Tag Assistant-validatie op advies en offerte;
- noteer het GTM-versienummer in dit document.

Er is op 25 november geen GTM-versie gepubliceerd en geen Tag Assistant-sessie als productie-bewijs geclaimd.

## 5. Campagneherkomst

`src/campaign-attribution.mjs` behoudt alleen:

- `utm_source`
- `utm_medium`
- `utm_campaign`

De waarden worden begrensd, gevalideerd en tijdelijk in `sessionStorage` opgeslagen. Alleen interne links krijgen ontbrekende toegestane waarden mee; externe links, `/api/` en `/beheer` worden niet aangepast. Google-click-ID’s, willekeurige queryparameters en persoonsgegevens worden niet opgeslagen. De leadformulieren lezen dezelfde allowlist uit, zodat bijvoorbeeld advertentie → homepage → modellen → offerte de herkomst kan behouden.

De bestaande interne leadmail en de database/Odoo-keten zijn niet herbouwd. Productietests met echte aanvragen zijn niet uitgevoerd.

## 6. QA-bewijs

Uitgevoerd met Node 24.18.0 en de committed lockfile:

| Controle | Resultaat |
|---|---|
| `npm ci` | PASS; 0 kwetsbaarheden gemeld door npm |
| `npm run build` | PASS |
| `npm test` | **127/127 PASS** |
| `npm run check` | **4.549 statische checks PASS op 30 pagina’s** |
| `npm run test:browser` | PASS: 22 browserchecks, 13 accessibilitychecks, 3 scene-evidencechecks, 0 browser errors |
| Consent browsermatrix | PASS: geen GTM vóór keuze of na weigeren; één GTM-load na accepteren; intrekken zet denied terug |
| Leadbrowserflows | PASS: advies, offerte, retries, disabled-mailfallback, vijf BAT-Q9-pakketten en bestaande mobiele/nauwe layouts |
| `git diff --check` | PASS |

De browsercontrole gebruikte een lokale Chrome-binary omdat de projectomgeving geen Playwright-browserdownload bevatte. Er zijn geen echte leads, advertentieconversies of mailbox-/Odoo-tests gegenereerd.

Niet door deze oplevering bewezen:

- Tag Assistant op de exacte GTM-workspace;
- ontvangst van een echte Google Ads-conversie;
- mobiele Safari-review door de eigenaar;
- commerciële eigenaarsscore ≥9/10;
- rendabele PMax-leadstroom of gekwalificeerde Odoo-opvolging.

## 7. Definitief productiereleasebewijs

De gecontroleerde wijzigingen zijn via PR #64 (website-meetarchitectuur), PR #65 (consentinitialisatie en hero-QA) en PR #66 (actuele BAT-Q9-productieprobe) naar `main` gemerged. De formele checks op de eindcommit zijn groen:

- Hoofd-CI: [run 45677650684](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/45677650684) — build, 127 tests, MySQL-integratie, browserjourney, Lighthouse en production-only install/build.
- Publieke productieprobe: [run 45677650702](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/45677650702) — alle 40 read-only publieke gates PASS.
- Onafhankelijke eindprobe na deployment: alle 40 gates PASS, inclusief `capacitySizingGuideDeployed` voor de actuele BAT-Q9-waarde `8,6 kWh` bruikbaar per module.
- Live controle: `/kennis/hoeveel-kwh-nodig/` gaf HTTP 200 met de juiste title en canonical; er zijn geen leads of advertentieconversies verstuurd.

De eerdere productieprobe-fout op de capaciteitspagina was een verouderde monitorassertie voor `6,7 kWh` (BAT-Q7), niet een fout in de live pagina. PR #66 corrigeerde uitsluitend die read-only gate naar `8,6 kWh` (BAT-Q9).

## 8. Productie- en beheerprocedure

### Voor activering

1. Geef de uitvoerder toegang tot `GTM-KRT2VMF3` of laat de eigenaar de bovenstaande GTM-configuratie zelf controleren.
2. Valideer de container in GTM Preview/Tag Assistant met expliciete toestemming en zonder toestemming.
3. Controleer dat alleen `hyxi_lead_success` de Ads-conversietag activeert, voor zowel `advice` als `quote`.
4. Zet Final URL expansion en ongewenste automatische varianten uit of keur de gekozen landingspagina’s expliciet goed.
5. Controleer assetbeleid, installatiegebied, taal en claims.
6. Laat de eigenaar de commerciële 9/10-review en echte mobiele Safari-review afronden.
7. Publiceer de GTM-versie en leg het versienummer vast.
8. Geef daarna pas expliciete vrijgave om de campagne te hervatten.

### Monitoring na vrijgave

Controleer wekelijks:

- Ads-kosten tegen €500 per maand;
- primaire bevestigde aanvragen, niet clicks of formulierstarts;
- deduplicatie en verschil tussen Ads-conversies en database/Odoo-leads;
- afkeuringen, asset strength en zoek-/landingspagina-relevantie;
- kwaliteit en opvolgsnelheid van leads in de bestaande Beheer/Odoo-route.

### Rollback

- Pauzeer `Campaign #1` in Google Ads.
- Zet de laatste bekende correcte GTM-versie terug via GTM versiebeheer.
- Laat websiteconsent en leadverwerking ongemoeid als alleen advertentiemeting teruggedraaid wordt.
- Verwijder geen leads en verander geen SMTP/Odoo-instellingen.
- Controleer daarna publiek dat de website en aanvraagformulieren nog functioneren.

## 9. Definitief advies

**Technische websitebasis: GO voor review.** De code is privacybewust, getest en houdt de bestaande lead- en Odoo-keten intact.

**Google Ads commerciële launch: NO-GO.** De campagne blijft gepauzeerd totdat de exacte GTM-werkruimte aantoonbaar is ingericht en gepubliceerd, Final URL expansion/automatische varianten zijn beoordeeld, Tag Assistant beide aanvraagtypen bevestigt en de eigenaar de commerciële release geeft.

Na die vrijgave verdient een kleine, gecontroleerde pilot prioriteit boven opschalen. Echte ontvangen aanvragen en Odoo-opvolging bepalen daarna of PMax behouden blijft of dat de eigenaar een afzonderlijke Search-test wil laten uitwerken. Er worden nu geen extra campagnes of advertentieconversies aangemaakt.

### Officiële referenties

- [Google Ads conversion counting](https://support.google.com/google-ads/answer/3438531?hl=en)
- [Google Tag Manager consent settings](https://support.google.com/tagmanager/answer/12131703?hl=en-GB)
- [Consent Mode controleren met Tag Assistant](https://support.google.com/tagmanager/answer/14218557?hl=en)
- [Google Ads tracking data en conversietellingen](https://support.google.com/google-ads/answer/6270625)
- [Performance Max budgetgedrag](https://support.google.com/google-ads/answer/15865234?hl=en)
