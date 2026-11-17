# HYXI AURA — Search Console-activering en eerste indexatiemonitor

**Datum:** 17 november 2026  
**Hoofddomein:** `https://hyxi-aura.nl/`  
**Sitemap:** `https://hyxi-aura.nl/sitemap.xml`  
**Doel:** indexatietraject starten na afgeronde pre-GSC SEO-/feitenaudit zonder dubbele websites, betaalde SEO-connector, nieuwe testleads of wijzigingen aan productprijzen.

## 1. Vastgestelde situatie (bewijsketen)

- **De code, site en beveiligde formulieren:** [PR #50](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/50) en [#52](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/52) zijn gemerged. **13 unieke publieke canonical URLs**, volledige Vite-/sitemap-/robots-registratie en 308-redirects voor expliciete `index.html`-aliassen. De vorige publieke productiecontrole behaalde [21/21 PASS](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/44072134547).
- **Externe netwerkcontrole op GitHub runner:** [Domain indexing preflight PR #54](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/54), workflow `.github/workflows/gsc-domain-preflight.yml`, script `scripts/gsc-domain-preflight.mjs`. Controleert uitsluitend publieke HTTP GET/HEAD, met redirects niet automatisch gevolgd en zonder PII, cookies of formulieren.
- **Echte HTTP-status op 17-11-2026:** `https://hyxi-aura.nl/` = **200**, sitemap = **200** met 13 unieke canonical URLs, robots.txt = **200**, `https://hyxi-aura.nl/index.html` = **308** naar `https://hyxi-aura.nl/`. `http://hyxi-aura.nl/` geeft **301** naar HTTPS; `https://www.hyxi-aura.nl/` geeft **308** naar het hoofddomein.
- **De drie andere domeinen** (`hyxiaura.nl`, `hyxi-aura.com`, `hyxiaura.com`) geven **200**, maar tonen de **Hostinger “Parked Domain name on Hostinger DNS system”** placeholder met `robots=noindex,nofollow,noarchive,nosnippet` en **zonder HYXI AURA-/Thuisbatterij Team-producttekst**. Dit zijn *geen dubbele publieke kopieën van onze productwebsite*. Een 301/308 naar de hoofdsite is alsnog commercieel nuttig voor bezoekers die een andere schrijfwijze intypen, maar niet vereist om de hoofdsitemap bij Google aan te melden. Wijzig alleen domeinen waarvan de eigenaar bevestigt dat hij ze wil doorverwijzen.
- **Google Search Console:** **propertyverificatie en sitemapindiening zijn via deze toegang niet bevestigd**. De bestaande GSC Wizard-connector is geblokkeerd met `payment_required`, ook bij `list_sites` / `get_account_info`; alle calls opnieuw proberen zonder gewijzigd abonnement heeft geen zin. **Google Search Console zelf is gratis** en wordt rechtstreeks via het Google-account van de eigenaar gebruikt.

**Grenzen:** HTTP 200 en een geldige sitemap zijn geen bewijs van Google-indexatie, ranking of CTR. Een publieke website kan al vóór een sitemapaanmelding door Google zijn ontdekt. De Google-eigenaar moet property/URL-inspectie uitvoeren en eventuele Google-exclusions controleren.

## 2. 13 echte inspectie-URL's — één leidende canonical per zoekvraag

| Prioriteit | Canonieke URL | Zoekintentie |
| --- | --- | --- |
| 1 | `https://hyxi-aura.nl/` | HYXI AURA thuisbatterij |
| 1 | `https://hyxi-aura.nl/datasheet/` | HYXI AURA datasheet HSA2/HTA2, BAT-Q7/BAT-Q9 PDF |
| 1 | `https://hyxi-aura.nl/modellen/` | HYXI AURA omvormer- en batterijmodellen |
| 1 | `https://hyxi-aura.nl/offerte/` | Vrijblijvende HYXI AURA-offerte |
| 2 | `https://hyxi-aura.nl/kennis/prijs-en-installatie/` | Prijs, kosten en installatie |
| 2 | `https://hyxi-aura.nl/kennis/bestaande-zonnepanelen/` | HYXI AURA bij bestaande PV |
| 2 | `https://hyxi-aura.nl/kennis/garantie/` | Fabrieksgarantie BAT-Q9, HSA2, HTA2 |
| 2 | `https://hyxi-aura.nl/kennis/bat-q7-vs-bat-q9/` | Nominale versus bruikbare kWh |
| 2 | `https://hyxi-aura.nl/kennis/noodstroom/` | ATS, back-up, stroomuitval |
| 2 | `https://hyxi-aura.nl/kennis/1-fase-of-3-fasen/` | HSA2/HTA2 fasekeuze |
| 2 | `https://hyxi-aura.nl/kennis/installatiecheck/` | Aansluiting/voorbereidingscheck |
| 3 | `https://hyxi-aura.nl/bronnen/` | Verifieerbare datasheets en transparantie |
| 3 | `https://hyxi-aura.nl/privacy/` | Persoonsgegevens en verwerkingsinformatie |

De sitemap staat al in `robots.txt`; geen tweede sitemap, een netwerk van eigen domains of `noindex`-schakelaars nodig.

## 3. Enige nu blokkerende handeling: eigenaar verifieert Google-domeinproperty

1. Open **[Google Search Console](https://search.google.com/search-console)** onder het Google-account waarin je HYXI AURA wilt beheren. Klik **Property toevoegen** en selecteer **Domein**.
2. Vul **`hyxi-aura.nl`** in, **zonder `https://` of `www.`**. Neem bij bestaande property eerst de details door, zodat niet onnodig een tweede property wordt aangemaakt.
3. Google toont een unieke **DNS TXT-verificatiewaarde** die begint met `google-site-verification=`. Deze waarde kan *alleen Google zelf* voor dat account uitgeven; verzin haar niet en publiceer haar niet in GitHub. Laat de Google-verificatiepagina open.
4. Controleer waar de **actieve authoritative nameservers** staan. Alleen wanneer Hostinger de actieve DNS-provider is: in **Hostinger hPanel → Domains → DNS → hyxi-aura.nl → DNS-records**, nieuw record `TXT`, **Naam `@`**, **Waarde = letterlijk Googles gegeven volledige tekenreeks**, **TTL = standaard**. Laat bestaande TXT/SPF, MX en overige records ongemoeid; voeg de extra verificatie-TXT toe.
5. Wacht tot Google het record kan zien, klik in Google Search Console op **Verifiëren**. Laat het record daarna staan. DNS-propagatie kan minuten tot een dag of langer duren. Als nameservers extern staan, moet het TXT-record juist daar worden ingevoerd.
6. In de geverifieerde property: **Sitemaps → Nieuwe sitemap toevoegen → `https://hyxi-aura.nl/sitemap.xml` → Verzenden**. De ontvangst van de sitemap is geen indexatiegarantie.

Documentatie: [Google: Domeinproperty en verificatie](https://support.google.com/webmasters/answer/9008080?hl=nl-NL), [Google: Sitemap indienen](https://support.google.com/webmasters/answer/7451001), [Hostinger: TXT-record DNS](https://www.hostinger.com/support/1583664-how-to-manage-txt-records-at-hostinger/), [Hostinger: Search Console-koppeling](https://www.hostinger.com/support/3692620-how-to-add-a-domain-to-google-search-console/).

## 4. Eerste monitoring na verificatie

1. **Sitemaps:** controleer dat `/sitemap.xml` bij Google als ingediend en opgehaald wordt gezien; kijk na crawl naar eventuele errors/warnings en het aantal gedetecteerde URL's.
2. **URL Inspectie:** begin bij de vier P1-URL's hierboven; inspecteer daarna alle dertien. Noteer per pagina **Google-selected canonical, user canonical, last crawl, page fetch, robots state, indexed/not indexed, reden**. Gebruik **Test live URL** om actuele technische fetch te controleren als Google nog geen crawlresultaat heeft.
3. **Request indexing:** alleen waar nodig voor een belangrijke, niet-geïndexeerde canonical; niet voor iedere kleine wijziging herhaaldelijk aanvragen. Sitemap + interne links ondersteunen verdere ontdekking.
4. **Performance:** zodra data beschikbaar komt queries, klikken, vertoningen, CTR en gemiddelde positie beoordelen per onderwerp. Niet concluderen dat nul impressions direct een SEO-fout is bij een nieuwe/ongecrawlte site.
5. **Privacy/aanvragen:** laat publiek analytics- en Odoo-ontwerp afzonderlijk door de eigenaar goedkeuren. Bestaande offerte/adviesflow werkt; geen extra synthetische leads versturen om indexering te testen.

## 5. GO/NO-GO

**Technische crawler-ready site:** **GO** op basis van publieke HTTP- en HTML-/CI-controles.  
**Google-property verified:** **NIET BEVESTIGD**; controleer bij de eigenaar of de property al bestaat, anders moet de eigenaar Google DNS-verificatie uitvoeren.  
**Sitemap in GSC submitted:** **OPEN**, na verificatie.  
**Google-indexatie bevestigd:** **OPEN**, uitsluitend via echte Google URL Inspection.  
**Optionele parked-domain redirects:** **OPEN, niet blokkerend**; raadpleeg Hostinger-domeinbeheer.  
**Grootschalige commerciële launch:** apart te beoordelen op echte mobiele Safari-eigenaarscore ≥9/10, sales-SLA en privacyvriendelijke conversiemeting.

**Volgende agent:** gebruik dit bestand als startdossier en voer geen nieuw SEO-redesign of dubbele modelsites uit. Haal eerst het concrete Google-verificatiestatus/resultaat op, dien de bestaande sitemap daarna in en archiveer de 13 echte inspectieresultaten. Werk nooit met verzonnen Google-crawlstatus.
