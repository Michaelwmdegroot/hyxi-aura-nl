# HYXI AURA — iPhone voordeelkaarten hersteld

**Datum:** 20 november 2026 · **Scope:** alleen de drie voordelenkaarten op de homepage.

## Bron van het probleem
Bij maximaal 700px werd de oorspronkelijke `src/styles.css`-basis als CSS Grid getoond met expliciete rijen `36px 25px auto auto 1fr`. De grote tweeregelige kop stond hierdoor in een rij van **25px**, waarna de paragraaf de kop kon overlappen. Een latere `src/editorial-polish.css`-override gebruikte al flexbox, maar die mocht niet nodig zijn om de basislayout correct te maken. De gebruiker bevestigde via drie screenshots de overlap in ‘Back-up is ingebouwd’, ‘Slim laden’ en ‘Een gerust gevoel thuis’ op echte iPhone Safari.

## Wijzigingen
- Mobiele kaarten in de **basisstylesheet** omgezet naar flexbox met natuurlijke hoogte, zonder vaste gridrijhoogten.
- Mobiele koppen en beschrijvingen staan in normale documentvolgorde met expliciete tussenruimte.
- Back-upillustratie en energiechart krijgen normale ruimte onder de tekst; geen tekst op illustraties.
- LiFePO4-orbit op mobiel uit de absolute positionering gehaald en achter de beschrijving geplaatst.
- De latere editorial-stylesheet gebruikt dezelfde flexindeling als extra bescherming.
- Playwright regressiecheck op 390px en 320px toegevoegd: controleert de werkelijke bounding boxes van icoon, titel en beschrijving. 
- Geen verandering aan de desktopindeling, kleuren, officiële productafbeeldingen, aanbod, backend, SEO-routes of CTA-tekst.

## QA en publicatie
Zonder GitHub Actions (minuten op). Lokale/statische controle: geen vaste gridrijen meer op mobiel, hele kaart blijft flexibel bij grotere fonts. Run in eigen Node24-omgeving:
`npm run build && npm test && npm run check && PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:browser`.
Controleren op een echte iPhone Safari na Hostinger-deploy blijft nodig. Push naar `main` met `[skip ci]` en aparte visuele eigenaarreview.
