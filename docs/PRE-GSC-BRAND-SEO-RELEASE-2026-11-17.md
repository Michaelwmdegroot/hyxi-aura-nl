# HYXI AURA — nieuwe website-iconen en pre-indexatie-SEO-afwerking

**Uitgevoerd:** 17 november 2026 · **Scope:** statische website-assets, publiek metadata, merkpresentatie, aanvullende read-only releasecontrole en tests.  
**Basis:** afgeronde fabrikant-/inhoudsaudit PR #45–#46 + gecorrigeerde overdracht PR #47.  
**Status:** feature-PR #48 gemerged op `main` en **15/15 echte publieke checks groen**, bewezen met GitHub Actions op 17 november 2026.

## 1. Eigenaarssignaal en uitgangspunt

De eigenaar leverde een eigen transparant zwart/antraciet huis met witte batterij en goudgele bliksem aan. Gebruik **dit** beeld, geen nieuw getekend logo of het oude generieke oranje A-icoon. Bewaar zichtbaar de afzender **Thuisbatterij Team presenteert HYXI AURA**; dat maakt deze site geen officiële HYXI-fabrikantwebsite.

Het bronbestand van de eigenaar is 1254×1254 RGBA, 930.803 bytes, SHA-256 `6d656216302fff37e9bcf749577e23edd4617bfd7537aae0e61f9dd9885dbf52`. De originele upload staat niet in deze GitHub-repository; distributiekopieën zijn uit exact dat bronbestand met Lanczos geschaald en met een beperkte indexed-palette geoptimaliseerd voor snelheid. **Dit is beeldcompressie, geen nieuwe vorm, andere kleuren of nieuw AI-icoon.** De zeer lichte rasteronvolkomenheden langs de onderrand zitten al in de aangeleverde tekening.

| Bestand | Pixels | SHA-256 | Gebruik |
| --- | ---: | --- | --- |
| `/favicon.png` en `/icons/brand-48.png` | 48×48 | `7482684d0388ad5e6a875efe3b5502d0c723c87496cc706026b75dcf770cd218` | Google Search/browser favicon |
| `/apple-touch-icon.png` en `/icons/brand-192.png` | 192×192 | `d8cf0118ec990bfe7e639a51a6daa76a16ec56774a6b6930598dfa3b2d27fa03` | iOS-snelkoppeling, in-site woordmerk, PWA-manifest |
| `/icons/brand-512.png` | 512×512 | `e58f9355ccfde1d53cb8d6815871655925662e9359ad9730f1d6beb5a55d7841` | Hoog-resolutie app-pictogram |
| `/favicon.svg` | 48×48 raster ingebed in SVG | afgeleid van exact dezelfde 48-PNG | Compatibiliteit voor oude directe favicon.svg-URLs |

Alle commerciële pagina's (acht routes) verwijzen naar `/favicon.png`, `/apple-touch-icon.png` en `/site.webmanifest`. `/site.webmanifest` verwijst uitsluitend naar werkelijk aanwezige 192- en 512-PNG's; `display=browser` betekent nadrukkelijk **geen** verzonnen offline-app of serviceworker. Het icoon staat op desktop tevens naast de bestaande Thuisbatterij Team-typografie in header/footer en in de adviesdialoog. Op de smalste schermen verdwijnt alleen het **decoratieve** header-icoon ten gunste van leesbare merknaam/CTA.

## 2. Pagina- en zoekresultaatkwaliteit: uitgevoerde audit

| Publieke route | Zoekintentie/inhoud (bestaand gecontroleerd PR #45) | Nieuwe aanpassing |
| --- | --- | --- |
| `/` | HYXI AURA uitleg, keuzehulp, configurator, advies | Product-first titel/description en OG-tekst; icon; alle metadata consistent |
| `/offerte/` | vrijblijvende persoonlijke offerte i.p.v. fictieve prijs | icoon, manifest en sociaal zoekresultaatmateriaal |
| `/bronnen/` | fabrikant/PDF's/garanties en voorlopige HTA2-fouten | icoon, OG-site-naam/afbeeldingscontext, manifest |
| `/privacy/` | gegevens, Odoo-mailverwerking, rechten en retentie | icoon, OG-site-naam/afbeeldingscontext, manifest |
| `/kennis/bat-q7-vs-bat-q9/` | nominale/bruikbare kWh, vermogens en keuzevragen | icoon, presentatie- en meta-conformiteit |
| `/kennis/noodstroom/` | ATS, 0ms versus doorlaatstroom 63A en beperkt vermogen | icoon, presentatie- en meta-conformiteit |
| `/kennis/installatiecheck/` | drie niet-persoonlijke voorbereidingsvragen | icoon, presentatie- en meta-conformiteit |
| `/kennis/1-fase-of-3-fasen/` | HSA2/HTA2 en installatiegrenzen | icoon, presentatie- en meta-conformiteit |

Voor elke route expliciet: één H1, unieke beschrijving, canonieke eigen HTTPS URL, OpenGraph-image-metadata (1200×630 + alt), de site naam, Twitter large-image fallback, `max-image-preview:large`, favicon/apple touch/manifest. De bestaande journalistieke en productinhoud is **niet massaal herschreven**: de vorige audit vond reeds onderscheidende, substantiële teksten. Geen lege SEO-doorways, keyword-stapeling of gefingeerde bedragen/reviews.

De homepage toont nog steeds het redactionele H1 `De zon gaat onder. Jouw energie blijft.`; de titel en social-tekst noemen nu explicieter het product, BAT-Q7/Q9, ondersteuning en de afzender. `WebPage.name` in JSON-LD wordt door `scripts/content.mjs` synchroon gehouden met de werkelijke title-tag. `Organization` blijft correct `NIVO Groep Holland B.V.`; het nieuwe subsite-icoon wordt **niet** vals als officieel organisatie- of fabrikantlogo in structured data geclaimd.

## 3. Bronintegriteit en scope

- De HSA2-/HTA2-datasheets zijn **Preliminary V2.1**, niet definitief. De verdachte HTA2-modelkolommen en `160000 W` blijven gedocumenteerd; geen eigen gecorrigeerde fabrikantgetallen ingevuld.
- BAT-Q7 = 7,03/6,7 kWh en BAT-Q9 = 9,04/8,6 kWh; dat is bestaande broninformatie, geen nieuwe garantie of leveringsbelofte.
- Verificatie van officiële productbeschrijving: [HYXI NL](https://www.hyxipower.com/nl/ProductsDetail/hyxi-aura) en [HYXI EN](https://www.hyxipower.com/en/ProductsDetail/hyxi-aura). ATS/0ms/63 A zijn **geen** garantie op onbeperkt noodvermogen.
- Aanvragen, beveiligde MySQL, mail/outbox, Odoo-import, Beheer-rollen, backups en leadformulieren blijven functioneel ongewijzigd. Het bestaande advies- én offertepad naar Odoo is reeds door de eigenaar bewezen; **geen synthetische testleads**.
- Geen Google Search Console-verificatie, indexatieverzoek, tracking, advertenties, nieuwe cookies of conversieclaims in deze sprint.

## 4. Releasekwaliteit

- `tests/brand-preindex.test.mjs`: controleert PNG-signatures/resoluties, identieke buildbytes, manifest, acht canonicals/metadata en afzender, homepage JSON-LD-match en Beheer noindex.
- `scripts/probe-production.mjs` en `tests/probe-production.test.mjs`: **15e** volledig publieke GET-controle `brandAssetsDeployed`. Bewaakt of nieuwe iconen, manifest en homepage-verwijzing werkelijk op Hostinger staan; korte retries voor uitrolrace, geen PII/POST.
- Bestaande CI-gates blijven: Node24 build, tests, statische links, browser 320/390/1440, a11y, MySQL8/outbox, Beheer, realistische Hostinger-prod-only install.
- Productie kan pas als de PR-head 3/3 groen is. Daarna postmerge 3/3 en publieke 15/15 read-only check; als Hostinger nog de vorige release serveert, hercontrole na daadwerkelijke uitrol zonder nieuw formulier te versturen.

## 5. Nog niet bewezen

- Dat Google de site al geïndexeerd heeft, welke titels/snippets het algoritme uiteindelijk toont of welk verkeer daaruit komt. Zoekresultaattitels en favicon zijn suggesties, geen garantie.
- Definitieve eigenaarsscore ≥9/10 en controle op een **echte iPhone Safari**.
- Fabrikantbevestiging van de voorlopige HTA2-modelcodes en garanties voor elke leverbare variant.
- Echte bezoeker-naar-leadconversie en commerciële SLA/omzet vanuit Odoo. GSC Wizard gaf eerder `payment_required`; Google Search Console zelf is gratis en eigenaarsverificatie volgt afzonderlijk.

## Merge- en productiebewijs

**PR #48 is geslaagd en gemerged**: [code-, metadata- en assetwijzigingen](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/48) op `main` als `4653b84211223d0d852bc3ee62a802800aa1d44e`. De wijzigingen staan daarmee in de productiebranch, maar de daadwerkelijke uitrol is ook zelfstandig gecontroleerd.

| Gate | Resultaat en bron | Wat dit wél en niet bewijst |
| --- | --- | --- |
| PR-head build/QA | [GitHub Actions #43988837014](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43988837014): **3/3 jobs PASS** | Node24, productiebouw, 82 bron-/API-/merkregressietests, statische links/schema/PDF's, Chromium 1440/390/320, axe, Beheer en geïsoleerde MySQL8/outbox. Geen echte leadverzending |
| Lighthouse op PR-head | Zelfde Actions-run: **desktop 100/100/100/100**, **mobiel 100/100/100/100** (performance / accessibility / best practices / SEO) | Synthetische testomgeving; geen echte Core Web Vitals/gebruikerservaring of gegarandeerde Google-posities |
| Na merge: `main` | [GitHub Actions #43989145262](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43989145262): **3/3 jobs PASS** | Onafhankelijke hercontrole op de exacte gemergede commit |
| Echte Hostinger-site | [Publieke controle #43989145299](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43989145299): **15/15 PASS** inclusief `brandAssetsDeployed` | Alle 8 HTML-routes, canonicals, sitemap, privacy/Odoo-uitleg, API-readiness, geen toegang tot private leads, **werkelijke** PNG-iconen en manifest op hyxi-aura.nl. GET-only, geen nieuwe mail of echte aanvraag |

**Gekozen afwerking:** het transparante 48px favicon met de exacte vorm van de eigenaar is publiek bereikbaar, naast 192px en 512px-versies en een iOS-touchicoon. Het merk is op de website zelf in de zichtbare presentatie opgenomen; geen fabrikanterkenning of nieuw verzonnen logo. Googlebot kan de favicon bereiken omdat de bronpagina en iconbestanden publiek bereikbaar zijn en de robots.txt die niet blokkeert. Google kiest zelf of/wanneer het favicon in zoekresultaten getoond wordt.

**Releasebesluit:** technische en redactionele **pre-indexatiebasis gereed**. De eigen GSC-verificatie, reële URL-indexatie, zoekimpressies, CTR, bezoeker→aanvraagconversie en de door eigenaar beoordeelde visuele ≥9/10 op echte iPhone Safari blijven afzonderlijk **OPEN**. GSC Wizard gaf eerder `payment_required`; gebruik de gratis officiële Google Search Console via geverifieerde eigenaarstoegang, niet een betaalde afhankelijkheid.

**Google-bronnen voor de SEO-keuzes:** [favicon in Google](https://developers.google.com/search/docs/appearance/favicon-in-search), [titellinks](https://developers.google.com/search/docs/appearance/title-link) en [snippets](https://developers.google.com/search/docs/appearance/snippet). De website voldoet aan de controleerbare markup-/bestandsvoorwaarden; Google bepaalt de uiteindelijke presentatie en crawl.
