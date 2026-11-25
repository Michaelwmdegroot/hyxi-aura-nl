# HYXI AURA — officiële launchronde branding, navigatie en conversie
**25 november 2026** · Thuisbatterij Team × HYXI AURA

## Eigenaarbesluit
Nieuw **Thuisbatterij Team**-logo uit `thuisbatterijteam-logo-websitepakket-2.zip` overnemen: volledig transparante, geschaalde SVG-vector, zwart `#000000`, donkergrijs `#5A5A5A`, groene punt `#00EC54`. Geen fonts nodig. Bij visuele inline-afbeeldingen in header en footer blijft de subtiele subline **presenteert HYXI AURA** staan. De bestaande TBT-huis/batterij-favicon en 192/512px app-iconen blijven behouden (het aangeleverde pakket bevat geen vervangende favicon).
De afbeeldingspaden zijn als vector onder `public/assets/thuisbatterijteam-logo.svg` in de repository gezet. Het SVG-pad is voor webgebruik numeriek tot twee decimalen verkort zonder merkbaar vormverschil; de originele ZIP is de merkbron.

## Nieuwe navigatie
Op de homepage desktop vijf duidelijke links: **Batterij** (`#samenstellen`), **Voordelen** (`#voordelen`), **Ervaringen** (`#ervaringen`), **Thuisbatterij Team** (`#team`), **Contact** (`#aanvragen`). De bestaande persoonlijke adviesknop blijft de primaire CTA en opent hetzelfde werkende aanvraagdialog. Geen pijlen, geen tweede offertelink of redesign.
Onder 1100px een compacte menuknop. De vijf menuankers staan op **alle 30 publieke HTML-pagina's**; op subpagina's linken ze terug naar de homepage. Menu ondersteunt aria-expanded, Escape, sluiten buiten het menu en sluiten na klik; visuele focus en reduced-motion. De losse offerte- en informatiepagina's behouden hun bestaande, directe inhoudslinks. Op kleine schermen toont de kennispagina een compacte `Offerte`-CTA naast de menuknop.

## Assortiment en inhoud
- Alleen vijf BAT-Q9-pakketten: 1 fase 9/18 kWh met 5 kW; 3 fasen 9/18/27 kWh met 10 kW. Inclusief back-up met installatiebeperkingen. Geen BAT-Q7 als koopoptie, geen prijzen zonder bevestigde consumentprijs/btw/plaatsing.
- Op `main` zijn reeds 30 canonieke pagina's, de voormalige Q7-keuzepagina heeft een 301-redirect.
- Paginatitel, productclaims, bestaande foto’s en Odoo-mailimport niet opnieuw vormgeven voor deze launch.

## Regressiegates
- Bestaande brand- en kennisunitchecks aangepast voor het nieuwe SVG-logo.
- Nieuwe `tests/launch-navigation.test.mjs` bewijst voor 30 statische pagina's de vijf echte menuankers, attributen, SVG-bestand en kleurwaarden.
- Bestaande `tests/browser.mjs` met nieuwe controle van mobiel/menu Escape, vaste header, kleinste schermbreedtes en footerlogo.
- `scripts/probe-production.mjs` bewaakt de extra publieke SVG als vereist asset en controleert de nieuwe homepage-navigatie met behoud van de bestaande 41 live-gates.
- Geen echte leads of e-mails versturen voor een opmaakrelease, geen GitHub Actions (minutenbeperking).
- Run op Node.js 24: `npm run build && npm test && npm run check && npm run test:browser`, daarna read-only `node scripts/probe-production.mjs` en persoonlijke iPhone Safari-check.

## Launch GO / NO-GO
**GO** pas nadat nieuwe branding/menu op daadwerkelijk Hostinger-live URL zichtbaar zijn, mobile 320/390/430 en desktop geverifieerd, alle vijf pakketten aanklikbaar zijn, en bestaande advies- en offerteflow niet zijn beschadigd. De nieuwe SVG en nieuwe navigatie horen op alle 30 routes te verschijnen.
**Ads:** campagne pas starten na een succesvolle leadtoestemming-/conversiemetingstest en controle van advertentietracking/privacy. Search Console-indexatie van alle 30 routes is een SEO-vervolgcontrole, geen bewijs van lancering.
