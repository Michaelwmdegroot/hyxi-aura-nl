# HYXI AURA — Hero V5 | Invisible three-zone product viewer

**Datum:** 16 november 2026 · **Ontwerpbesluit eigenaar:** hero-kleuren, compositie, GSAP en productbeelden blijven. Haal het zwevende blok links van de batterij compleet weg, inclusief alle instructieteksten. Bezoekers moeten de kijkhoeken direct via de batterij zelf kunnen ontdekken.  
**GitHub:** `Michaelwmdegroot/hyxi-aura-nl` · **PR:** volgt · **Issue:** #6 · **Branch:** `feature/hero-v5-invisible-three-zone-viewer`  
**Basis:** V4 `main=534699d1062d6105279c2260fd2019905ede86db`, 3/3 CI, 11/11 public readiness.

## 1. Visuele afspraken

- **Verwijder volledig** `.hero-view-switcher` (drie knoppen, kader, omranding, indicatoren), ook de regel **"Beweeg voor een andere kijkhoek"**. Geen vervangende zichtbare legenda, pijlen, stippen, badges of hover-instructie.
- De originele productfoto's, GSAP-orbit, voetlijn, halo, sokkel, twee witte informatiekaartjes, copy, CTA's, typografie, kleuren en de tweeregelige TBT-branding blijven ongewijzigd. Geen ander redesign.
- **Start altijd in vooraanzicht.** Een cursor bij de batterij moet direct het juiste echte kijkhoekbeeld aansturen zonder buiten het plaatje een aparte interactieknop te hoeven zoeken.

## 2. Interactieve zones — gebaseerd op de zichtbare batterijbreedte

De foto heeft transparante canvasmarges; dus gebruik **niet** de volledige 440px brede stage als maatstaf voor de zone. Gebruik het **daadwerkelijke zichtbare vooraanzicht-silhouet**, dat in het huidige ontwerp uit de fabrikantfoto 699:1000 ontstaat:

`productWidth = zichtbareProductHoogte × 699/1000`.

Gebruik `stageCenterX` als producthart en definieer `u = (cursorX - (centerX - productWidth/2))/productWidth`. Klem `u` in [0,1]. Drie zones:

| Zone | Deel van zichtbare batterijbreedte | Weergave |
| --- | --- | --- |
| Links | 0% tot **34%** | `aura-side.webp` / linkerhoek |
| Midden | **34% tot 66%** | `aura-front.webp` / vooraanzicht |
| Rechts | **66% tot 100%** | `aura-angle.webp` / rechterhoek |

De middelste band is bewust **32% van de fysieke productbreedte**, dus niet één pixel of een onbereikbaar nulmoment. Bij een zichtbare batterij van 294px breed is dat circa **94px middenzone**; bij 197px breed circa **63px**. Deze drempels werken proportioneel op desktop/tablet/mobiel. Voor zone-overgangen geldt een **smalle 2,5%-hysterese** om flikkeren precies op de grens tegen te gaan: een foto blijft tot de cursor duidelijk in de volgende zone staat.

**Cruciaal gedrag:** de **doelfoto volgt de actuele cursorzone**, níet de geanimeerde/achterlopende GSAP-orbitpose. GSAP verzacht alleen de micro-perspectiefbeweging en crossfade. Dit voorkomt dat een bezoeker links staat terwijl nog even een onlogische voor-/rechterweergave zichtbaar is.

- Muis links = linkerhoek; muis midden = front; muis rechts = rechterhoek. Bij bewegen van links → midden → rechts is dat de vaste volgorde. Een snelle omkering toont de laatst gekozen zone, nooit een verouderde foto van een vertraagde fetch.
- Als de cursor de gehele hero-productzone verlaat, beweegt de pose rustig naar nul en verschijnt weer het **standaard vooraanzicht**. Op mobiele aanraking blijft de gekozen foto staan tot een volgende tap/swipe.
- Er zijn géén zichtbare instructies of knoppen.

## 3. Toetsenbord / mobiel zonder zichtbare knoppen

Een puur hover-gedreven viewer sluit toetsenbordgebruikers uit. Maak daarom de **productstage zelf focusbaar** en geef hem tijdens JavaScript-uitvoering semantiek van een **3-positieslider**:

- `role="slider"`, `tabindex="0"`, `aria-valuemin="0"`, `aria-valuemax="2"`, `aria-valuenow="1"`, `aria-valuetext="Vooraanzicht"`, beschrijving alleen voor schermlezers.
- Pijltje links/rechts gaat langs [linkerhoek, front, rechterhoek]. Home = linkerhoek, End = rechterhoek. Visuele focusindicator alleen bij `:focus-visible`.
- Mobile: tik **links / midden / rechts op het product** = die hoek; horizontale swipe = vorige/volgende; verticaal scrollen mag nooit worden onderschept. Geen zichtbare controls.
- Geen JS: laat exact de originele HYXI-frontfoto zien (geen focusbaar defect control). Geen GSAP: keyboard/tap/swipe blijven bruikbaar. Reduced motion: geen automatische muisbeweging; toetsenbord en tap/swipe blijven bereikbaar.

## 4. Werkgrenzen

**Wel:** `index.html` (selector geheel weg, onzichtbare screenreaderhulp), `src/product-gallery.mjs` (zonekeuze + focus + tap), `src/hero-viewer.css` (alleen cleanup/focus), `tests/browser.mjs`, `tests/hero-viewer-browser.mjs`, `scripts/probe-production.mjs`, `tests/probe-production.test.mjs`, bron-/release-documenten.

**Niet:** fabrikantfoto's, GSAP-pin, z-schaal, body-height/silhouettekalibratie, visual identity, copy/CTA, Three.js-energy experience, andere product/kennisroutes, database, SMTP, Odoo, Beheer, account of analytics.

## 5. Acceptatie / GO–NO-GO

- [ ] Screenshot: **geen linker instructieblok** op 1440/768/390/320; geen lege ruimte of oude CSS overlay.
- [ ] Bij begin vooraanzicht; exact linker/midden/rechterzone gebaseerd op **zichtbare productbreedte**, middenband breed genoeg (32%).
- [ ] Mouse van linkerkant → middenband → rechts geeft exact linker → voor → rechter beeld; snelle omkering, hysterese, cursorleave → front.
- [ ] GSAP voortgezette zachte micro-orbit en positioneel onveranderde foto's, geen schaal-/voetlijnsprongen, geen onbedoelde echte 360°-claim.
- [ ] Slider met toegankelijk naam/waarde, toetsenbord, mobiel 3-zone tap en swipe, no-JS/no-GSAP/reduced-motion.
- [ ] Alle bestaande advies-, offerte-, Beheer-, SEO-, WebGL/SVG-, MySQL-CI en mobiele WCAG A/AA + Lighthouse groen.
- [ ] Green PR-head 3/3 CI vóór merge; Hostinger public readiness 11/11 met aangepaste V5-check nadat deployed (read-only, geen echte lead).
- [ ] Eigenaar beoordeelt zelf op Safari/macOS en iPhone; geen 9/10 zonder expliciete review.

## Verificatie

Vul na implementatie exacte GitHub-PR, commit, CI-screenshots, browserlog, production probe en eventuele acceptatiegrenzen hier aan. Commerciële launch blijft losstaand NO-GO tot volledige eigenaar- en salesbeoordeling.

## Feitelijke release en acceptatie — 16 november 2026

**Gebouwd, getest en live:** [PR #39](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/39) is gemerged op `main` als **`2b1e3332ac30989a459c68417f76d1ea217dc11e`**. De zelfstandige kijkhoekselector, de drie knoppen én alle zichtbare muisinstructies zijn uit de homepage-HTML verwijderd; de foto is nu zélf de driezone-bediening. De instructietekst voor een schermlezer is verborgen, de daadwerkelijke batterij is een focusbare aria-slider voor toetsenbordgebruik.

**Exact technisch bewijs:**
- [Finale PR-head Build & verify 43929039718](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43929039718) **3/3 groen**: Hostinger-only install, Node 24, alle unit/static checks, isolated MySQL/outbox, volledige adviezen-/offerte-/Beheer-browserjourneys, Three.js/SVG fallback, nieuwe 3-zone browser-QA en Lighthouse.
- [Post-merge main Build & verify 43929956182](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43929956182) eveneens **3/3 groen**.
- [Publieke Hostinger-readiness 43929956171](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43929956171): na een eerste **10/11** tijdens uitrol (oude V4) een read-only rerun van **11/11 PASS**, inclusief `heroTbtShowroomDeployed` met **`data-aura-zone-viewer`**, `aura-viewer-help` en **afwezigheid `.hero-view-switcher`**. Geen live testlead of mail verzonden.
- [Browser screenshots bij PR-head 43929039718](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43929039718): `phase5-hero-1440-page.png`, `phase5-hero-390-page.png`, kalibratiefoto's voor 1440/768/390/320 en alle drie hoeken. Visuele review bevestigt dat het linker blok **volledig verdwenen** is en dat de bestaande hero-compositie, TBT-tweeregel en officiële productfotografie behouden zijn.
- Browserlog: `PASS left/middle/right product zones, GSAP orbit, center band and front reset`, `PASS mobile swipe and left/middle/right tapping`, `PASS reduced motion`, `PASS no-GSAP fallback`, `PASS image failure` en `PASS no-JS front fallback`. Vier breedtes houden de zichtbare top, midden, voetlijn en producthoogte binnen de bestaande **3,5px-tolerantie**, zonder documentoverflow en met WCAG A/AA.
- Synthetische CI-Lighthouse: **desktop en mobiel 100/100/100/100** (performance/toegankelijkheid/best practices/SEO). Dit is **geen** echte Safari-field-data of kwalitatieve eigenaarsscore.

**Open kwaliteitsreview:** opdrachtgever heeft V4 als **beter maar nog onvoldoende** beoordeeld; de nieuw gebouwde V5 wacht op de eerste eigenaarbeoordeling op desktop én iPhone Safari. De commercieel afgesproken **≥9/10** is niet bewezen of afgevinkt. Aanpassingen in de exacte breedte van het middengebied alleen na eigenaarreview; géén zichtbare selector of nieuwe 3D-claim introduceren.

**Behoud:** GSAP 3.15.1 blijft lokaal gepind, alle originele WebP-batterijbeelden en hun kalibratie intact, alle CTA's, kleuren, overige secties, privacy, database, e-mail, Odoo-import en Beheer ongewijzigd. Rollback van deze feature met een revert van de #39 squash; geen migraties.
