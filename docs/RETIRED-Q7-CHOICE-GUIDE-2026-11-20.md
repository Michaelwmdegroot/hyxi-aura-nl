# HYXI AURA — Q7/Q9-keuzepagina opgeheven

**Datum:** 20 november 2026  
**Besluit eigenaar:** verwijder `https://hyxi-aura.nl/kennis/bat-q7-vs-bat-q9/` uit het publieke aanbod. De site verkoopt uitsluitend vijf BAT-Q9-pakketten.

## Uitvoering
- De HTML-bron `kennis/bat-q7-vs-bat-q9/index.html` is verwijderd.
- De oude route is uit de Vite-build, canonical route-registry en sitemap gehaald: **31 → 30 actieve URL's**.
- De oude route, zonder slash en met `/index.html`, leidt met HTTP **301** naar `/modellen/`, zodat reeds gedeelde of geïndexeerde links niet op een 404 uitkomen. Queryparameters worden behouden.
- Homepage en alle publieke inhoudspagina's linken niet langer naar de Q7/Q9-keuzehulp. Relevante links wijzen nu naar de vijf BAT-Q9-pakketten, het HYXI-modellenoverzicht, de capaciteitsgids of officiële datasheet.
- Fabrikantwaarden over niet-aangeboden BAT-Q7-modules blijven waar nodig in de oorspronkelijke technische documenten en in een uitdrukkelijk niet-commerciële context. Het zijn geen aangeboden pakketten.
- Probes, sitemapvalidatie, metadata-, kennis- en publicatietests verwachten 30 canonieke pagina's en één permanente doorverwijzing voor de vervallen URL.

## Niet veranderd
De vijf verkoopconfiguraties, prijsbeleid, bestaande productbeelden, advies- en offerteflow, Odoo-import, SMTP, database en Beheer blijven ongewijzigd.

## Acceptatie zonder GitHub Actions
Controleer lokaal in Node 24 met `npm run build && npm test && npm run check`; waar mogelijk `npm run test:browser`, `node tests/knowledge-browser.mjs` en `node scripts/probe-production.mjs`. Controleer ook de live Hostinger-status van de 301 en het aantal 30 in `/sitemap.xml`. Een GitHub-commit is géén bewijs dat de automatische Hostinger-deploy al klaar is. Publiceer met `[skip ci]`, omdat het resterende GitHub Actions-budget niet gebruikt mag worden.
