# HYXI AURA — definitieve GTM-, Consent Mode- en Google Ads-release

**Datum:** 26 november 2026  
**Technische status:** GO voor gecontroleerde review  
**Commerciële status:** NO-GO totdat de opdrachtgever expliciet vrijgeeft  
**Website:** https://hyxi-aura.nl  
**Google Ads-account:** `727-613-6831`  
**Campagne:** `HYXI AURA - NL - PMax` (`24543992772`)

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

De privacyfix staat in commit `87bdbd2dc0ab11df7b30993983ead8e2abf9a707` op `main` en is gepubliceerd in Hostinger-deployment `01a217e9-a954-708e-8234-ea6febbff76b` (`completed`). UTM-waarden worden sindsdien niet meer naar `sessionStorage` geschreven of daaruit gelezen; alleen een allowlist uit de actuele URL wordt via same-site interne links doorgegeven.

## 2. GTM-rechten, configuratie en publicatie

| Onderdeel | Gecontroleerde eindwaarde |
|---|---|
| Account | HYXI AURA Nederland |
| Webcontainer | `hyxi-aura.nl` |
| Container-ID | `GTM-52MBZWSL` |
| Gebruiker | `thuisbatterijteam@gmail.com` |
| Recht | `Publish`, status `Has access` |
| Gepubliceerde versie | Versie 3, `Live`, 26 november 2026 |
| Publicatienaam | `HYXI lead conversion — Transaction ID` |
| Oude container | `GTM-KRT2VMF3`, vervangen en niet meer in de websitecode |
| TBT-container | `GTM-KWTJK9SZ`, ongemoeid gelaten |

Gepubliceerde tags:

1. `Google Ads — HYXI lead — confirmed` — Google Ads Conversion Tracking, trigger `HYXI lead success`, custom event `hyxi_lead_success`, Conversion ID `18595797698`, label `3LhMCJC0tr8dEMK1laNF`.
2. `Google Ads AW-18595797698` — Google Ads-destinationtag op `Initialization - All Pages`.

De Ads-tags tonen de ingebouwde consentchecks voor `ad_storage`, `ad_user_data` en `ad_personalization`. Er zijn geen extra consentchecks of PII-velden toegevoegd. De applicatie gebruikt daarnaast `analytics_storage: denied` en bouwt geen remarketing- of GA4-doel in.

Versie 3 bevat de variabele `HYXI conversion ref` (Data Layer Variable v2, naam `hyxi_conversion_ref`). De gepubliceerde leadtag gebruikt `{{HYXI conversion ref}}` als Transaction ID. Conversion Linking staat aan. Daardoor wordt voor zowel advies als offerte dezelfde opaque referentie uit het bevestigde `hyxi_lead_success`-event gebruikt en niet een statische of persoonsherleidbare waarde.

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

De UTM-implementatie gebruikt geen browseropslag meer: `hyxi_campaign_attribution_v1` wordt niet gelezen of geschreven. Alleen `utm_source`, `utm_medium` en `utm_campaign` uit de actuele URL worden allowlisted en naar same-site interne routes doorgegeven. De leadflow zelf blijft onafhankelijk van advertentietoestemming functioneren en de bestaande `leads@` → Odoo-mailimport is niet gewijzigd.

## 4. Tag Assistant-bewijs

Tag Assistant is verbonden met `https://hyxi-aura.nl/` en rapporteerde:

- container `GTM-52MBZWSL` gevonden;
- destination `AW-18595797698` gevonden;
- Google Ads-basistag fired één keer op initialization;
- custom leadtag zichtbaar als `not fired` zolang er geen echte bevestigde lead is aangemaakt.

Daarna is de daadwerkelijk gepubliceerde tag gecontroleerd met een gecontroleerde productie-browserprobe: `/api/config` en `/api/leads` waren lokale stubs en alle Google Ads-endpoints werden vóór verzending afgebroken. Voor zowel advies als offerte werd exact één `hyxi_lead_success`-event gezien. De onderschepte request gebruikte `/pagead/conversion/18595797698/`, label `3LhMCJC0tr8dEMK1laNF`, `oid=hxa_...` als dynamische Transaction ID en de gecontroleerde `gclid`/`gclaw` voor klikattributie. Er is daarmee geen kunstmatige Ads-conversie naar Google verzonden.

Bij de afzonderlijke revoke-probe waren de tags al geladen; na intrekken stond consent op `denied` en bleef het aantal Ads-requests gelijk (`adsBefore=2`, `adsAfter=2`). Een synthetisch lead-event veroorzaakte geen nieuwe meetrequest. Dit bewijst de intrekkingsroute binnen de gecontroleerde browsercontext, niet een commerciële conversie.

## 5. Google Ads-campagne-optimalisatie

De native Google Ads-UI is gecontroleerd in account `727-613-6831`.

| Instelling | Eindstatus |
|---|---|
| Campagne | `HYXI AURA - NL - PMax`, Performance Max |
| Status | **PAUSED** |
| Dagbudget | **€16,12/dag**, niet gewijzigd |
| Biedstrategie | Maximize conversions |
| Bestaande websiteconversie | `7917640208`, `HYXI AURA — Bevestigde aanvraag`, Primary, one per click, behouden |
| Locatie | Nederland, **Presence: people in or regularly in included locations** |
| Text customisation / automatische tekstvarianten | **Uit** |
| Final URL expansion | **Uit** |
| Image enhancement | **Uit** |
| Video enhancement | **Uit** |
| Nieuwe campagne of conversieactie | Geen |

De asset-optimalisatie-instellingen zijn beoordeeld. AI Image Enhancement en AI Video Enhancement staan uit voor maximale controle over de officiële productvisuals. Er zijn geen nieuwe advertentiemedia, claims, prijzen, garanties, schaarste- of besparingsclaims toegevoegd. De campagne is niet hervat en de bestaande TBT-container/accountscope is niet aangepast.

De daadwerkelijke PMax-instelling **Campaign URL options** is read-only gecontroleerd: tracking template leeg, final URL suffix leeg en geen custom parameters. Google Ads voegt op campagneniveau dus geen UTM's toe. De website accepteert en verwerkt uitsluitend de drie ondersteunde velden `utm_source`, `utm_medium` en `utm_campaign` wanneer die in een advertentie-URL aanwezig zijn.

## 6. Lokale QA

Uitgevoerd met de bestaande Node 24-omgeving en lockfile:

| Controle | Resultaat |
|---|---|
| `npm run build` | PASS |
| `npm test` | **129/129 PASS** |
| `npm run check` | **4.549 statische checks PASS op 30 pagina’s** |
| `npm run test:browser` | PASS met lokale Chrome-binary; advies, offerte, consent, retries, deduplicatie, mobile/narrow/tablet, WebGL-fallback en accessibility groen |
| `git diff --check` | PASS |
| Live homepage en `/offerte/` | HTTP 200 |
| Live GTM endpoint | HTTP 200; nieuwe Ads-destination en label aanwezig |
| Gecontroleerde productieprobe | Advies en offerte met lokale API-stubs; Ads-requests onderschept vóór netwerkverzending |

Er is geen nieuwe backend-, database-, SMTP-, Odoo-, authenticatie- of klantgegevenswijziging gedaan.

## 7. QA-incident en begrenzing van het bewijs

De eerste eenmalige live probe is afgebroken door een fout in het Playwright-testharnas: de generieke `**/*`-routehandler stond na de bedoelde `/api/leads`-stub en `route.continue()` liet de request naar productie door. De lokale trace identificeert exact één adviesaanvraag:

- Tijdstip servermail: `2026-11-26T12:54:12.992Z` UTC;
- intent: `advice`;
- profiel: zonnepanelen gepland, 4.200 kWh, back-updoel, 1 fase;
- gekozen verkenning: `1 × BAT-Q9`, `moduleType=9`, `moduleCount=1`;
- UTM: `google / cpc / hyxi_aura_pmax`;
- synthetische identificatiemarker: `Gecontroleerde QA` met uitsluitend `.test`-/dummy-contactwaarden; de exacte contactvelden staan bewust niet in deze publieke repository.

De server heeft deze aanvraag geaccepteerd en een mailreceipt aangemaakt: `AURA-23dd0006-f9f8-49c6-a5e7-0392d93ebe58`. Read-only Hostinger Mail-bewijs toont één bericht in `leads@thuisbatterijteam.nl` INBOX (UID `1365`, `2026-11-26T12:54:13Z`, Message-ID met hetzelfde aanvraagnummer) met de volledige synthetische aanvraag en de verwachte UTM's. Daarmee is **mailbox: AANGETROFFEN** en SMTP/inboxaflevering bewezen. Er is geen echte persoons- of advertentie-informatie gebruikt.

De exacte browser-gegenereerde `Idempotency-Key` en de HTTP-responseheaders zijn niet door de mislukte harness-run gelogd; het aanvraagnummer uit de ontvangen mail is de betrouwbare correlatiemarker. De publieke Beheer-endpoints `/api/beheer/summary`, `/api/beheer/outbox` en `/api/beheer/leads` gaven zonder een bestaande eigenaarssessie `401 LOGIN_REQUIRED`. Er is in deze run geen geautoriseerde Beheer-sessie beschikbaar gesteld: **Beheer/outbox: ONBEKEND**, niet “niet aangetroffen”. Er is geen loginpoging met geraden of nieuwe credentials gedaan. Er is geen geautoriseerde read-only Odoo-connector beschikbaar: **Odoo: ONBEKEND**. De mailboxreceipt is geen bewijs dat Odoo de lead heeft geïmporteerd.

Er is niets verwijderd, gemarkeerd, bevestigd, opnieuw klaargezet of opnieuw verzonden. Er zijn daarna geen live formulier-POSTs of kunstmatige Ads-conversies uitgevoerd. De campagne bleef gepauzeerd.

Voor toekomstige browser-QA is `tests/test-harness-safety.mjs` toegevoegd. Elke testtarget moet een loopback-origin valideren; de fail-closed leadguard blokkeert niet-loopback `/api/leads`-requests vóór verzending. De guard is in de bestaande leadjourney gebruikt en heeft geen productie-POST toegestaan.

## 8. Definitief GO/NO-GO

**GO — technisch:** nieuwe GTM-container, eventlistener, Consent Mode, dynamische Transaction ID, klikattributie, revoke-gedrag, privacyvriendelijke UTM-verwerking, lokale regressies en Hostinger-uitrol zijn aantoonbaar gecontroleerd.

**NO-GO — commercieel:** de campagne blijft gepauzeerd. Open voor eigenaarbesluit en operationele opvolging zijn:

- expliciete commerciële vrijgave;
- geautoriseerde read-only controle in Beheer/outbox en Odoo, of expliciete eigenaaracceptatie van de resterende onzekerheid;
- echte, vrijgegeven campagneverkeer- en conversiedata na activatie;
- de bestaande onafhankelijke ownerreview voor premiumscore en echte iPhone Safari.

Er is geen reden om Odoo, SMTP, formulieren of de TBT-container opnieuw te bouwen. Een succesvolle technische tagtest is geen bewijs van een gewonnen CRM-lead of commerciële performance.

