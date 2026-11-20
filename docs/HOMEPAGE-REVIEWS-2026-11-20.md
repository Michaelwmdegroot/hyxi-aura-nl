# Homepage — echte klantbeoordelingen van Thuisbatterij Team

**Datum:** 20 november 2026  
**Doel:** voor de snelle HYXI AURA-lancering de door de eigenaar aangeleverde vertrouwde reviews-layout van de moederwebsite vertalen naar de HYXI AURA premium vormgeving, met echte klantbeoordelingen en correcte bronvermelding.

## Uitvoering
- Homepage `#ervaringen` direct **na voordelen, vóór het brede lifestylebeeld**: rustige lichte achtergrond, links menselijke dienstverlening, rechts een witte Google-beoordelingenkaart met vijf bestaande reviews. Geen carrousel, pijlen, autoplay, plug-in of extra externe scripts.
- De **vijf letterlijke Google-reviewfragmenten** zijn overgenomen uit de door de eigenaar aangeleverde screenshot en uit de live bedrijfswebsite: Jan Molema van der veen, Edwin, Carlos Barbosa, Mateusz Pohl en Lydia Wagenborg.
- Alleen de bedrijfsdienstverlening wordt beoordeeld: expliciet zichtbaar **niet specifiek het HYXI AURA-product**. De getoonde Google-score 5,0/5 is een **gedateerde momentopname op 20 november 2026**, geen live gesynchroniseerde score. Actualiseer/haal weg wanneer deze score verandert.
- CTA's gaan rechtstreeks naar de Google Maps bedrijfsvermelding (op basis van de officiële bedrijfs-Place ID uit de Google-reviewlink van Thuisbatterij Team) en het **juiste Trustpilot-profiel**; niet naar het andere bedrijf thuisbatterij.nl.
- Geen Review- of AggregateRating-structured data toegevoegd. Geen wijziging in mail, Odoo, Beheer, database, privacyprocessen of bestaande productclaims.

## Controleerbare bronnen
- Eigen Thuisbatterij Team-homepage: https://thuisbatterijteam.nl/ — reviewfragmenten en weergegeven Google-score.
- Openbaar overzicht Google-reviews: https://thuisbatterijinstallateurs.nl/installateurs/thuisbatterij-team/ — onder andere Lydia, Carlos en Mateusz.
- Trustpilot-bedrijfsprofiel: https://www.trustpilot.com/review/thuisbatterijteam.nl
- Google bedrijfslocatie Place ID vanuit officiële Google review-link: `ChIJH-saKH_DxUcRaFRACUWqJRo`

## Release en acceptatie
- Nieuwe statische test: `tests/reviews.test.mjs`; controleert bronverwijzing, vijf geselecteerde reviewers, 5 sterren toegankelijk, onderscheid bedrijf/product, en geen reviewschema/tracking.
- De bestaande Chromium/axe- en viewportchecks (1440 / 390 / 320px) blijven verantwoordelijk voor visuele en toegankelijkheidsregressies.
- De 31 SEO-routes uit de al gemergede PR #58 blijven identiek; geen nieuwe URL in de sitemap.
- Vereist: 3/3 groene PR-CI, domeinpreflight, merge naar `main`, daarna groene postmerge-CI, Hostinger live check en eigenaarreview in Safari. Het design is **niet** automatisch 9/10 of commercieel GO verklaard.

## 20 november — afzonderlijke productie-acceptatie na merge
Een 41e read-only productiecheck `customerReviewsDeployed` controleert de echte Hostinger-homepage op de reviewsectie, twee bevestigde namen, momentopname, juiste Trustpilot-bedrijfslink en zichtbare scheiding tussen dienstverlening en product. De bestaande homepage GET wordt tijdens de bounded Hostinger-deploymentretry ook op deze nieuwe marker beoordeeld. Er worden geen externe review-API's, klantenbestanden, formulieren of cookies opgevraagd.
