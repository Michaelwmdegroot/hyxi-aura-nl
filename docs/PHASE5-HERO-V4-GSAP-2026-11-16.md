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

**Alle testresultaten, corrections, PR, merge-SHA en productiecontrole worden na uitvoering ingevuld.**
