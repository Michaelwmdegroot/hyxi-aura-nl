# HYXI AURA — laatste redactionele polish, Footer TBT-first en back-up USP

**Datum:** 16 november 2026 · **Branch:** `feature/hero-v6-editorial-polish` · **Issue #6** · **Status:** gespecificeerd vóór implementatie.  
**Designbesluit eigenaar:** huidige premium kleuren, hero-productviewer en globale compositie behouden. Het doel is echte human-made rust: geen overbodige ‘AI landing page’-elementen en geen HYXI-corporate branding in de footer. De ingebouwde noodstroomfunctie beter vindbaar en begrijpelijk, zonder overselling.

## Aanpak

1. **Hero / micro-labels:** verwijder het decoratieve bolletje + `HYXI AURA · MODULAIRE THUISBATTERIJ`; geen vervangende capsule/kicker. Verwijder het overbodige ‘ALL-IN-ONE ENERGIEOPSLAG’-wijslijntje en het fictieve scroll-label. Behoud headline, echte batterijfoto's, GSAP-3-zones, halo, podium en warme CTA's. De inhoud van de resterende productkaart mag concreter de **ingebouwde ATS** uitleggen zonder extra claim.
2. **Pagina-interne redactie:** vijf sectiekoppen krijgen geen genummerde cirkels of grote generieke uppercase kreten; hun eigen sterke H2's en beschrijvende alinea's blijven. De oefenscene blijft met eigen drie werkende scenario's; verwijder de kunstmatige `SCENARIO XX / 03` microcopy en decoratieve live-dot. In de configurator vervang `LIVE` door een feitelijk label zoals `Indicatieve opstelling`. Schoon de benefitkaart-kickers en de twee kenniskaart-indices op. Geen lege ruimte of ongewilde lay-outwissel.
3. **Klantrol/brand:** footer gebruikt dezelfde **Thuisbatterij Team / presenteert HYXI AURA** woordmerkcombinatie als de header. Maak de footer een rustig redactioneel slot met de bedrijfs-/contactgegevens van Thuisbatterij Team en NIVO, de privacy- en kennislinks en de expliciete niet-officiële HYXI-fabrikantdisclaimer. **Geen** fictief nieuw grafisch logo of claim van officiële HYXI-dealerstatus. Ook de oude oranje ‘HYXI’-circellogo rechts/links verdwijnt uit de footer.
4. **Back-up in één blik:** vooraan in de herojourney de USP `Geïntegreerde ATS` / `Back-up bij stroomuitval` zichtbaar maken. Bij de drie producteigenschappen wordt back-up directer geformuleerd. De bestaande back-upkaart krijgt de begrijpelijke kop `Back-up is ingebouwd`, een korte uitleg waarom dat handig is en een link naar de bestaande brongetrouwe noodstroomgids. We laten de `Stroomuitval`-scenariofunctie en datasheets/FAQ intact, zodat bezoekers kunnen doorklikken en verder onderzoeken.
5. **Geen ‘whole-home guarantee’:** officiële HYXI AURA-productpagina vermeldt een geïntegreerde ATS zonder losse gateway, voorlopige datasheet V2.1 noemt 0ms en 63A doorlaatstroom. De aangesloten groepen, beschikbare energie, omvormer, reserve en installatiewijze blijven bepalend. Geen impliciete 63A batterij-output, vaste back-upduur, belasting van alle apparaten of vaste omschakeltijd claimen. `docs/PRODUCT-SOURCES.md` en `/kennis/noodstroom/` blijven bron voor dit onderscheid.

## QA en niet-aanraken

- Geen wijzigingen in `server/`, MariaDB, Beheer, SMTP/outbox, mail→Odoo, persoonsgegevens of automation. Geen extra live testleads.
- Preserveer bestaande HTML IDs en publieke links voor SEO/schema, configurator, scenario, aanvraagdialog en navigatie. Valideer alle handmatig getoonde claims tegen fabrikantbronnen (https://www.hyxipower.com/nl/ProductsDetail/hyxi-aura).
- CI-browsertests op 1440/390 en hero-visual op 1440/768/390/320. Geen horizontaal scrollen, geen overlap, correcte footer-merkvolgorde, zichtbare back-up USP én technische beperking, 3 werkende energiescenario's, snelle mobiele formulierflow, keyboard, WCAG A/AA en SVG-fallback.
- Documenteer vóór merge feitelijke screenshot- en CI-checks, exact PR-head, en ná merge main CI en echte 12/12 GET-readiness (oude 11 checks plus V6-editorialcontrole). Onder voorbehoud van eigenaarsscore en echte Safari; geen 9/10 claim zonder akkoord.

## Voor/na en open doel

De oorspronkelijke kleurstijl en hero blijven herkenbaar; het bovenste vak en de footer vormen één betrouwbare commerciële merkhiërarchie. De USP moet opvallender en informatiever worden, niet overschreeuwd. De rest van de commerciële launch-checklist blijft in `docs/LAUNCH-READINESS-2026-11-16.md` en masterissue #10.

**Releasestatus is hieronder aangevuld met exacte, controleerbare tests.**

## Uitgevoerde V6-release — technisch bewezen (16 november 2026)

**[Feature-PR #41](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/41)** is geslaagd na de eigenaarsspecificatie, gemerged in `main` als **`a4b46d299c16d2fb7dbbcc3748f22ac58f44a1e5`**. **Live:** https://hyxi-aura.nl/.

### Visuele en redactionele wijzigingen

- Hero-bolletje + `HYXI AURA · MODULAIRE THUISBATTERIJ`, merkloze `ALL-IN-ONE ENERGIEOPSLAG`-pointer en pseudo-scrolltekst verwijderd; géén vervangende decoratieve stempels. De bestaande heroheadline, CTAs, GSAP-3-zones en officiële productfoto's blijven.
- Vijf grote genummerde sectie-kickers, onnodige `SCENARIO 01 / 03`-aanduiding, de onnodige LIVE-dot en meerdere uppercase microkoppen op voordelen en contentblokken verwijderd; alle echte heading-IDs, tabellen, scenario's en aanvraaginteracties werken.
- Nep `N`-badge uit exploitantbewijs verwijderd; de echte NIVO Groep Holland B.V.- en Thuisbatterij Team-rollen blijven zichtbaar en juridisch correct omschreven.
- **Footer:** typografische TBT-first lockup `Thuisbatterij Team / presenteert HYXI AURA` met kleuraccent en dezelfde twee-regelige merklogica als de header; oude cirkel/HYXI-corporate footerlogo vervangen. Contact, adres, KvK, privacy, productbronnen en HYXI-disclaimer blijven.
- **Back-up USP:** op de rechterzijde van de hero `Back-up ingebouwd / Automatische ATS-omschakeling`. Ook de kleine USP-rij onder de hero noemt ingebouwde ATS. De grotere voordelenkaart legt uit dat volgens HYXI **geen aparte back-upgateway** nodig is, maar dat de installateur groepsindeling en leverbaar vermogen beoordeelt; link naar `/kennis/noodstroom/`. Geen toezegging van universele whole-home-backup, 63A-batterijvermogen, 0ms-garantie of vaste accuduur.

### Bevestigde productie en QA

- [PR-head Build & verify 43938494028](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43938494028) **3/3 groen**; [post-merge main CI 43939496666](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43939496666) **3/3 groen**.
- [Publieke Hostinger-readiness 43939496350](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43939496350) **12/12 PASS**, inclusief de nieuwe `editorialBrandAndBackupDeployed` op de live homepage, eerdere productviewer, intake/quote/SEO-gidsen en unauthenticated Beheer 401. GET/read-only; **geen** echte testlead of SMTP verzonden.
- Playwright-browsersuite desktop 1440/mobile 390 plus 320/768, professionele footer-screenshot voor beide breedtes, vereiste CTA's en back-uptekst/voorwaarden, geen horiz. overflow, axe WCAG A/AA en alle Q7/Q9/Three.js/SVG/lead-journeys. Hero-calibratie 1440/768/390/320 met oorspronkelijke drie officiële beelden en exacte V5-3-zones.
- Browserartifact `browser-verification-43938494028-1` bevat `desktop-page.png`, `mobile-page.png`, `desktop-footer-polish.png`, `mobile-footer-polish.png`; bij handmatige visuele beoordeling zijn de rust in de hero, de merkconsistentie en de prominentere back-upkaart bevestigd. [Acties/artefacten](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43938494028).
- CI-Lighthouse op PR-head **desktop 100/100/100/100 en mobiel 100/100/100/100** (synthetische performance/a11y/best-practices/SEO); geen claim over Safari-velddata.
- Tijdens QA zijn twee concrete regressies hersteld vóór merge: mobiele FAQ-kop op 320px (zichtbare 40px overflow door ontbrekende woordspatie) en een Playwright-selector die na introductie van het nieuwe footerlogo twee merklinks matchte. Deze problemen zijn niet weggemasseerd met een overflow-hide op de pagina.

### Herkomst en behoud

HYXI AURA fabrikantpagina <https://www.hyxipower.com/nl/ProductsDetail/hyxi-aura> bevestigt geïntegreerde ATS zonder aparte gateway. De voorlopige V2.1-datasheets en bestaande bronnotities behouden de relevante vermogens-/laadreserve-voorwaarden. Geen nieuwe garanties, logo-asset of fabrikantpartnerstatus geclaimd. Geen wijziging aan storage/Beheer/SMTP/Odoo/backups/SEO-kennispagina's of originele productfoto's.

**Nog OPEN:** eigenaarsscore van deze V6, echte mobiele Safari-review en commerciële leadgen-launchtaken in `docs/LAUNCH-READINESS-2026-11-16.md`. Technisch geslaagd **is niet automatisch 9/10**.
