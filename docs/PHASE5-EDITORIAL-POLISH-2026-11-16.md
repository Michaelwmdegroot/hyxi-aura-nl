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
- Documenteer vóór merge feitelijke screenshot- en CI-checks, exact PR-head, en ná merge main CI en echte 11/11 GET-readiness. Onder voorbehoud van eigenaarsscore en echte Safari; geen 9/10 claim zonder akkoord.

## Voor/na en open doel

De oorspronkelijke kleurstijl en hero blijven herkenbaar; het bovenste vak en de footer vormen één betrouwbare commerciële merkhiërarchie. De USP moet opvallender en informatiever worden, niet overschreeuwd. De rest van de commerciële launch-checklist blijft in `docs/LAUNCH-READINESS-2026-11-16.md` en masterissue #10.

**Releasebewijs wordt na implementatie aangevuld.**
