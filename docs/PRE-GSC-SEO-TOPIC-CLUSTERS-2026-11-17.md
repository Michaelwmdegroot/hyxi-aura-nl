# HYXI AURA — zoekintentie, topicclusters en pre-indexatiecontent (17 november 2026)

**Opdracht eigenaar:** voor Search Console de bestaande landingspagina en het complete productverhaal versterken: longtail, vindbare officiële datasheets, zinvolle interne links, beperkte functionele links naar Thuisbatterij Team/NIVO, en onderbouwde keuze over model- en garantiepagina's. Bestaand platform intact laten. **Dit is een uitvoeringsspecificatie, geen keyword-volume-/rankingrapport.**

## 1. Wat we werkelijk weten over zoekvraag

- **Website:** vóór deze sprint 8 canonieke publieke pagina's; 4 zelfstandige kennispagina's (BAT-Q7/Q9, noodstroom, installatiecheck, fase). GitHub release #48/#49: statische SEO & 15/15 publieke GET checks geslaagd.
- **Bron 1 – fabrikant:** [HYXI AURA NL](https://www.hyxipower.com/nl/ProductsDetail/hyxi-aura) en [Engelse productpagina](https://www.hyxipower.com/en/ProductsDetail/hyxi-aura). Daarop staan geïntegreerde ATS, omschakeling 0 ms, 63 A doorlaatstroom, 1–6 modules, 7/9 kWh-klasse en voorlopige productdocumentatie.
- **Bron 2 – originele V2.1 preliminary datasheets:** public/downloads/hyxi-aura-1-fase-datasheet.pdf en ...3-fasen-datasheet.pdf. Bestaande exacte inhoudscontrole [productbronnen](PRODUCT-SOURCES.md) en [pre-GSC feitenreview](PRE-GSC-CONTENT-FACT-AUDIT-2026-11-16.md) zijn de leidende geverifieerde bron voor 7,03/6,7 en 9,04/8,6 kWh en onvolkomenheden in HTA2-tabel. In deze sprint geen niet-geverifieerde PV-invoervermogens of modelidentiteiten.
- **Bron 3 – garantie:** [HYXiPOWER EU Warranty Terms 2026-09-18](https://webfile.hyxipower.com/soft/20261010/HYXiPOWER-Products-Warranty-Terms--Conditions-EU_EN-20260918.pdf), vooral pagina's 1–4: de HSA2/HTA2-families, BAT-Q9 en BAT-Q-bases staan expliciet op 10 jaar; BAT-Q7 **niet**. BAT-Q9 cumulatieve ontlaadenergie 50,7 MWh. Verloopt op de eerst bereikte voorwaarde; arbeid/accessoires niet gelijk aan hardwaregarantie.
- **Publieke zoekresultaten als kwalitatieve SERP-aanwijzing:** zoekopdrachten `HYXI AURA prijs`, `HYXI AURA datasheet`, `HYXI AURA HSA2 HTA2` leveren o.a. [een Nederlandse prijs/installatie-productpagina van DD Energie](https://ddenergie.nl/thuisbatterij/hyxi-aura/) en officiële fabrikantdownload-/garantiepagina's op. Dit toont dat deze onderwerpen publiek worden behandeld, **niet** het aantal zoekopdrachten, ranking, clicks of commerciële conversie.
- **Geen geldig kwantitatief zoekvolume of GSC-data:** verbonden GSC Wizard gaf `payment_required`; eigenaarverificatie via gratis native Google Search Console is nog niet uitgevoerd. Er zijn **geen** Keyword Planner-volumes, keyword-difficulty- of rankingcijfers. Geen zoekvolume, CPL, CTR of verkoopcijfers verzinnen.

## 2. Eén zoekintentie = één primaire canonieke URL

| Canonieke URL | Primaire zoekintentie en longtail | Type | Waarom uniek? |
| --- | --- | --- | --- |
| `/` | HYXI AURA thuisbatterij; HYXI Power AURA werking | Pillar/commercieel | Overzicht, ervaring, configurator en advies |
| `/modellen/` **nieuw** | HYXI AURA modellen; HSA2/HTA2 uitvoeringen; BAT-Q7 / BAT-Q9 configuraties | Productfamilie-overzicht | Welke families en modules bestaan, welk onderscheid moet bij een aanbod bevestigd worden; géén variant-SKU webshop |
| `/datasheet/` **nieuw** | HYXI AURA datasheet PDF downloaden; HSA2 datasheet; HTA2 datasheet; Q7 Q9 specificaties | Technische download-intentie | V2.1- en taalversie, exacte documentkeuze, tabel en bronwaarschuwingen plus PDF-links |
| `/kennis/prijs-en-installatie/` **nieuw** | HYXI AURA prijs inclusief installatie; kosten thuisbatterij HYXI; prijsopbouw | Offerteoriëntatie | Waaruit prijs bestaat, welke kosten/opstellingen een persoonlijke offerte veranderen; zonder onbevestigde euro's |
| `/kennis/bestaande-zonnepanelen/` **nieuw** | HYXI AURA op bestaande zonnepanelen; eigen omvormer houden/vervangen | Installatiecontext | Vier PV-situaties en te controleren compatibiliteit, geen aansluitschema of garantie |
| `/kennis/garantie/` **nieuw** | HYXI AURA garantie; BAT-Q9 10 jaar; BAT-Q7 garantie; garantietermijn omvormer | Voorwaarden/vertrouwen | Exacte EU voorwaarden, BAT-Q7 ontbreekt, termijnen/doorvoer en onderscheid wettelijk recht |
| `/kennis/bat-q7-vs-bat-q9/` | HYXI BAT-Q7 of BAT-Q9, bruikbare kWh, 7 of 9 kWh | Keuzegids | Kwantitatieve batterijmodule-vergelijking |
| `/kennis/noodstroom/` | HYXI AURA noodstroom, ATS, 0 ms, 63 A | Technische gids | Welke belastingen blijven werken, beperkingen van back-up |
| `/kennis/1-fase-of-3-fasen/` | HYXI AURA 1 of 3 fasen, HSA2 versus HTA2 | Technische gids | Elektrische netaansluiting/vermogen, niet een modelcatalogus |
| `/kennis/installatiecheck/` | HYXI AURA installatiecheck, past bij mijn meterkast | Preflight-tool | 3 niet-persoonsgebonden vragen; GET-overdracht naar bestaande offerte |
| `/offerte/` | HYXI AURA offerte aanvragen | Conversie | Eén beveiligde bestaande echte aanvraagroute |
| `/bronnen/` | HYXI bronnen, onderbouwing, technische voorwaarden | Transparantie | Redactionele bronverantwoording, geen duplicaat downloadcatalogus |
| `/privacy/` | privacy/cookies | Juridisch | Verwerking persoonsgegevens, geen commerciële SEO-intentie |

**Waarom géén afzonderlijke 3/5/8/10/15/20/30 kW SKU-landingspagina's?** Er ontbreken echte zoekvolumes per code, definitieve actuele datasheets corrigeren nog niet alle HTA2-mislabels, en door Thuisbatterij Team bevestigde leverbaarheid/prijs inclusief installatie per code ontbreekt. Tientallen near-duplicate/doorway-varianten zijn niet in bezoekersbelang. Eén echte modellenhub en bestaande fasegids voldoen voorlopig beter. Hero blijft premium en rustig.

## 3. Interne links: structuur en redactieregels

1. **Homepage →** modellen, datasheet, kosten, zonnepanelen, garantie plus de 4 bestaande gidsen; semantische, beschrijvende anchors vanuit één rustige contentsectie.
2. **Modellen ↔ fasegids ↔ BAT-Q7/Q9:** verschillende vragen, minimaal 2 wederzijdse contextlinks.
3. **Datasheet ↔ modellen ↔ garantie ↔ bronnen:** PDF-download op HTML-pagina mét uitleg; duidelijke originele fabrikantbron en voorlopige status. Geen gekopieerde PDF-tekst in bulk.
4. **Kosten ↔ installatiecheck ↔ zonnepanelen ↔ offerte:** koopvragen naar bestaande beveiligde aanvraagflow, geen extra formulier.
5. **Noodstroom ↔ garantie ↔ fasegids:** 63 A niet gelijk aan beschikbaar noodvermogen, garantie niet marketing-leeftijd.
6. **Beperkte echte externe verwijzingen:** fabrikant als primaire specificatiebron, Thuisbatterij Team voor echt advies/contact, NIVO voor installatie-organisatiecontext. Geen footerlinkfarm, niets geautomatiseerd voor backlinks, geen commerciële linkruil.

## 4. Acceptance / veilig deployen

- Alle 5 nieuwe pagina's bestaan als **eigen Vite HTML ingangen**, niet JS-only of dunne placeholder; ieder heeft eigen H1, unieke title/description, canonical/OG, Article of WebPage + BreadcrumbList JSON-LD, herkomst- en disclaimertekst, relevante CTA en mobiel veilige tabellen.
- Registreer 8→**13** canonieke HTML-URLs in sitemap; alle nieuwe pagina's zijn vanaf de homepage en via twee contextlinks te bereiken.
- Officiële productdocumenten blijven **ongewijzigd** als bestanden op /downloads/. Data blijft voorlopig, geen prijzen, voorraad, reviews of garantie voor BAT-Q7 verzinnen.
- Bestaande server, database, beveiliging, e-mail→Odoo import, Beheer en aanvraagformulieren worden **niet** gewijzigd; geen echte synthetische leads.
- Unit + link/SEO-checks moeten **13** URLs controleren; CI 3/3 inclusief desktop/390/320 Chromium, axe, Lighthouse en geïsoleerde MySQL8. Uitbreiding publieke GET-monitor van 15 checks naar **20 checks** (5 nieuwe URLs) zonder POST/PII.
- Eerst PR groen, dan merge, postmerge CI en Hostinger live GET alle 20 checks; releasebewijs in docs, niet enkel een plan.
- **Nog niet bewezen door deze sprint:** GSC-indexatie, echte query-/klikdata, zoekvolume, saleswaarde, eigenaarsscore op echte iPhone Safari. Alleen eigenaar/verantwoordelijke kan de echte Search Console-eigendom en definitieve commerciële GO bevestigen.

## Bronnen voor SEO-keuzes

- [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) — unieke nuttige content, relevante interne links en canonieke URL's
- [Google structuur en interne links](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure)
- [Google PDF-indexeerbaarheid](https://developers.google.com/search/docs/crawling-indexing/indexable-file-types)
- [Google productvarianten](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites)

**Let op:** geen sitemap indienen bij Search Console betekent niet dat Google de al publiek crawlbare website nog niet heeft ontdekt. Niet stilzwijgend `noindex` toevoegen; dat is een afzonderlijk eigenaarbesluit.
