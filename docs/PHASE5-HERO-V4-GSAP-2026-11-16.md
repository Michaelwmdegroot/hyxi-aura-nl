# HYXI AURA — Hero V4 | GSAP Orbit & TBT merklockup
**Status:** uitvoeringsspecificatie vastgelegd vóór code · 16 november 2026  
**Website:** https://hyxi-aura.nl · **Repo:** Michaelwmdegroot/hyxi-aura-nl · **Issue:** #6 · **Branch:** `feature/hero-v4-gsap-orbit`

## Opdrachtgeverfeedback

Hero V3 wordt duidelijk beter gevonden, maar **de beweging van de batterij voelt nog niet natuurlijk**. De drie fabrikantbeelden en hun nauwkeurige kalibratie **zijn akkoord**; die bronbestanden en alle silhouetteverhoudingen blijven exact intact. De bestaande warme gebroken witte, zachte groen/oranje uitstraling, headline, CTA, architectuur en achtergrondelementen worden niet geredesignd. De header krijgt twee regels: `Thuisbatterij Team` boven en `presenteert   HYXI AURA` **naast elkaar**, passend binnen de breedte van het TBT-woordmerk.

## Onderzoek GSAP en Three.js, technische keuze

- **GreenSock GitHub:** https://github.com/greensock/GSAP (geverifieerde officiële bron). GSAP core 3.15.1; exact artifact `greensock/GSAP` `dist/gsap.min.js` (Git-blob `c6d5f8578c41d46a6624e94aaa44b8b9ef779461`); standaard niet-betalende licentie voor commercieel websitegebruik: https://gsap.com/standard-license/. Behoud de auteurs-/licentiekop.
- **Officiële API's:** https://gsap.com/docs/v3/GSAP/gsap.quickTo()/ voor continu gesmoothte muisposities zonder eindeloze tweens; https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/ voor media-/reduced-motion-regels.
- **Three.js:** de huidige energievisualisatie gebruikt al Three.js, maar een werkelijk draaiende HYXI-batterij vergt bruikbare 3D-geometrie (GLB/CAD/model) en materiaaltexturen. Drie foto's zijn **geen** 3D-asset. CSS3DRenderer past alleen 3D-transformaties toe op DOM-elementen, geen geometrie (https://threejs.org/docs/pages/CSS3DRenderer.html). Het zou een onrealistisch roterend fotovlak opleveren. Daarom **geen gefingeerde 360° of halfbakken 3D-mesh**.
- **Gekozen implementatie:** GSAP-gebaseerde **inertiële 2.5D orbit viewer**. Eén lokaal bij de applicatie geserveerde exact gepinde GSAP core (geen externe runtime CDN, geen nieuwe npm-install/lockfile). Behoud alle originele WebP's en de bewezen CSS-alignment.

## Beoogd gevoel en gedrag

1. **Continuous pointer input:** over de batterij beweegt het product **continu en rustig** een klein aantal graden in perspectief. De virtuele pose loopt met easing achter de cursor aan (geen abrupte drie vakken). Subtiele x/rotationY/rotationX op een **nieuwe binnenste pivot**, zodat de reeds perfect gekalibreerde afbeeldingen en hun baseline onaangetast blijven. Achterliggende halo en schaduw bewegen zeer licht mee.
2. **Hoekwisseling:** op de feitelijk beschikbare linker-/voor-/rechterkijkhoeken, wanneer een gesmoothte pose de grens bereikt (met hysterese tegen flikkeren). **GSAP-gestuurde korte cross-dissolve, zonder springende schaal of plaatsing**. Snelle omkering toont altijd het laatst geldige zicht; onvoldoende/kapotte nieuwe foto vervangt nooit een werkend beeld.
3. **Fysieke rust:** op loslaten van de muis vloeit de pose terug naar nul/vooraanzicht; geen automatisering die onbeheerst blijft doorgaan. Bij handmatig kiezen blijft de gekozen hoek staan, tot de gebruiker weer over het product beweegt. De schaduwen/halo reageren discreet.
4. **Knoppen en toegankelijkheid:** bestaande drie knoppen blijven direct bruikbaar met muis/toetsenbord/touch, `aria-pressed` en bijbehorende beeld-alt/caption blijven correct. **Niet** eerst laden als de gebruiker geen interesse heeft; beide hoekbeelden pas na intentie downloaden en decoderen.
5. **Mobiel:** horizontale swipe met voldoende afstand en richting; verticaal scrollen nooit kapen; handmatige knoppen blijven de expliciete, betrouwbare bediening.
6. **Reduced motion/no GSAP/no JS:** bij reduce motion **geen automatische orbit** en geen overgangsbeweging, enkel directe knoppen; als GSAP niet laadt, blijven gewone knoppen en basale swipe zonder fout werken; bij no-JS blijft het officiële vooraanzicht.
7. **Brand lockup:** in de header één grote TBT-regel en één rustige subregel `presenteert HYXI AURA`; visueel uitgelijnd onder maximaal de totale breedte van de eerste regel, ook op 390/320 px, zonder overlap van CTA of navigatie. Geen ongeverifieerde partner-/dealerstatus.

## Grenzen

- **Niet wijzigen:** de exacte fabrikantproductafbeeldingen, oorspronkelijke pixelkalibraties, alles onder `server/`, login/Beheer, encryptie, outbox/SMTP, mail→Odoo, privacy, Hostinger-backups, kennis- en offerteflows, gebruikerstracking.
- **Geen echte 3D-claim:** beschrijf het als multi-angle met 2.5D micro-parallax; geen "360° draaien" of fysiek exact model.
- **Geen nieuw extern netwerkverzoek:** GSAP core lokaal gepind en voorzien van licentie/vermelding in documentatie.
- **Performance:** nieuwe GSAP-aanvraag alleen op de homepage; frontbeeld `fetchpriority=high`, zijdelingse views lazy; minimale transform-updates, maximaal twee tegengestelde GSAP tweens tegelijk en niet eindeloos nieuwe tijdlijnen.
- **Robuust:** bij verloren afbeelding of snelle muisinput blijft één actuele, volledige foto altijd zichtbaar, zonder nulschaal/silhouetspong; focus en keyboard blijven intact.

## Acceptatie en release-gates

- [ ] Exact twee regels in de header, tweede regel bevat **beide woorden naast elkaar**, niet drie regels; geen overlap op 1440/768/390/320px.
- [ ] Puur handmatige keuzes blijven top/center/bottom en hoogte exact gelijk (<3,5px afwijking in bestaande browser-Hero-visual QA).
- [ ] Muisscrub is aantoonbaar **vloeiend in numerieke pose**; 3 aangeleverde aanzichten volgen de gesmoothte positie met hysterese en geen ongewenste flicker.
- [ ] Korte gecontroleerde GSAP-dissolve, geen 'dubbelbeeld' dat lang blijft staan; bij snelle tegenbeweging blijft laatste gewenste aanzicht en juiste `aria-pressed`.
- [ ] Mobiele swipe + native tap, verticale scroll ongewijzigd; reduced-motion: geen automatische hoverbeweging; no JS en geblokkeerde GSAP-fallback test.
- [ ] WCAG A/AA, no-overflow, CSS3D fallback, input/Beheer/quote/SEO/MySQL, Lighthouse en static build blijven volledig CI-groen (3/3).
- [ ] Pas na merge en automatische Hostinger-deploy de bestaande 11/11 read-only productiecontroles uitvoeren; geen synthetische CRM-leads.
- [ ] Eigenaar bekijkt de werkelijke desktop- en iPhone-Safari-beweging vóórdat **9/10** of commerciële go-live wordt geclaimd.

## Bewijslog / QA

**Feitelijke test-, PR- en productiegegevens staan hieronder; eerdere planpunten worden als historisch bewaard.**

## 16 november 2026 — eerste geslaagde implementatie- en browsercontrole

**[PR #37](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/37)**, feature `feature/hero-v4-gsap-orbit`. **Exact CI-head-run**: [43921263897](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43921263897) **3/3 success** (production build, isolated MySQL/outbox, browser/Beheer/Lighthouse). Een eerste visuele review van de uit CI gegenereerde beelden `phase5-hero-1440-page.png` en `phase5-hero-390-page.png` bevestigt de nieuwe tweeregelige merkpresentatie zonder overlap en behoud van de rustige hero-compositie.

De browser-output bewijst:
- Vier schermbreedtes **1440/768/390/320**: `PASS hero` (gelijke zichtbare producthoogte, voetlijn en center bij knopselectie, max. 3,5 px afwijking; WCAG A/AA en geen overflow).
- `PASS GSAP eased pointer orbit`: numerieke pose wordt onderweg geanimeerd in plaats van direct naar een vak te springen.
- `PASS reduced motion`, `PASS real mobile horizontal swipe`, `PASS no-GSAP fallback`, `PASS image failure` en `PASS no-JS front fallback`.
- Actuele CI-Lighthouse: desktop **100/100/100/100**, mobiel **99/100/100/100** (performance/a11y/best practices/SEO); geen opvallende regressie. Geen claim over echte mobiele Safari, veldervaring of gebruikerstevredenheid.

De repository heeft nu het officiële **GSAP 3.15.1** core-bestand lokaal onder `public/vendor/gsap.min.js`, inclusief originele licentiekop, Git-object gelijk aan de gecontroleerde GreenSock GitHub-versie. De bestaande afbeeldingen blijven ongewijzigd. Deze eerste QA wordt gevolgd door een extra assertie op GSAP's laatste beeldkeuze en de publieke V4-herkenning; **deze regel beschrijft uitsluitend de eerste vóór-merge QA; de actuele merge- en productieacceptatie staan hier direct onder**.

## Definitieve Hero V4-release — 16 november 2026

**Live en gemerged:** [PR #37](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/37) is met squash gemerged in `main` als **`031b557f216867e32332d2950018c3f136a0b2a8`**. Werkelijke demo: **https://hyxi-aura.nl/**.

**Volledige testgates:**
- [Finale PR-head Build & verify 43922330047](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43922330047) **3/3 groen**; bron-/admin-/API-, Node24/Hostinger, MySQL8, hele website/browser, echte browsergestures, WCAG en Lighthouse.
- [Post-merge Build & verify 43923021215](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43923021215) **3/3 groen**.
- [Public production readiness 43923021021](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43923021021), poging 2 **11/11 PASS** inclusief **`heroTbtShowroomDeployed`**, nu expliciet getoetst op `presenter-subline`, `hero-product-pivot` en lokaal `/vendor/gsap.min.js`. Eerste poging faalde uitsluitend op die hero-check (10/11) omdat Hostinger nog V3 serveerde. De bestaande lead- en securitychecks bleven groen; de tweede run heeft de werkelijke V4 HTML bevestigd zonder lead of mail te versturen.
- Browser op 1440, 768, 390 en 320px: tweede merkregel past onder het hoofdwoordmerk, foto's behouden oorspronkelijke V3-geometrie <3,5px afwijking, geen overflow, A/AA. GSAP `quickTo` geverifieerd via **tussenpose** en complete linker-, front-, rechteraanzichten; snelle pointeromkering blijft bij juiste eindhoek. Mobiele swipe/tap, reduced motion, geblokkeerde GSAP, foutief hoekbeeld en no-JS zijn geslaagd.
- [Finale screenshotartifact bij CI](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43922330047): `phase5-hero-1440-page.png`, `phase5-hero-390-page.png` en alle drie kalibreerde views op vier breedtes. Handmatige inspectie: rustige compositie blijft behouden; de tweede regel vormt één rustige lockup, geen zichtbaar gewijzigd productmodel.
- Final PR-head Lighthouse (synthetische Chromium-test): **desktop 100/100/100/100**, **mobiel 100/100/100/100** voor performance/a11y/best practices/SEO. **Geen** claim van echte veldprestatie of iPhone Safari QA.

**Acceptatie verwerkt in de checklist:** alle functionele, meetbare ontwikkelpunten uit de sectie "Acceptatie en release-gates" zijn via bovenstaande CI en publieke probe afgerond. **Uitzondering blijft de eigenaar-review op een echte iPhone Safari, en de commerciële 9/10-score.** Geen onafhankelijke volledige 3D-opname: officiële driehoekweergave met beperkte 2.5D microbeweging, geen 360° mesh.

**Geen wijziging** aan originele HYXI-fabrikantfoto's, MariaDB, login/Beheer, SMTP/outbox, mail→Odoo, echte klantdossiers of Hostinger-backups. Externe scripts/cookies niet toegevoegd: de originele GSAP-core wordt lokaal geserveerd. Voor rollbacks revert de squash van #37; geen schema-/mail-/beheermutaties nodig.
