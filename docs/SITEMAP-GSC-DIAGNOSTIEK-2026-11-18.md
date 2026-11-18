# HYXI AURA — sitemap XML, Safari-presentatie en Google 'Couldn't fetch'

**Datum:** 18 november 2026  
**Status:** implementatie op PR #55, uitgevoerde XML/HTTP-diagnostiek van de productiesite; finale merge-/Hostinger-controle afzonderlijk vastleggen.  
**Voorkeurs-URL:** `https://hyxi-aura.nl/sitemap.xml` · **13 pagina's** · **geen sitemapindex noodzakelijk**.

## Waarom deze audit?

De eigenaar zag in Safari alleen aaneengeregen tekst-URL's, terwijl in de geverifieerde Search Console-domeinproperty `hyxi-aura.nl` bij de pas ingediende sitemap de status **“Couldn't fetch”**, type **“Unknown”**, laatste uitlezing leeg en 0 ontdekte pagina's stond. Als referentie is de Yoast-sitemapindex van thuisbatterijteam.nl getoond, die als verzorgde HTML-tabel verschijnt.

**Dit zijn twee verschillende zaken:**
- **Browserweergave:** de oorspronkelijke sitemap was valide XML, maar had geen XSL-presentatiestylesheet. Safari kon de inhoud daardoor als onopgemaakte, samengevoegde tekst tonen. De XML zelf is niet ongeldig vanwege ontbrekende opmaak.
- **Google kon sitemap nog niet ophalen:** deze GSC-status is niet hetzelfde als “parsing error”. Een eerdere crawl kan tijdelijk zijn mislukt of Google kan een ander toegangsprobleem hebben ervaren. We kunnen dat **niet** uit een Safari-screenshot of van buiten Googles eigen crawler achterhalen.

## Officiële sitemaps.org-vereisten en onze toets

[De sitemaps.org-specificatie](https://www.sitemaps.org/protocol.html) vereist een UTF-8 XML-bestand met `urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`, voor elke URL een `url` met exact één `loc`, en correct ge-escapete absolute URL's. `lastmod`, `changefreq` en `priority` zijn optioneel.

[Google Search Central](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) accepteert één gewone XML-sitemap. **Een `sitemap_index.xml` is optioneel**, niet vereist voor 13 pagina's. Yoast maakt een sitemapindex omdat die plugin verschillende contenttypen in aparte sitemaps groepeert. Google negeert `priority` en `changefreq`; Google gebruikt `lastmod` alleen wanneer die verifieerbaar klopt. **Geen fictieve pagina-wijzigingsdatums toevoegen** om de XML meer op Yoast te laten lijken.

### Verificatie van de bestaande productiesite, vóór codefix

De [externe GitHub Actions-sitemapdiagnose (PR #55)](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/44291046050) leverde de volgende feiten op:

| Controle | Resultaat |
| --- | --- |
| Sitemap uit de repository via `xml.etree.ElementTree` parser | PASS; 13 unieke kanonieke HTTPS-URL's; juiste namespace en UTF-8 |
| Sitemaps.org-structuur, geldige XSL | PASS |
| Live `GET https://hyxi-aura.nl/sitemap.xml` | HTTP **200** |
| Content-Type live | **`application/xml`**, dus Google-compatible |
| Live request van onafhankelijke standaardclient | XML parseert, **13/13** unieke canonieke pagina-URLs |
| Live request met een gespoofte Googlebot-achtige User-Agent | HTTP **200**, XML parseert, **13/13** URLs |
| `robots.txt` en sitemap in live domein-preflight | HTTP 200; verwijzing naar de correcte `/sitemap.xml` |

**Let op:** een User-Agent simuleren vanaf een GitHub-runner **bewijst niet** dat de echte, door Google via IP/DNS geverifieerde Googlebot dezelfde HTTP-respons ontvangt. Deze gegevens sluiten een systematisch ongeldige XML uit en bieden geen aanwijzing voor een algemeen publieke fetch-blokkade. De specifieke oorzaak van de GSC-melding blijft onbevestigd.

## Wat is geïmplementeerd?

1. **Behoud bestaande URLset** `public/sitemap.xml`: 13 URL's, geen dubbele varianten, geen nieuwe sitemapindex en geen niet-relevante extra XML-elementen.
2. **XSL-presentatie toegevoegd**: `public/sitemap.xsl` en een standaard `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>` processing instruction. De browser kan dezelfde inhoud nu als nette, lichte HYXI AURA-tabel tonen; de zoekmachine leest nog steeds de gewone XML-urlset. Geen JavaScript, geen cookies of tracking.
3. **Express-header expliciet**: `application/xml; charset=UTF-8` voor `/sitemap.xml` en `text/xsl; charset=UTF-8` voor `/sitemap.xsl`. De bron bleek al `application/xml` te serveren; dit is een preventieve versterking, **geen bewezen root-cause fix** voor Search Console.
4. **Regression gate met echte XML-parser**: `scripts/audit-sitemap.py` maakt de CI harder dan het uitsluitend zoeken naar `<loc>` via regex. Het controleert namespaces, UTF-8, URL's, XSL en live MIME. De CI test het dist-artifact met Python stdlib, zonder extra afhankelijkheden op Hostinger.
5. **Live monitoring**: `.github/workflows/gsc-domain-preflight.yml` controleert naast de bestaande domein- en robotschecks ook XML-parse en HTTP Content-Type in twee publieke UA-varianten.

## Stappen in Google Search Console na de Hostinger-deploy

- Open de verified property `hyxi-aura.nl` → **Indexing → Sitemaps**.
- Klik op de rij `https://hyxi-aura.nl/sitemap.xml` met **“Couldn't fetch”**. Bekijk de **specifieke foutdetailpagina**, vooral de tekst “Sitemap could not be read” en eventuele nadere oorzaak; maak een screenshot voor de QA-overdracht.
- Controleer eventueel met de GSC **URL Inspection → Test live URL** of Google de sitemap-URL op dat moment kan bereiken. Een eigen Safari/Chrome 200 is geen echte Googlebot-inspectie.
- **Dien dezelfde `https://hyxi-aura.nl/sitemap.xml` opnieuw in** nadat de uitrol is bevestigd (of laat Google opnieuw proberen als de status inmiddels is bijgewerkt). De XML bevat alle 13 pagina's: **er is geen nieuwe index-URL nodig.**
- Controleer daarna in de sitemaprij: **status Success**, type Sitemap, **13 discovered pages** zodra Google daadwerkelijk heeft verwerkt (het aantal kan eerst 0 blijven), **Last read** en eventueel uitgesplitste fouten. Een succesvolle ontvangst is nog geen bewijs dat 13 pagina's geïndexeerd zijn.
- Inspecteer eerst `/`, `/datasheet/`, `/modellen/`, `/offerte/`, daarna de overige 9. Noteer exacte Google-selected canonical en reden van eventuele uitsluiting. Google kan meerdere dagen nodig hebben, vooral kort na de eerste domeinverificatie.

Referentie: [Google Search Console Sitemaps Report](https://support.google.com/webmasters/answer/7451001?hl=en): bij “Couldn't fetch” details openen, bereikbaarheid checken, bij aanhoudende fout het probleem oplossen en opnieuw indienen; Google probeert herhaaldelijk te crawlen.

## Niet aanpassen

- **Geen** originele HYXI-datasheet-PDF, Odoo-leadverwerking, MySQL, privacy- of SMTP-stroom.
- **Geen** extra `sitemap_index.xml` of meermaals identieke URL's; dit geeft geen extra SEO-rendement.
- **Geen** aangenomen `lastmod`-waarden, zoekrangschikking, indexatieclaims of Google-API-writes zonder echte bevestiging.

## Release-evidence

In te vullen op basis van werkelijke PR/CI/Hostinger-bewijzen na groene merge; geen 'GSC Success' claimen zonder Search Console-uitkomst.
