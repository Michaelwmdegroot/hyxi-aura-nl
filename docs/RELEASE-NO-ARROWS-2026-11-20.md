# HYXI AURA — sitebreed zonder pijlen (20 november 2026)

Opdrachtgever: verwijder decoratieve pijlen uit de publieke website en de aanvullende zin onder **Offerte voor deze opstelling**.

- Pijl-SVG's bij CTA's en links van de homepage verwijderd. Links, toegankelijke namen en offerte-/adviesacties blijven intact.
- Pijltekens en losse visuele pijlspans verwijderd van homepage, offerte, kennis, bronnen en privacypagina's.
- Dynamische pijl verwijderd bij het terugzetten van de verzendknop in `src/app.mjs`.
- FAQ-bronlinks in `scripts/content.mjs` krijgen voortaan geen pijl meer bij een volgende build.
- Alleen de extra zin `Vrijblijvend advies · prijs en geschiktheid in een persoonlijk voorstel.` onder de offertelink verwijderd.
- Geen aanpassing aan formuliergegevens, offertes, SQL, Odoo, SMTP, productselectie of SEO-routeaantallen.

**Validatie:** handmatige statische controle van 31 publieke routes, controle op geldige SVG-/linkparen, en regressietest `tests/no-visual-arrows.test.mjs` voor de gebundelde productiepagina's. Publicatie met `[skip ci]` om geen GitHub Actions-minuten te gebruiken. Live weergave op Hostinger kan aanvullend handmatig worden gecontroleerd.
