# HYXI AURA — final launch polish

**Datum:** 20 november 2026  
**Scope:** laatste mobiele regressiecontrole, kleine UX-correctie, lokale QA en productiecontrole.

## 1. Gevonden problemen

- Commit `1acdd4a` had de oorspronkelijke mobiele grid-overlap correct opgelost, maar een latere editorial override zette de titelafstand terug naar `0px`. Op 320px raakte de kop daardoor direct het icoon.
- De mobiele kaartlayout moest worden gecontroleerd op 320, 375, 390 en 430px, inclusief overflow, illustraties en vaste CTA/headerlagen.
- De bestaande hero-, configurator-, aanbod- en SEO-basis was al eerder gepubliceerd en vertoonde in deze sprint geen nieuwe concrete regressie.

## 2. Daadwerkelijk opgelost

- Mobiele voordeelkaarten behouden nu een natuurlijke flexhoogte.
- De titel krijgt op mobiel 12px ruimte onder het icoon; de bodytekst krijgt 16px ruimte onder de titel.
- De bestaande drie kaarten blijven inhoudelijk en visueel intact: back-up, slim laden en gerust gevoel thuis.
- Geen wijziging aan backend, SMTP, Odoo, database, formulieren, officiële productbeelden, CTA-hiërarchie of vijf BAT-Q9-configuraties.

## 3. Aangepaste bestanden

- `src/editorial-polish.css` — mobiele titelafstand hersteld.
- Deze release-notitie.

De eerder afgeronde conversie- en aanbodwijzigingen blijven op `main` staan via `054842b`, `96c418d` en `1acdd4a`.

## 4. Tests en resultaten

- `npm run build` — PASS. Lokale machine gebruikte Node 26; Hostinger bouwde dezelfde commit aantoonbaar met Node 24.
- `npm test` — PASS, 114/114.
- `npm run check` — PASS, 4.115 checks over 31 pagina’s.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=... npm run test:browser` — PASS: desktop, mobiel, 320px, tablet, no-WebGL, alle zes energiescenario’s, vijf pakketten en advies/offerteflow met geïnjecteerde SMTP-teststub. Geen echte lead of productie-e-mail verzonden.
- Read-only browsergeometrie tegen `https://hyxi-aura.nl/` op 320, 375, 390, 430 en 1440px — PASS. Geen horizontale overflow; mobiele minimale afstanden 12px icoon→kop en 16px kop→tekst.
- `node scripts/probe-production.mjs` — PASS, 41/41 publieke readinesschecks.
- `node scripts/gsc-domain-preflight.mjs` — required canonical homepage, sitemap, robots en HTML-alias PASS. GSC-indexatie/URL-inspectie zelf blijft niet via deze lokale controle bewezen.

## 5. Gepubliceerde commits

- `1acdd4a` — mobiele flexlayout tegen tekstoverlap.
- `c56c3a0` — laatste 12px mobiele titelafstand, gepubliceerd naar `main` met `[skip ci]`.

Git-status na publicatie: `main` gelijk aan `origin/main`; geen ongecommitte bronwijzigingen.

## 6. Productiestatus Hostinger

De automatische GitHub→Hostinger-deployment van `c56c3a0` is gecontroleerd via Hostinger deployment `01a1f9da-a1c9-7213-a782-cd0e21c8215a`: **completed**, Node.js 24, Express, build en publish geslaagd. De live pagina serveert de nieuwe homepage-assets en de live browsergeometrie is opnieuw gecontroleerd.

## 7. Werkelijk openstaand

- Een aparte owner-review op een echte iPhone Safari blijft wenselijk; lokaal was geen WebKit/Safari-runner geïnstalleerd.
- Google Search Console-eigendom, URL-inspecties en daadwerkelijke indexatie zijn niet door deze sprint bewezen.
- De bestaande Vite-waarschuwing over de grote energy-scene chunk blijft bestaan; er is geen regressie aangetoond en code-splitting hoort niet in deze laatste sprint.

Er zijn geen bekende P0/P1-blockers voor de technische lancering op basis van de uitgevoerde controles.

## Screenshots

- `test-results/final-launch/live-benefit-cards-320.png`
- `test-results/final-launch/live-benefit-cards-390.png`

## 20 november, 18:34 — mobiele decoratieve iconen verwijderd

De eigenaar heeft op echte iPhone bevestigd dat de kaarttekst goed staat, maar wil de drie **ronde iconen vóór de titels** verwijderen en de content omhoog. `src/editorial-polish.css` verbergt ze nu alleen op schermbreedtes tot 700px; de bovenruimte van een kaart wordt 24px en de kop begint direct, zonder extra bovenmarge. De 16px tussen kop en beschrijving blijft. De grafiek, back-upillustratie en veiligheidsillustratie behouden hun bestaande werking en de desktop-icoontjes blijven zichtbaar.

`tests/browser.mjs` controleert op 390 en 320px de verborgen iconen, titelpositie en minimale afstand naar beschrijving; op desktop controleert de test dat de iconen juist zichtbaar blijven. De wijziging is met `[skip ci]` rechtstreeks op `main` gepubliceerd wegens uitgeputte Actions-minuten. De toegevoegde browserasserties zijn niet in deze ChatGPT-omgeving uitgevoerd, dus daadwerkelijke live Safari-verificatie blijft een afzonderlijke controle.
