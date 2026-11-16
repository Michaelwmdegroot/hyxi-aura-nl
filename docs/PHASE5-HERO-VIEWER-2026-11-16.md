# HYXI AURA — Hero V3: Thuisbatterij Team als afzender en nauwkeurig uitgelijnde productviewer

**Opdrachtgeverakkoord:** 16 november 2026. **Project:** https://hyxi-aura.nl, **GitHub:** `Michaelwmdegroot/hyxi-aura-nl`, **Issue:** #6. **Branch:** `feature/phase5-hero-tbt-product-viewer`.  
**Bestaande designbaseline:** eigenaar herwaardeert de huidige homepage als ongeveer **7/10**. Doel is gericht verfijnen, niet het huidige ontwerp vervangen; uiteindelijke acceptatie ligt bij de eigenaar.

## 1. Bindende ontwerpbesluiten

1. **Header linkerboven:** vervang de HYXI-corporate-achtige markering door een typografische, drieledige lockup: **Thuisbatterij Team** / *presenteert* / **HYXI AURA**. Thuisbatterij Team is de commerciële aanbieder en adviseur; HYXI is de fabrikant, NIVO Groep Holland B.V. de website-exploitant. De lockup mag niet lijken op een officieel HYXI-dealerkeurmerk of fictief TBT-logo.
2. **Hero voor het overige behouden:** warme gebroken-witte achtergrond, oranje CTA, headline “De zon gaat onder. Jouw energie blijft.”, oorspronkelijke verdeling links tekst / rechts product, rustige cirkels, plinth, CTA's en trustregeltjes. Geen volledige redesign, geen ongeverifieerde teksten/productclaims.
3. **Productparadepaardje:** drie reeds in het repository aanwezige originele HYXI-aanzichten vormen een **begrensde premium multi-angle** ervaring, niet een misleidende ‘360°’-viewer. Beweeg met muis boven product → andere hoek; klik/tap op zichtbare drie knoppen → direct geselecteerde hoek; mobiel → horizontale swipe óf knoppen. No-JS toont altijd een goed frontbeeld.
4. Geen nieuwe framework- of browser dependency, geen nieuw 3D-model, geen AI-hertekening van fabrikantproduct en geen externe image requests. Alle interactie is een kleine dependencyvrije module.

## 2. Voorbereiding productbeelden en wiskundige uitlijning

De **drie bestaande productbestanden** zijn verschillend gekadreerd. Daardoor lijkt de batterij momenteel plots van formaat te veranderen. Deze fase gebruikt een vaste, **visueel genormaliseerde frame/stage** met per-perspectief gecorrigeerde bronafmetingen en beeldcentra, zonder het originele fabrikantproduct te vervormen of uitsnijden aan de zichtbare silhouetgrenzen.

De volgende gegevens zijn rechtstreeks bepaald op de aan de eigenaar getoonde WebP-bronbestanden (alfa-gebaseerde zichtbare silhouette-bounds; `A >= 220`):

| Aanzicht | Intrinsieke bron | Product x-bounds | Product y-bounds | Producthoogte | Hoogte-factor bronframe | Corrigeer afbeelding x t.o.v. bronmidden |
| :-- | :-- | :-- | :-- | --: | --: | --: |
| Front | 699×1000 | 0–699 | 0–999 | ≈1000 | 1.0000 | 0 |
| Schuin (rechterkant) | 2048×985 | 778–1295 | 1–852 | 851 | **985/851 = 1.1575** | **−0.0147 × zichtbare producthoogte** |
| Andere hoek (linkerkant) | 1875×1000 | 514–1082 | 1–931 | 930 | **1000/930 = 1.0753** | **+0.1500 × zichtbare producthoogte** |

**Renderrecept:** één vaste `hero-product-stage` met hoogte `H`; alle drie zichtbare product-silhouetten krijgen hoogte `H` (en dus dezelfde boven- en voetlijn); de bronafbeelding krijgt `height: H × hoogte-factor`, `width: auto`, positionering `left: 50%` en verschuiving `transform: translateX(calc(-50% + delta × H))`. De `stage` knipt uitsluitend overtollige **transparante broncanvas-marges**, niet de zichtbare batterij. Dit is geometrische normalisatie bij het renderen; de originele pixels blijven intact. Geen aspectratio-stretch; perspectief geeft natuurlijke breedteverschillen.

**Kwaliteitsmeetpunten:** bij wisselen behouden hoofdbehuizing en voetjes dezelfde verticale ankerlijn; plinth/hallo blijven onbeweeglijk; letterlijke schaalfactoren komen uit brongeometrie, niet ‘op gevoel’. Controleer in echte screenshots op verschillende resoluties. Bij afwijking eerst kalibreren, dan pas accepteren.

## 3. Motion en bediening

- Start **vooraanzicht** in de server-gegenereerde HTML, met `fetchpriority=high`; no-JS hoeft niet te veranderen.
- Lazy-load beide zijdelingse views **op interactie-intentie** (pointer/touch/focus) in het geheugen en gebruik `decode()` om half geladen beelden niet te tonen. De eerste view mag niet naar een lege foto verdwijnen.
- Desktop: horizontale pointerpositie boven de productstage in **drie duidelijke sectoren**: links = linkerhoek, centrum = voorzijde, rechts = rechterhoek. Gebruikers zijn niet gedwongen de muis over de rest van hero te bewegen. Rustige korte cross-dissolve (ca. 160–220 ms) en kleine animatie; geen wiebelen, niet suggereren dat een 3D-object 360° rond kan.
- Debounce/stabilisatie rond sectorgrenzen; onder `prefers-reduced-motion:reduce` **geen automatische hoverrotatie** en onmiddellijke wisseling uitsluitend bij knoppen.
- Mobiel: handmatige native buttons, horizontale veeg met drempel én directioneel filter; verticaal scrollen blijft mogelijk; géén scroll-jacking en touchstart/scroll niet blokkerend.
- Verwijder verouderde inschattingen en onverwachte interactie in overige pagina-elementen; het bestaande aanvraagproces en Three.js-energiescene blijven onaangeraakt.
- Alt-teksten, zichtbare caption, knopstatus (`aria-pressed`), toetsenbordbediening, fallback bij image error, focus en goede aanwijzing “Beweeg over de batterij” / “Veeg voor een ander aanzicht” waar geschikt.

## 4. Bouwscope

**Wel:** `index.html` (header lockup, productstage en bijbehorende hints), `src/styles.css` (alleen afgebakende hero/lockup overrides en responsiviteit), `src/product-gallery.mjs` (multi-angle controller), `tests/browser.mjs` (muis/tap/keyboard/no-JS/reduced-motion, beeld-geometrie en mobiele snapshots), eventueel losse pure JS unit tests, `docs/ASSETS.md`, `AGENTS.md`, issue #6 en deze spec.  
**Niet:** accountbeheer, Beheer, MariaDB, e-mail, Odoo, andere SEO-routes, configurator/back-upmodel, Meta/Google-cookies, HR/leadoperationele instellingen.

## 5. Acceptatie: pas laten reviewen indien toetsbaar

- [ ] TBT is **in één oogopslag** zichtbaar als de afzender; “presenteert HYXI AURA” is helder maar subtiel; NIVO bedrijfsrol blijft correct.
- [ ] Hero-compositie behoudt bestaande rustige kleuren/typografie/CTA's, geen layout shift op 1440/1280/768/390/320.
- [ ] Voor/links/rechts hebben dezelfde **zichtbare producthoogte**, hetzelfde grondvlak, niet ongewild andere schaal; geen (semi)transparante halve afbeelding bij langzaam of snel wisselen.
- [ ] Afbeelding wisselt na muisbeweging over productgebied en na expliciete klik; 3 knoppen behouden waarheid en `aria-pressed`; toetsenbord werkt; edge sectors stabiel.
- [ ] Mobiele swipe werkt, tegelijk native tap; verticaal swipen blijft een scrollhandeling.
- [ ] Bij slechte verbinding en image error blijft de vorige zichtbare afbeelding staan.
- [ ] Bij no-JS blijft één volwaardig productbeeld zichtbaar; bij reduce motion geen automatische motion.
- [ ] CI inclusief WebGL/SVG-fallback, beide leadroutes, Beheer, privacy, MySQL8, SEO/asset checks blijft 3/3 groen; Lighthouse geen wezenlijke regressie; postmerge public-readiness blijft 10/10.
- [ ] Reviewbeelden voor desktop 1440, mobiel 390 en 320 plus links/midden/rechts; **geen** subjectieve eigenaarsscore claimen zonder eigenaar. Productierelease pas na meetbare checks, met gebruikerreview over de stijl.

**Go/no-go bij falen:** geen gewijzigde galerij live zetten als de object-footline, foutafhandeling of responsive kwaliteit niet klopt. Laat reviewer op een eigen branch met CI-screenshots/preview beoordelen of merge nadat volledige acceptatie bewezen is en de gebruiker een publieke URL nodig heeft. Bestaande live 3-knoppenviewer blijft rollback via GitHub-squash revert.

## 6. Bewijslog (aanvullen na uitvoering)

- Documentatie vooraf vastgelegd: deze spec op branch, vóór productiestatements.
- Codebranch, CI, screenshots, eventuele beeldcorrecties en live QA worden later met SHA/run-IDs toegevoegd.
- Echte Salesforce/Odoo-/mailto-leadtests niet opnieuw nodig voor uitsluitend visuele UI-wijzigingen; bestaande stubs testen ongewijzigde journeys.
