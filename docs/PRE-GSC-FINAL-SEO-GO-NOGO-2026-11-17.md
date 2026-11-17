# HYXI AURA — definitieve pre-Search Console SEO-review

**Datum:** 17 november 2026 · **Website:** https://hyxi-aura.nl/ · **Repository:** `Michaelwmdegroot/hyxi-aura-nl`

## Besluit

**Technische en inhoudelijke SEO: voorlopig GO, onder voorbehoud van de laatste PR- en productiechecks hieronder.** De 13 unieke publieke HTML-landingspagina's zijn voorzien van inhoud, semantische H1/titels, beschrijvingen, canonicals, Open Graph en grotendeels passende structured data. De centrale productpagina linkt rechtstreeks naar alle relevante diensten, verdiepingen en de vrijblijvende offerte; er zijn geen inhoudelijk lege SKU-doorways. Datasheet-PDF's zijn rechtstreeks vindbaar en bronbeperkingen worden expliciet vermeld.

**Google Search Console en commerciële volledige launch: nog GEEN definitieve GO.** De daadwerkelijke Google-indexatiestatus/gekozen canonical en zoekklikken zijn nog niet bekend. De gebruiker moet een geverifieerde domeinproperty instellen; een Google Search Console-property is gratis. De bestaande externe GSC Wizard heeft eerder `payment_required` teruggegeven, wat geen reden is om een betaald abonnement te nemen. Een site kan al ontdekt/geïndexeerd zijn zonder handmatig indienen van een sitemap, omdat hij publiek crawlbaar is.

## 1. In de code onafhankelijk gecontroleerd (main op 17-11-2026, voorafgaand aan deze PR)

| Controle | Waarneming | Status |
| --- | --- | --- |
| Bestemmingen in `vite.config.mjs` en `public/sitemap.xml` | 13 echte aparte publieke routes, waaronder de homepage, modellen, datasheets, prijs/installatie, bestaande zonnepanelen, garantie, 4 technische/keuzegidsen, offerte, bronnen en privacy | PASS |
| Titles / meta descriptions | **13 unieke titles**, alle 15–75 tekens; **13 unieke meta descriptions**, alle 80–200 tekens | PASS |
| H1 / canonicals | Iedere URL heeft één H1 en een self-referential canonical in het statische HTML | PASS |
| Linkgrafiek | **Alle 13 pagina's zijn vanaf de homepage in één interne klik bereikbaar**; de datasheetpagina kreeg 11 unieke interne inkomende pagina's; geen geïsoleerde kennispagina | PASS |
| Productiedocumenten | Beide Preliminary V2.1-datasheets en EU-garantie op `/downloads/`. Broncode waarschuwt voor HTA2/HSA2-modelkoppen en `160000 W`, en verzint geen gecorrigeerd getal | PASS volgens eerdere fabrikant-audit; geen onafhankelijke nieuwe fabrikantpublicatie geclaimd |
| Commerciële bron | NIVO Groep Holland B.V. als exploitant, Thuisbatterij Team als adviseur; beperkte echte links naar beide organisaties; Odoo-verwerking zichtbaar in privacytekst | PASS |
| Beveiligde intake | Beheer krijgt geen publieke toegang; `/api/` staat uitgesloten in robots; een private lead GET zonder login geeft 401 | PASS volgens publieke read-only probe |
| Structured data | Home bevat `Organization`, `WebSite`, `WebPage`, `FAQPage`; koopgidsen `Article` + `BreadcrumbList`, modellen/datasheet `WebPage` + breadcrumb; bronnen en privacy missen niet-verplichte extra schema markup | PASS voor aanwezige types; geen rich results beloofd |
| Indexeerbaarheid | 13 pagina's bevatten geen `noindex`, `robots.txt` staat indexatie toe en verwijst naar de canonical sitemap | PASS voor code; Google's daadwerkelijke index blijft onbekend |
| Latest pre-existing live release | [Main CI 43998277544](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43998277544) **3/3 groen** en [pub-readiness 43998277535](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43998277535) **20/20 groen** | PASS op die commit `f5f1ec8` |
| Mobiel/beeld | CI test op 1440 / 390 / 320 en `axe` voor de 5 nieuwe gidsen plus bestaande flows. Eerdere Lighthouse desktop en mobiel 100/100/100/100 | PASS in lab, geen live Safari- of veldmeting |

**Geen reden voor een nieuwe reeks generieke SEO-artikelen:** volgens Google is nuttige originele inhoud en duidelijke bezoekersintentie waardevoller dan veel inhoud louter voor zoekmachines. Zie [Google Search Essentials](https://developers.google.com/search/docs/essentials) en [Helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

## 2. Kleine technische correcties in deze laatste PR

1. **Canonieke `index.html`-aliassen:** Express kan anders de homepage onder `/` en `/index.html`, en de gids onder `/modellen/` en `/modellen/index.html` aanbieden. Elke expliciete `index.html`-alias van de **13** echte sitemaproutes krijgt nu een **308 permanente redirect** naar de bestaande nette slash-URL met behoud van de querystring; onbestaande routes worden niet omgezet naar soft-404's. Wanneer Hostinger `CANONICAL_REDIRECT=true` heeft, kan `www` plus `index.html` bovendien in één stap naar de canonieke hoofdhost.
2. **Website-vraagwoord:** de bestaande premium H1 `De zon gaat onder. Jouw energie blijft.` blijft volledig behouden. In de direct zichtbare eerste tekstregel staat nu letterlijk `De HYXI AURA thuisbatterij ...`, zonder decoratief SEO-label of geformatteerde keyword-stapeling.
3. **Preventieve regressie:** 13 route-aliaslijsten moeten met de sitemap overeenkomen; backendtests controleren 308's, querybehoud, preview-noindex en 404's. Een extra publieke read-only GET-check `canonicalHtmlAliasRedirected` maakt de monitor na merge **21/21**. Bestaande beveiligde API, MySQL, Odoo, SMS, SMTP, tracking of leads worden niet gewijzigd.

**Niet claimen dat deze correcties live zijn totdat PR-CI én publieke 21/21 Hostinger-controle daadwerkelijk zijn afgerond.**

## 3. Openstaande stappen vóór Google Search Console-indiening

**P0 — eigenaar / Hostinger / SEO, eenmalig**

1. **Canonieke hosts vaststellen:** controleer bij Hostinger met echte DNS/HTTPS-responses dat `https://www.hyxi-aura.nl/` doorstuurt naar `https://hyxi-aura.nl/` als www bestaat; controleer ook de andere door eigenaar gebruikte schrijfwijze-/TLD-domeinen (`hyxiaura.nl`, `hyxi-aura.com`, `hyxiaura.com`), voor zover geconfigureerd en bedoeld als aliases. Waar dezelfde site bereikbaar is, leg één **301/308 redirect** naar het hoofddomein vast, geen gekopieerde sites. `CANONICAL_REDIRECT=true` is aanwezig in `.env.example`, maar de **werkelijke Hostinger-variabele en DNS-instelling zijn niet vanuit GitHub bewezen**. Alleen servercode is geen DNS-bewijs.
2. **Google Search Console (gratis):** verifieer domeineigendom als `sc-domain:hyxi-aura.nl` met de door Google gegeven DNS-TXT. Dien daarna `https://hyxi-aura.nl/sitemap.xml` in.
3. **URL-inspectie:** controleer 13/13 URL's in GSC op ‘geïndexeerd / niet-geïndexeerd’, laatst gecrawld, gekozen canonical, `robots.txt`, fetch-status en eventuele mobiele rendering/blokkades. Onderscheid live 200 van echte Google-indexatie; noteer elke uitzondering met datum/reden. Richt ook Page Indexing/Core Web Vitals en Search Performance in; feitelijke cijfers komen later.

**P1 — niet blokkeren op een verder correcte 13-paginasitemap, wel nodig vóór betaalde/commerciële grootschalige acquisitie**

- Laat de eigenaar het visuele resultaat op echte iPhone Safari beoordelen (doelscore ≥9/10), inclusief merk, links, afbeeldingen, aanvraag, snelheid en formulieren.
- Controleer binnen Thuisbatterij Team wie leads in Odoo oppakt, reactietermijn en vervanger; beide leidende aanvragen komen via bestaande `leads@`-mailimport al in Odoo.
- Ontwerp een privacyrechtmatige bezoek-naar-leadmeting; er is nu geen betrouwbare bezoekersdenominator en dus **geen** onderbouwd conversiepercentage.
- Bij concrete aanbiedingen: bevestig actuele HSA2-/HTA2-modelcode, prijzen incl. installatie, leverbaarheid en ontbrekende BAT-Q7-garantie in nieuwe officiële documenten. Geef in de huidige algemene gidsen geen onbewezen prijs of garantie.
- Optioneel: visuele editorreview van OG-preview en favicon op echte toestellen en delen via WhatsApp/LinkedIn. Geen fictieve Reviews, `Offer` of rich-resultgarantie.

## 4. Belangrijke SEO-beperkingen

- Geen eigenaarstoegang tot echte Search Console-inspecties bewezen; de betaalde GSC Wizard-gate is eerder geweigerd.
- Deze ronde kan canonieke HTML, sitemap en actuele publieke GET-readiness testen; niet de eigen Google-index, echte ranking, CTR of daadwerkelijke veld-CWV.
- Google Search ondersteunt sitemap als ontdekking en canonical signaal, maar **niet** als automatische indexatie- of rankingsgarantie. Zie [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) en [Canonicalisatie](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
- Public crawl is al toegestaan. **Niet** zeggen dat Google de site ‘pas ziet’ wanneer wij de sitemap indienen.
- Voor PDF's en afbeeldingen kan Google aparte crawls/zoekresultaten tonen. De datasheet-HTML biedt originele downloaduitleg, en het gebruik van de fabrikantdocumenten is niet afhankelijk van een formulier.
- Google kan een andere titel, snippet of favicon kiezen dan onze markup; onze code beïnvloedt die keuze, garandeert haar niet.

## 5. Definitieve releasebewijzen — PASS 17 november 2026

**Pre-Search Console audit en 308-canonical-correctie zijn uitgevoerd en technisch geaccepteerd.**

| Acceptatiepunt | Uitslag | Bewijs |
| --- | --- | --- |
| Implementatie op productiebranch `main` | [PR #52](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/52) **gemerged**, commit `b6b12826dcc8bbc64aa51f685fb84ac60d07908d` | [Code, tests en auditdocument](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/52/files) |
| PR-head builds / MySQL8 / API / SEO / browser / Lighthouse | **3/3 CI PASS** | [GitHub Actions #44070796746](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/44070796746) |
| Postmerge `main` dezelfde controles | **3/3 CI PASS** | [GitHub Actions #44071180981](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/44071180981) |
| Echte publieke Hostinger-versie, 13 URL's en canoniek alias | **21/21 PASS bij hercontrole** | [GitHub Actions #44071180894, rerun attempt 2](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/44071180894) |

De **eerste** publieke run op de nieuwe commit gaf **20/21**: de expliciete `/index.html`-redirect werd toen nog niet als gedeployd herkend, terwijl alle bestaande checks groen waren. De aansluitende read-only hercontrole op dezelfde commit gaf **21/21 PASS**, inclusief `canonicalHtmlAliasRedirected`. Dit komt overeen met een Hostinger-uitrol die na de GitHub-push doorliep; de twee runlogs tonen de feitelijke overgang. Er zijn geen nieuwe synthetische lead-POSTs, mailboxschrijfacties of wijzigingen aan GSC uitgevoerd.

**Definitief oordeel:** de website voldoet aan de *controleerbare* technische/inhoudelijke pre-GSC-voorwaarden van deze audit. **Het daadwerkelijk indienen en monitoren in Google Search Console blijft OPEN** totdat de eigenaar de DNS-/domeinverificatie en de inspectie van 13 URLs uitvoert. De www-/alternatieve hostredirects zijn nog niet rechtstreeks vanuit de echte DNS-omgeving bewezen. De 9/10 eigenaarreview op echte iPhone Safari, echte verkeers-/salesdata en aanvullende schriftelijke fabrikantbevestigingen zijn afzonderlijke commerciële/open bronpunten.

Terugkerende preventie: na iedere site-uitbreiding de `PUBLIC_CANONICAL_PATHS`-lijst samen met de sitemap bijwerken; `tests/pre-gsc-topic-clusters.test.mjs` bewijst hun gelijkheid en `tests/backend.test.mjs` controleert permanente redirects, querybehoud en onbekende 404's. Een groene publiek-bereikbaarheidstest is geen Google Search Console-inspectie.
