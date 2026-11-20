# HYXI POWER / HYXI AURA — marktvergelijkingen en SEO-uitbreiding

> **Actueel besluit 20 november 2026:** de oude Q7/Q9-keuzegids `/kennis/bat-q7-vs-bat-q9/` is vervallen. De URL verwijst met HTTP 301 naar `/modellen/`; de actuele sitemap bevat **30** canonieke pagina's. De onderstaande eerdere plannen en historische 31-pagina-overzichten zijn geen instructie om de gids terug te plaatsen. Ons verkoopaanbod blijft uitsluitend vijf BAT-Q9-pakketten.


**Datum:** 18 november 2026  
**Project:** HYXI AURA, een gespecialiseerde premium HYXI AURA-site van NIVO Groep Holland B.V. / Thuisbatterij Team B.V.  
**Doel:** bezoekers die HYXI POWER zoeken én mensen die verschillende thuisbatterijmerken onderzoeken met correcte, unieke informatie helpen; primair informeren, daarna pas een passende HYXI AURA-offerte aanbieden.  
**Architectuur:** 18 → **31** publieke canonical HTML-pagina's als eerste grotere marktvergelijkingsfase.

## 1. Zoekwoord- en intentieonderzoek

### Huidige basis — 18 pagina's

De bestaande [SEO-keywordmatrix](SEO-KEYWORD-GROWTH-2026-11-18.md) bevat de achttien commerciële/informatieve routes en longtails (HYXI AURA thuisbatterij, modellen, datasheets, prijs, garantie, BAT-Q7/Q9, noodstroom, fasekeuze, bestaande zonnepanelen, btw, salderen, dynamisch contract, uitbreiden, buitenplaatsen etc.).

**Kennisgrens:** GSC is door de eigenaar voor het oorspronkelijke 13-pagina-platform geverifieerd en indexatie 13/13 werd bevestigd; vijf later gepubliceerde pagina's staan live maar hun afzonderlijke indexering/ranking is nog niet door Google API bevestigd. Er zijn **geen betrouwbare Nederlandse keywordvolumes, CTR/posities of concurrentiemoeilijkheid per term** beschikbaar. GSC Wizard geeft `payment_required` en Windsor.ai ondersteunt de nieuwe HYXI-property in de huidige verbinding niet. Prioriteiten zijn daarom *kwalitatieve zoekintentie en gebruikerswaarde*, niet verzonnen cijfers.

### Nu nieuw: de HYXI-brede hoofdzoekwoorden

| Canonieke URL | Primair keyword | Langere keywords en vragen | Afbakening |
| --- | --- | --- | --- |
| `/hyxi-power/` | **HYXI POWER / HYXiPOWER** | wat is HYXI POWER, HYXI AURA vs HYXI Halo, HYXI ENERGY fabrikant, HYXI Cloud en fabrikantmodellen | Merk/produktfamilies, niet officiële fabrikantsite; geen duplicaat van de AURA homepage |
| `/kennis/hoeveel-kwh-nodig/` | **hoeveel kWh HYXI thuisbatterij nodig** | HYXI 9 of 18 kWh, thuisbatterij voor twaalf zonnepanelen, hoeveel kWh bij 4.000 kWh jaarverbruik, hoeveel batterij voor avondverbruik | Dimensioneringsmethode op uurprofiel, geen universeel getal of ROI |
| `/kennis/app-monitoring/` | **HYXI AURA app** | HYXI Cloud monitoring, HYXiPOWER app handleiding, HYXI AI-modus, AURA gegevens inzien, thuisbatterij software | App/monitoring, niet hetzelfde als leveranciers-/tariefcontractgids |
| `/vergelijken/` | **thuisbatterijen vergelijken HYXI AURA** | HYXI versus andere batterijen, welke batterij bij bestaande zonnepanelen, hybride vs AC thuisbatterij, verschillende merken batterij, thuisbatterij vergelijking 2026 | Eigen marktvergelijkingshub met **21** controleerbare series verdeeld naar architectuur |

### Eerste negen diepgaande vergelijkingsintenties

| Canonieke URL (prefix `/vergelijken/hyxi-aura-vs-`) | Hoofdquery | Eigenlijke keuzevraag |
| --- | --- | --- |
| `sigenergy/` | HYXI AURA vs Sigenergy SigenStor | Controller, batterijmodules, gateway en generatie |
| `alphaess/` | HYXI AURA vs AlphaESS SMILE-G3 | G3-S5 hybride vs B5 AC vs driefase |
| `tesla-powerwall/` | HYXI AURA vs Tesla Powerwall 3 | Vaste 13,5 kWh, Nederlandse 3/3P-variant, app, back-up |
| `enphase/` | HYXI AURA vs Enphase IQ Battery 5P | AC/micro-omvormers vs hybride, FlexPhase |
| `huawei/` | HYXI AURA vs Huawei LUNA2000-S1 | Huawei-omvormercompatibiliteit vs alles-in-één |
| `byd/` | HYXI AURA vs BYD Battery-Box HVS | Losse batterijstack + externe omvormer vs complete HYXI |
| `solaredge/` | HYXI AURA vs SolarEdge Home Battery 400V | Bestaande SolarEdge en DC 400V vs hybride |
| `ecoflow/` | HYXI AURA vs EcoFlow PowerOcean | 3-fase hybride en modulair opslaan |
| `sessy/` | HYXI AURA vs Sessy | AC-retrofit en open API vs hybride systeem |

Iedere vergelijking heeft **unieke productarchitectuur, model-/brongebonden kenmerken, context over PV, vermogensgrenzen, back-up en voorwaarden**, vier concrete vragen voor een volledige offerte en een expliciete belangenverklaring. Geen automatisch vervangen van merknaam in een identieke vergelijking.

## 2. Officiële bronnenregistratie — 21 marktseries

`src/market-models.mjs` is de leidende bron van waarheid voor de vergelijkingshub; elke rij bevat fabrikant, model, categorie, gebruik, bron-URL, capaciteit en waarschuwende beperking. Registratie (selectie, geen volledige mondiale markt):

| Categorie | Fabrikant-/productseries (21 entries) | Wat de bezoeker moet begrijpen |
| --- | --- | --- |
| Hybride / all-in-one | HYXI AURA; Sigenergy SigenStor; Sigenergy SigenStor Neo; AlphaESS SMILE-G3; Tesla Powerwall; EcoFlow PowerOcean | Welke omvormer/controllerelementen en noodstroomonderdelen zijn inbegrepen? |
| AC-gekoppeld | Enphase IQ Battery 5P with FlexPhase; Sessy 5; Sessy 10 | Past naast een bestaande PV-omvormer, onder welke voorwaarden en met welk AC-vermogen? |
| Modulaire batterij met geschikte omvormer | Huawei LUNA2000-S1; BYD HVS; BYD HVM; SolarEdge Home Battery 400V; SolarEdge Home Battery 48V; Growatt APX HV 2.0; Fox ESS EP6 Plus; GoodWe Lynx Home F | Losse accu is geen complete PV-/back-upinstallatie; compatibiliteit per omvormer vaststellen |
| Plug-in / micro-opslag | HomeWizard Plug-In Battery; Marstek VENUS E; Zendure SolarFlow 2400 AC+; HYXI Halo | Andere vermogens-/installatieklasse dan vaste HYXI AURA; niet uniform rangschikken |

**Niet verwarren:**
- Sigenergy **SigenStor Neo** heeft andere documentatie dan de eerdere SigenStor; uitsluitend detailvergelijking met duidelijk benoemde generatie.
- AlphaESS **SMILE-G3 B5 AC** is geen identieke hybride SMILE-G3 S5; de T-familie is weer driefasig.
- Tesla Nederlandse **Powerwall 3** en **Powerwall 3P** moeten naar exacte marktuitvoering worden gecontroleerd.
- Enphase **IQ Battery 5P with FlexPhase** is niet dezelfde datasheet als oudere 5P.
- BYD HVS en HVM, SolarEdge 400V en 48V, Sessy 5 en 10 zijn niet onderling identiek.
- HYXI Halo ≠ HYXI AURA en het bestaan van HYXI Cloud bewijst geen willekeurige provider-EMS-compatibiliteit.

Bronnen staan direct in de registerdata en worden in de HTML weergegeven, van o.a. [HYXI](https://www.hyxipower.com/nl/ProductsDetail/hyxi-aura), [Sigenergy](https://www.sigenergy.com/nl/support/download), [AlphaESS](https://www.alphaess.com/residential-energy-storage-system), [Tesla](https://www.tesla.com/nl_nl/powerwall), [Enphase](https://enphase.com/nl-nl/media/22099), [Huawei](https://solar.huawei.com/nl/products/LUNA2000-7-14-21-S1/specs/), [BYD](https://www.bydbatterybox.com/), [SolarEdge](https://www.solaredge.com/nl/batterijen/thuisbatterij-400v), [EcoFlow](https://energy.ecoflow.com/nl/products/powerocean) en [Sessy](https://www.sessy.nl/specificaties/).

## 3. Interne linkstructuur / voorkomen keywordkannibalisatie

De commerciële hoofdpagina `/` blijft **HYXI AURA thuisbatterij** targeten en behoudt de productervaring, configurator en bestaande adviesflow. Vanaf die pagina staan nu links naar:
- `/vergelijken/`: centrale vergelijkingshub en vandaar naar negen merkvergelijkingen; omgekeerd linken die naar de hub, datasheet, prijs, PV en offerte.
- `/hyxi-power/`: HYXI-brede merkvraag zonder de AURA-hoofdpagina te herhalen.
- `/kennis/hoeveel-kwh-nodig/`: dimensioneren van bruikbare batterijcapaciteit, niet de modulevergelijking (BAT-Q7/Q9).
- `/kennis/app-monitoring/`: de app/monitoring/handleiding vraag, niet opnieuw het dynamische tarievenartikel.

De bestaande `/modellen/`, `/datasheet/`, `/kennis/prijs-en-installatie/`, `/kennis/bat-q7-vs-bat-q9/`, `/kennis/dynamisch-energiecontract/` en `/kennis/bestaande-zonnepanelen/` hebben logische contextlinks naar de nieuwe onderwerpen. De overige oude artikelen blijven inhoudelijk intact; niet elke pagina hoeft zonder reden alle 31 routes te linken.

**Cross-website linking:** Thuisbatterij Team/NIVO-links waar ze de bezoeker naar de feitelijke bedrijfsafzender, installatiecontact of offerte leiden. Geen automatische ruil-links met de andere product-/leadgen-domeinen.

## 4. Publicatiebeleid en transparantie

- De site wordt verkocht/geëxploiteerd door Thuisbatterij Team en NIVO; **geen** onafhankelijk testplatform en **geen** officiële HYXI-fabrikantsite. Op de hub en alle vergelijkingspagina's staat dit expliciet.
- **Geen fictieve prijs/aanbieding/garantie/voorraad/reviews/ratings of ‘#1’-score**. Laat een leverancier/actuele fabrikantpublicatie het exacte SKU, fase, software, compatibiliteit, noodstroomhardware en voorwaarden bevestigen. De fabrikant-Preliminary V2.1 HTA2-modelkolommen bevatten fouten; niet zelf corrigeren.
- Externe links naar fabrikantbronnen zijn bedoeld om de lezer de gegevens zelf te laten controleren, niet om een directory te vullen met contextloze SEO-links.
- “Alle modellen op de markt” is geen eindig stabiel aantal. Met deze fase bouwen we een **uitbreidbaar register van 21 relevante series** en een schaalbare architectuur; de selectie is niet exhaustief. Uitbreiding volgt wanneer bron en gebruikerswaarde aanwezig zijn.
- De originele fabrieks-PDF's, prijsgegevens en CRM/SMTP/Odoo-code blijven ongemoeid.
- Google Search Console: alleen de eerdere 13 waren volgens eigenaar geïndexeerd; het nieuwe totaal 31 is een **site-/sitemappublicatie**, niet bewezen GSC-indexatie. Er zijn geen gevalideerde NL-queryvolumes en rankings beschikbaar.

## 5. Verdere uitbreiding na feitelijke Google-querydata

**Volgende doelgroepgerichte pagina's** pas bouwen als er echte product-/documentgegevens zijn:
- HYXI AURA vs SigenStor Neo met generatiegerichte specificaties.
- HYXI AURA vs GoodWe / Fox ESS / Growatt op basis van concrete leverbare omvormer- + batterijsystemen (niet losse packs).
- HYXI AURA vs HomeWizard / Marstek / Zendure als **categorievergelijking plug-in versus vaste hybride**, geen kunstmatige één-op-één score.
- HYXI AURA gebruikershandleiding indien echte actuele officiële AURA-handleidingen in het juiste taal-/modelgebied beschikbaar zijn.
- Exacte 1-/3-fasen HYXI modelcode-/pakketpagina's alleen bij bevestigde verkoopvoorraad, prijs en officiële, ontegenstrijdige datasheets.
- Eigen installateurscases, eigen meetresultaten en interviews met toestemming — veel sterker dan generieke massa-artikelen. Geen plaatsnaam-/SKU-doorways.

## 6. QA en meetplan

**Releasegates:** 31 Vite HTML-ingangen, 31 XML `loc`-items, 31 Express 308-aliaspaths, 31 unieke titles/descs/H1/canonicals, 21 officiële registerentries, negen unieke diepe vergelijkingen, drie eigen HYXI-gidsen. Browser op 1440/390/320px, WCAG-audit, JSON-LD, alle publieke links, originele datasheetbestanden, Beheer- en MySQL-regressie.

Nieuwe live publieke readiness: 27 bestaande controles + 13 additionele (hub, drie HYXI-gidsen, negen comparators) = **40/40**. Eerst PR CI 3/3 en PR domeinpreflight groen, dan squash merge, postmerge CI 3/3 en echte publieke 40/40, eventueel na Hostinger rollout. Geen kunstmatige testleads, Search Console API-acties of ad-pixels.

**Wanneer Google de nieuwe pagina's heeft gecrawld:** GSC `Performance > Search results` en `Indexing > Pages` beoordelen per canonical, per NL-device, maand: branded versus category queries, daadwerkelijk aantal vertoningen, clicks, CTR, positie, sitemap-indexatie en overstap naar de offerte. Geen conclusies trekken uit nul vertoningen vlak na publicatie; de nieuwe grote categorievragen kunnen sterk concurrerende SERP's hebben.

_Document opgesteld 18 november 2026. Bij iedere fabrikantversie of wettelijk/regulatorisch wijzigingsmoment primaire bronnen opnieuw beoordelen._
