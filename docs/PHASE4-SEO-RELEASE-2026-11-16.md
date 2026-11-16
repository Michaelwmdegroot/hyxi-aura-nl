# HYXI AURA — Phase 4 SEO-release: twee bruikbare kennispagina's

**Datum:** 16 november 2026 · **Onderwerp:** #7 SEO en een gerichte #6-keuzehulpverbetering  
**PR:** https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/30  
**Branch:** `feature/phase4-seo-knowledge-pages`  
**Productie:** https://hyxi-aura.nl — deployment uitsluitend na groen CI en merge

## Inhoudelijk resultaat

1. `/kennis/bat-q7-vs-bat-q9/`: aparte intentie voor modulekeuze. Bron-backed tabel voor nominaal en bruikbaar kWh, vermogen en gewicht; rekenkundig 1/2/3/6 modules; keuzevragen rondom verbruik, zonnepanelen, opslagdoel en meterkast. Geen rendementsberekeningen.
2. `/kennis/noodstroom/`: aparte intentie voor back-up. Legt verschil uit tussen 0 ms (fabrikantspecificatie), ATS en 63 A doorlaatstroom (géén beloofd batterij-/back-upvermogen); checklist met faseverdeling, vermogenslimiet, reserves en PV-aansluiting.
3. Beide: geen gekopieerde fabrikantcopy, eigen editorial ontwerp, zichtbare nuance bij voorlopige datasheets, bronlinks en herkomst NIVO/Thuisbatterij Team, CTA naar bestaande configurator en `/offerte/`.
4. Bestaande homepage: twee inhoudelijke keuzehulpkaarten, extra nav/footerlinks; rustiger en meer controleerbare uitleg vóór een aanvraag. Bestaande Three.js, SVG-fallback en CTA's ongemoeid gelaten.

## SEO en technische verwerking

- Vite `rolldownOptions.input`: twee nieuwe statische routes naast de oorspronkelijke vier.
- Unieke titels, meta-descriptions, canonical URL, OG-tags, responsieve pagina's, 1× H1 en betekenisvolle kopstructuur.
- Zichtbare kruimels en `Article` + `BreadcrumbList` JSON-LD, zonder prijs-, garantie-, rating-, Review- of Offer-markup.
- Sitemap bevat zes canonieke URLs; bestaande robots blijven geldig.
- `scripts/check.mjs`: alle zes URL's, indexeerbaarheid, links, source-disclosure, homepage-interne links en structured data.
- `tests/knowledge-seo.test.mjs`: herkomst, data-pariteit, configuratie, sitemap en schema.
- `tests/knowledge-browser.mjs`: Chromium screenshots en WCAG A/AA bij **1440 / 390 / 320 px** per pagina, horizontale-overflowguard, productbeeld en CTA's, zonder externe e-mail.
- Ongewijzigde backend. Lead/DB/outbox/Odoo/Beheer/privacy zijn geen onderwerp van de diff.

## Productfacts en grenzen

Bronnen: [officiële HYXI AURA-productpagina](https://www.hyxipower.com/nl/ProductsDetail/hyxi-aura) (hercontrole 16-11-2026), 1-/3-fase datasheets **V2.1, 26-10-2026, Preliminary** reeds in `public/downloads/`. Zie [bronbeleid](PRODUCT-SOURCES.md). Nog steeds niet aannemen: leverbaarheid, installatiegeschiktheid, definitieve garantie, tarieven, ROI of volledige huis-backup.

**Search Console:** gekoppelde GSC Wizard-app weigert accounttoegang (`payment_required`, geen geldig abonnement). Eigendom, URL-indexatie en zoekperformance dus onbewezen; geen extra betaalde tool nodig voor deze codepublicatie. Later via bestaande eigen Google Search Console of geautoriseerde verbinding controleren.

## QA-runbook

- PR-head met 3/3 groene jobs: production build + API/browser/Lighthouse; Hostinger-style production-only install; geïsoleerde MySQL integratie.
- Beoordeel gegenereerde screenshots in GitHub Action `browser-verification-*` op desktop en mobiel; vorige homepage-basis in `docs/screenshots/desktop.jpg`. UX-voor/na: voorheen alleen hoofdsite met configurator en FAQ, nu twee doelgerichte keuzekaarten en twee gekoppelde verdiepingsartikelen. **Geen eigen 8/10-score of conversieverbetering als gemeten claim.**
- Publiceer uitsluitend na groene PR CI. Hierna publieke GET-check op /, beide gidsen, /sitemap.xml, /robots.txt, /offerte/, /api/health en 401 op private /api/beheer/leads — geen formulieren submitten.
- Rollback: eerdere groene `main`-commit via GitHub revert/deploy; Node-/MariaDB-migraties niet nodig.
- Houd #7 en #10 bij; #6 als aparte premium design-opdracht open. Geen automatische retentie/extra Odoo-API.

## Resultaat- en bewijsvelden

- **PR/commit:** PR #30; exacte merge-SHA na CI invullen of link naar merge.
- **CI:** GitHub Actions build/verify, productiebouw en MySQL; alleen na 3/3 SUCCESS vrijgeven.
- **Screenshots:** CI-artifact `browser-verification`, bijbehorende PR-head; geen klantdata.
- **Productie:** na deployment publieke URLs/statuscodes/canonicals en sitemap vergelijken; echte GSC-indexatie valt buiten dit bewijs.

## Productieacceptatie-aanvulling (na PR #30)
**Eerste SEO-release:** [PR #30](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/30) is gemerged (`f35e074d45c1822e11f2113e5a7c9a7a06b8fa36`). [PR-head 3/3 groene CI](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43790677504), [postmerge build groen](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43790937650), [7/7 klassieke publieke readiness groen](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43790937652). De oorspronkelijke probe dekte nieuwe gids-URL's nog niet, daarom Phase 4 uitbreiding van de **bestaande read-only** probe naar 9 checks (nooit POST/lead of login). De nieuw toegevoegde routes worden met canonieke URL, zichtbare titel, werkende offertelink en sitemapaanduiding gecontroleerd. Bij Hostinger-deployvertraging kan uitsluitend een gids-GET begrensd opnieuw worden geprobeerd; geen nieuwe service, geheime waarden of derde partij. Resultaat komt uit Actions, niet uit een aanname over indexatie.
