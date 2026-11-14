# Releaseverificatie

## Lokaal gecontroleerd op 14 november 2026

- Productiebuild met Node.js 24 en Vite 8 geslaagd.
- Alle 25 unit- en API-integratietests geslaagd, inclusief SMTP-afwijzing, onzekere aflevering, idempotentie, CSRF, validatie, limieten en publieke bestandsgrenzen.
- 482 statische controles geslaagd op de drie pagina's, lokale assets en links, FAQ/schema-pariteit en originele PDF-documenten.
- Handmatige browsercontrole van desktop en mobiele viewports. Bij 320px en 390px breedte is horizontale documentoverloop gecontroleerd en opgelost.
- Axe WCAG A/AA-controle van de mobiele hoofdpagina en het open contactformulier: geen automatisch gevonden overtredingen in de gecontroleerde staat.
- Met een expliciete testtransporteur de volledige mobiele aanvraag doorlopen: drie BAT-Q7-modules, geplande zonnepanelen, 4.200 kWh jaarverbruik, back-upwens en 3-fasenaansluiting kwamen correct aan. HTTP 201, één geaccepteerde overdracht en een overeenkomend aanvraagnummer. Er is geen echte mail verstuurd.
- Een expliciete SMTP-afwijzing via dezelfde browserflow gaf HTTP 502, geen succesbericht en de directe telefoon-/contactroute.
- De cloudbrowser heeft geen WebGL. De volledige interactieve SVG-woning is daar visueel en functioneel gecontroleerd. Three.js wordt afzonderlijk in CI/browsergeschikte omgevingen gecontroleerd.

Dit beschrijft uitgevoerde controles, geen garantie dat iedere combinatie van browser, hulptechnologie en apparaat foutloos is.

## Eerste onafhankelijke CI-meting

Op commit `64d459a8030c27d464fa02dc6a66119b6b120c04` zijn alle build-, API-, model-, statische en browsercontroles in [GitHub Actions](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43637753466) geslaagd. Ook de privacy- en bronnenpagina zijn op smalle en tabletweergaven met axe gecontroleerd.

| Lighthouse | Desktop | Mobiel |
| --- | ---: | ---: |
| Performance | 100 | 99 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| LCP | 0,4 s | 2,1 s |
| CLS | 0 | 0 |
| TBT | 0 ms | 20 ms |

Dit is de eerste meting, vóór de daaropvolgende verbetering van HTTP-compressie. Voor de nieuwste commit zijn de artifacts en samenvatting van de bijbehorende workflow-run leidend. Openbare tekstbestanden worden inmiddels met gzip/Brotli geleverd als de browser daarom vraagt. De integratietest controleert dat de uitgepakte inhoud gelijk blijft en dat API-antwoorden buiten deze compressie blijven.

Visueel bewijs: [startpagina](screenshots/desktop.jpg) en [interactieve avond](screenshots/energy-experience.jpg). Deze screenshots tonen de functionele SVG-weergave in de cloudbrowser. De CI-browserrapporten vermelden afzonderlijk of daar Three.js of de SVG-fallback is gebruikt.

## Herhaalbare controles

```sh
npm ci
npm run build
npm test
npm run check
npx --no-install playwright install --with-deps chromium
npm run test:browser
```

GitHub Actions voert deze controles uit op de exacte commit. De browsercontrole behandelt desktop en mobiel, alle zes energiestanden, twaalf moduleconfiguraties, toegankelijke formulieren, vertraagde mailacceptatie, het ontbreken van mailconfiguratie en het ontbreken van WebGL. Resultaten en screenshots staan als workflow-artifact onder `test-results/browser`.

De workflow meet daarnaast Lighthouse voor mobiel en desktop. HTML-/JSON-rapporten en een samenvatting staan in het Lighthouse-artifact. Scores zijn laboratoriummetingen van de productiebuild; de uiteindelijke Hostinger-configuratie en echte bezoekersprestaties moeten na domeinkoppeling worden gemeten.

## Controle na hostingconfiguratie

Volg de stappen in [HOSTINGER.md](HOSTINGER.md). DNS, HTTPS, SMTP-connectiviteit en daadwerkelijke inboxontvangst kunnen pas op de ingestelde hosting worden vastgesteld. De testtransporteur vervangt deze live controle niet.
