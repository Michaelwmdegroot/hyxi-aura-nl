# HYXI AURA — conversion & SEO sprint

**Datum:** 20 november 2026  
**Scope:** homepage-UX, commerciële pakketduidelijkheid, narrow-screen regressies en lokale releasecontrole.

## Audit in het kort

- De bestaande premium basis, productviewer, energiedemonstratie, reviewsectie, 31 canonieke routes en leadflow waren aanwezig en zijn behouden.
- De hero was visueel sterk, maar benoemde in het eerste scherm nog niet compact genoeg wat de bezoeker concreet kan kiezen en wie de geschiktheid controleert.
- De configurator liet de vijf combinaties technisch zien via fase + slider, maar niet als één direct scanbaar aanbod.
- De bestaande specificatietabel kon op 320 px door lange waarden horizontaal uitlopen. De recente `main`-commit bevatte daarnaast een selector-declaratieregressie waardoor een nieuwe Vite-build niet kon parsen.

## Geïmplementeerd

- `src/app.mjs`: de `$`/`$$`-selectorregressie hersteld.
- Homepagehero aangescherpt naar een directe uitleg van product, aanbod en beoordelingsrol van Thuisbatterij Team.
- Compacte hero-samenvatting toegevoegd: vijf vaste pakketten, 9–27 kWh, 1 of 3 fasen.
- Functioneel aanbodsoverzicht toegevoegd met precies deze vijf klikbare BAT-Q9-pakketten:
  - 1 fase · 9 kWh · 5 kW
  - 1 fase · 18 kWh · 5 kW
  - 3 fasen · 9 kWh · 10 kW
  - 3 fasen · 18 kWh · 10 kW
  - 3 fasen · 27 kWh · 10 kW
- Pakketknoppen synchroniseren met fase, module-slider, capaciteitsweergave, schematische stack en aanvraagcontext.
- Onder de configurator-CTA staat nu expliciet dat de keuze meegaat in de adviesaanvraag; de verwijderde tweede offertelink is niet teruggeplaatst.
- Specificatietabel op 320 px laat lange celwaarden veilig afbreken.

## Bewust niet gewijzigd

Geen backend, database, SMTP, Odoo-mailimport, privacy/auth, officiële productbeelden, prijzen, extra SEO-routes, sitemap/canonicals of review-schema gewijzigd. BAT-Q7 blijft technische achtergrondinformatie en is niet als verkoopoptie toegevoegd. Er zijn geen echte klantgegevens gebruikt en geen productie-leads verstuurd.

## Controle

- `npm run build` — geslaagd.
- `npm test` — 114/114 geslaagd.
- `npm run check` — 4.115 checks over 31 pagina’s geslaagd.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:browser` — geslaagd op desktop 1440, mobiel 390, narrow 320, tablet 768, no-WebGL, adviesflow en offerteflow; geïnjecteerde SMTP-testtransport, geen echte e-mail.
- Read-only `node scripts/probe-production.mjs` — 41/41 productiechecks geslaagd op de vóór-deploy live versie.
- Read-only `node scripts/gsc-domain-preflight.mjs` — vereiste canonieke homepage, sitemap, robots en `index.html`-redirect geslaagd. GSC-indexatie blijft eigenaar-/accountafhankelijk.

## Nog open na deze sprint

- Definitieve eigenaarreview van desktop en echte iPhone Safari; technische QA is geen automatische designscore van 9/10.
- Search Console URL-inspecties, daadwerkelijke indexatie, zoekdata en conversiemeting.
- Verificatie van de daadwerkelijke Hostinger-deployment na push naar `main`; de read-only productieprobe bewijst alleen de versie die op het moment van de controle live stond.
- Werkelijke mailbox-inboxaflevering en salesopvolging blijven operationele controles buiten deze lokale teststraat.
