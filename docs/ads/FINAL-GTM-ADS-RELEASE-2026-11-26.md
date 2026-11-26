# HYXI AURA — definitieve GTM-, Consent Mode- en Google Ads-release

**Datum:** 26 november 2026  
**Technische status:** GO voor gecontroleerde review  
**Commerciële status:** NO-GO totdat de opdrachtgever expliciet vrijgeeft  
**Website:** https://hyxi-aura.nl  
**Google Ads-account:** `727-613-6831`  
**Campagne:** `Campaign #1` (`24543992772`)

## Besluit

De nieuwe, afzonderlijke HYXI-container is ingericht, gecontroleerd en gepubliceerd. De productiecode gebruikt uitsluitend `GTM-52MBZWSL`; de oude `GTM-KRT2VMF3` staat niet meer in de live frontendbundles. De bestaande Thuisbatterij Team-container is niet geopend, gewijzigd of gepubliceerd.

De website- en meetarchitectuur zijn technisch GO voor eigenaarreview. De campagne blijft **PAUSED** en de commerciële lancering blijft **NO-GO** totdat de eigenaar commerciële vrijgave geeft. Dit document claimt geen bewezen conversiestijging, Google-indexatie, rendabele campagne of echte Ads-conversie: daarvoor ontbreekt nog echte vrijgegeven campagne- en klantdata.

## 1. Uitgevoerde bron- en productiecorrecties

Commit `e91d3d3d725e7465e404cf0bc2e3065461531f11` op `main` bevat:

- `GTM-KRT2VMF3` vervangen door `GTM-52MBZWSL` in de consentpolicy;
- de eventlistener hersteld: `hyxi:lead-accepted` wordt op `window` beluisterd, dezelfde `EventTarget` waarop het event wordt uitgezonden;
- een all-zero Web Crypto fallback maakt geen vaste conversiereferentie meer aan;
- `REQUEST_CHANGED` reset idempotency- en conversiereferenties in advies- en offerteflows;
- browserregressies toegevoegd voor advies, offerte, consent, deny/revoke, deduplicatie, opslagbeperkingen en vijf BAT-Q9-configuraties.

Hostinger heeft deze commit automatisch gebouwd en gepubliceerd in deployment `01a217d4-b81b-7329-924f-4a5d103f3a45` met status `completed` (Node 24, `npm run build`, `server.mjs`). De live homepage en `/offerte/` gaven HTTP 200. De live `navigation-B_FqvPwq.js` bevat `GTM-52MBZWSL` en `hyxi:lead-accepted`; de oude ID is in de gecontroleerde live frontendbundles niet aangetroffen.

## 2. GTM-rechten, configuratie en publicatie

| Onderdeel | Gecontroleerde eindwaarde |
|---|---|
| Account | HYXI AURA Nederland |
| Webcontainer | `hyxi-aura.nl` |
| Container-ID | `GTM-52MBZWSL` |
| Gebruiker | `thuisbatterijteam@gmail.com` |
| Recht | `Publish`, status `Has access` |
| Gepubliceerde versie | Versie 2, `Live`, 26 november 2026 |
| Publicatienaam | `HYXI lead conversion — GTM-52MBZWSL` |
| Oude container | `GTM-KRT2VMF3`, vervangen en niet meer in de websitecode |
| TBT-container | `GTM-KWTJK9SZ`, ongemoeid gelaten |

Gepubliceerde tags:

1. `Google Ads — HYXI lead — confirmed` — Google Ads Conversion Tracking, trigger `HYXI lead success`, custom event `hyxi_lead_success`, Conversion ID `18595797698`, label `3LhMCJC0tr8dEMK1laNF`.
2. `Google Ads AW-18595797698` — Google Ads-destinationtag op `Initialization - All Pages`.

De Ads-tags tonen de ingebouwde consentchecks voor `ad_storage`, `ad_user_data` en `ad_personalization`. Er zijn geen extra consentchecks of PII-velden toegevoegd. De applicatie gebruikt daarnaast `analytics_storage: denied` en bouwt geen remarketing- of GA4-doel in.

## 3. Consent Mode v2 en eventflow

De bestaande privacyvriendelijke Basic Mode is behouden:

| Situatie | Gedrag |
|---|---|
| Eerste bezoek / geen keuze | Alle vier storage-signalen `denied`; GTM wordt niet geladen |
| Accepteren | Alleen `ad_storage` en `ad_user_data` worden `granted`; personalisatie en analytics blijven denied |
| Weigeren | Geen GTM-load en geen leadconversie |
| Intrekken | Consent wordt denied; latere lead-events worden niet opnieuw gemeten |
| Server bevestigt geen aanvraag | Geen intern accepted-event en dus geen Ads-event |
| Geaccepteerde advies- of offerteaanvraag | Eén opaque `hxa_...`-referentie naar `dataLayer`, zonder naam, e-mail, telefoon, postcode, vrije tekst, Odoo- of databasegegevens |

`sessionStorage` bevat uitsluitend de begrensde consent-/attributiestatus en de deduplicatiesleutel. De leadflow zelf blijft onafhankelijk van advertentietoestemming functioneren en de bestaande `leads@` → Odoo-mailimport is niet gewijzigd.

## 4. Tag Assistant-bewijs

Tag Assistant is verbonden met `https://hyxi-aura.nl/` en rapporteerde:

- container `GTM-52MBZWSL` gevonden;
- destination `AW-18595797698` gevonden;
- Google Ads-basistag fired één keer op initialization;
- custom leadtag zichtbaar als `not fired` zolang er geen echte bevestigde lead is aangemaakt.

Dat laatste is bewust: er is geen productie-lead of productie-e-mail verstuurd om alleen een meettag te simuleren. De lokale geïntegreerde browserregressies bewijzen de advies- en offerte-output naar `dataLayer` met toestemming en nul output zonder toestemming. De live GTM-respons gaf HTTP 200 en bevatte de Ads-destination en het nieuwe conversielabel.

## 5. Google Ads-campagne-optimalisatie

De native Google Ads-UI is gecontroleerd in account `727-613-6831`.

| Instelling | Eindstatus |
|---|---|
| Campagne | `Campaign #1`, Performance Max |
| Status | **PAUSED** |
| Dagbudget | **€16,12/dag**, niet gewijzigd |
| Biedstrategie | Maximize conversions |
| Bestaande websiteconversie | `7917640208`, `HYXI AURA — Bevestigde aanvraag`, Primary, one per click, behouden |
| Locatie | Nederland, **Presence: people in or regularly in included locations** |
| Text customisation / automatische tekstvarianten | **Uit** |
| Final URL expansion | **Uit** |
| Nieuwe campagne of conversieactie | Geen |

De asset-optimalisatie-instellingen zijn beoordeeld. Er zijn geen nieuwe advertentiemedia, claims, prijzen, garanties, schaarste- of besparingsclaims toegevoegd. Google’s image- en video-enhancement bleven aan; dit blijft een eigenaarspunt wanneer volledige creatieve pixelcontrole vóór commerciële vrijgave vereist is. De campagne is niet hervat en de bestaande TBT-container/accountscope is niet aangepast.

## 6. Lokale QA

Uitgevoerd met de bestaande Node 24-omgeving en lockfile:

| Controle | Resultaat |
|---|---|
| `npm run build` | PASS |
| `npm test` | **128/128 PASS** |
| `npm run check` | **4.549 statische checks PASS op 30 pagina’s** |
| `npm run test:browser` | PASS met lokale Chrome-binary; advies, offerte, consent, retries, deduplicatie, mobile/narrow/tablet, WebGL-fallback en accessibility groen |
| `git diff --check` | PASS |
| Live homepage en `/offerte/` | HTTP 200 |
| Live GTM endpoint | HTTP 200; nieuwe Ads-destination en label aanwezig |
| Echte productie-lead | Niet uitgevoerd, conform veiligheidsinstructie |

Er is geen nieuwe backend-, database-, SMTP-, Odoo-, authenticatie- of klantgegevenswijziging gedaan.

## 7. Definitief GO/NO-GO

**GO — technisch:** nieuwe GTM-container, eventlistener, Consent Mode, Ads-tagconfiguratie, lokale regressies en Hostinger-uitrol zijn aantoonbaar gecontroleerd.

**NO-GO — commercieel:** de campagne blijft gepauzeerd. Open voor eigenaarbesluit zijn uitsluitend:

- expliciete commerciële vrijgave;
- eigenaarreview van de campagne-assets en eventueel uitschakelen van image/video enhancement als exacte creatieve controle vereist is;
- echte, vrijgegeven campagneverkeer- en conversiedata na activatie;
- de bestaande onafhankelijke ownerreview voor premiumscore en echte iPhone Safari.

Er is geen blocker in de leadflow of een reden om Odoo, SMTP, formulieren of de TBT-container opnieuw te bouwen. Een succesvolle technische tagtest is geen bewijs van een gewonnen CRM-lead of commerciële performance.

