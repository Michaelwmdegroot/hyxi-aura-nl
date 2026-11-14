# HYXI AURA — deployment vanuit `main`

Deze eerste release bevat de interactieve landingspagina en een echte, beveiligde aanvraagroute naar Thuisbatterij Team. De website kan direct worden gedeployed. Aanvragen via het formulier worden pas geactiveerd nadat de mailinstellingen zijn ingevuld. Zonder mailconfiguratie blijft rechtstreeks contact met Thuisbatterij Team mogelijk.

## 1. Koppel de repository

In Hostinger: **Websites → website toevoegen → Node.js / Web App → GitHub importeren**.

| Instelling | Waarde |
| --- | --- |
| Repository | `Michaelwmdegroot/hyxi-aura-nl` |
| Branch | `main` |
| Root directory | `/` |
| Node.js | `24` |
| Package manager | `npm` |
| Installatie | `npm ci --include=dev` indien instelbaar; anders Hostingers automatische installatie |
| Framework / runtime | Express.js / Node.js, met Vite als frontend-build |
| Build command | `npm run build` |
| Output directory | `dist` |
| Entry file | `server.mjs` |
| Start command, indien gevraagd | `npm start` |
| Poort | `3000`, of de door Hostinger ingestelde `PORT` |

Gebruik een Node.js-webapp die `server.mjs` uitvoert. Een uitsluitend statische Vite-deploy kan de pagina tonen, maar voert `/api/leads` niet uit. Automatisch deployen moet op `main` staan.

Officiële Hostinger-instructies: [Node.js-webapp toevoegen](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/). Raadpleeg de actuele schermen; Hostinger kan de benamingen veranderen.

**Buildafhankelijkheden:** Vite staat bewust in `dependencies`, omdat Hostinger bij `NODE_ENV=production` de development packages weglaat. `npm install` + `npm run build` werkt daardoor zonder handmatige aanpassing aan het buildcommando. De GitHub-workflow test dit apart met `npm ci --omit=dev` en `NODE_ENV=production`. Laat `NODE_ENV=production` voor de draaiende app staan.

## 2. Stel de omgeving in

Voeg in Hostinger de variabelen uit `.env.example` toe. Gebruik de echte mailboxgegevens uitsluitend in de beveiligde omgevingsinstellingen; zet ze nooit in GitHub, documentatie of chat.

| Variabele | Doel |
| --- | --- |
| `NODE_ENV=production` | Productiebeveiliging en Secure-cookies |
| `SITE_URL=https://hyxi-aura.nl` | Toegestane productie-origin |
| `ALLOWED_ORIGINS` | Optioneel: exacte tijdelijke Hostinger-URL, inclusief `https://`; meerdere origins met komma scheiden |
| `CANONICAL_REDIRECT=true` | Verwijst `www.hyxi-aura.nl` door naar de hoofdnaam |
| `LEAD_ENABLED=true` | Schakelt het formulier pas in als ook alle SMTP-instellingen compleet zijn |
| `SMTP_HOST` | SMTP-server van de bestaande mailbox |
| `SMTP_PORT=465` | Gebruik 465 voor impliciete TLS, of 587 voor STARTTLS |
| `SMTP_SECURE=true` | `true` bij 465; `false` bij 587. STARTTLS blijft bij `false` verplicht |
| `SMTP_USER` | Gebruikersnaam van de bestaande mailbox |
| `SMTP_PASS` | Wachtwoord van die mailbox |
| `SMTP_FROM` | Geautoriseerd afzenderadres zonder naam of haakjes |
| `LEAD_TO=leads@thuisbatterijteam.nl` | Ontvangstadres van het team; gebruik het werkelijk beheerde adres |
| `SMTP_DAILY_LIMIT=100` | Maximaal aantal verzendpogingen per UTC-dag, per serverproces |
| `LEAD_RATE_LIMIT=6` | Maximaal zes nieuwe aanvragen/pogingen per IP per 15 minuten |
| `CSRF_SECRET` | Optioneel: willekeurige geheime waarde van minimaal 32 tekens; bij ontbreken ontstaat er één per serverstart |
| `TRUST_PROXY=false` | Veilige standaard; zie hieronder voor de hostingproxy |

**Proxy en snelheidsbeperking:** standaard wordt `X-Forwarded-For` niet vertrouwd. Achter een proxy kunnen daardoor meerdere bezoekers hetzelfde IP-budget delen. Zet `TRUST_PROXY=1` alleen wanneer Hostinger bevestigt dat er één vertrouwde proxy voor de app staat en dat deze de inkomende `X-Forwarded-For`-header overschrijft. De app accepteert bewust geen onbeperkte `trust proxy=true`.

Sla de variabelen op en laat de app opnieuw starten/deployen. Alleen wijzigen in een invulveld zonder opslaan heeft geen effect. Controleer vervolgens `/api/health`: `leadEnabled: true` betekent dat de configuratie aanwezig is; het is **geen bewijs van SMTP-connectiviteit**.

### Een geslaagde build maar toch 503?

Een groene build bevestigt niet dat het Express-proces ook luistert. De productie-entry `server.mjs` start bewust de HTTP-server bij rechtstreeks uitvoeren én wanneer een Node.js hosting-runner de module importeert. De CI-test `node scripts/runtime-smoke.mjs` simuleert beide varianten na installatie met alléén productie-afhankelijkheden en verifieert `/`, `/api/health`, `/api/config` en de inhoudspagina's.

Controleer bij een 503 eerst de **Runtime logs** in de Hostinger-websitebeheeromgeving en, indien nodig, `domains/hyxi-aura.nl/hbuilds/current/nodejs/stderr.log`. Zoek naar `HYXI AURA listening on port 3000` of `HYXI AURA startup failed`, `EADDRINUSE`, `MODULE_NOT_FOUND` en poortfouten. Controleer het actieve proces via de knop **Running** en kies **Restart**. Een 503 kan ook van het NPROC- of geheugengebruik van het hostingpakket komen; Hostinger noemt dit als veelvoorkomende oorzaak. De exacte oorzaak vereist de runtime-logregel of hostingmeting. Controleer of `PORT=3000`, `NODE_ENV=production` en `TRUST_PROXY=false` zijn ingesteld. Een `TRUST_PROXY=true` is bewust ongeldig: de code accepteert alleen `false`, `0`, `1` of `loopback` om vervalste forwarding-headers te weren.

## 3. Rond de live controle af

1. Open de tijdelijke Hostinger-URL of `https://hyxi-aura.nl`. Op een tijdelijk domein krijgt de pagina een `X-Robots-Tag: noindex, nofollow` en blijft de canonical op de uiteindelijke domeinnaam staan.
2. Loop de interactieve onderdelen door op desktop en mobiel. Open de aanvraag, controleer dat de gekozen configuratie wordt meegenomen en dat de zichtbare contact- en privacygegevens kloppen.
3. Verstuur na toestemming van de eigenaar **één herkenbare echte testaanvraag** met eigen testgegevens. Controleer dat het bericht aankomt in de bedoelde mailbox, inclusief aanvraagnummer, gekozen configuratie en bron `hyxi-aura.nl`.
4. Controleer ook ongewenste mail, afzenderauthenticatie (SPF/DKIM/DMARC) en of antwoorden naar het opgegeven bezoekersadres gaan. De app verzendt geen automatische berichten naar bezoekers.
5. Koppel het domein en HTTPS. Open `/robots.txt` en `/sitemap.xml`; meld de sitemap aan in Google Search Console wanneer het domein is geverifieerd.
6. Verwijder de tijdelijke Hostinger-origin uit `ALLOWED_ORIGINS` zodra die niet meer nodig is.

Het formulier toont alleen succes wanneer de SMTP-server het bericht voor het geconfigureerde teamadres accepteert. Dat is een controleerbare overdracht aan de mailserver; ontvangst in de inbox moet tijdens de live controle apart worden vastgesteld. Onvolledige configuratie, afwijzing of een time-out levert een duidelijke foutmelding en directe contactroute op. Een SMTP-transactie wordt na maximaal 25 seconden afgebroken. Bij een onduidelijke verbindingbreuk kan de mail al geaccepteerd zijn: de app bevestigt dan geen succes en verstuurt dezelfde aanvraag gedurende 24 uur niet automatisch opnieuw. De bezoeker krijgt een directe contactroute. Duidelijke afwijzingen vóór aflevering blijven wel opnieuw te proberen.

## API-contract

`GET /api/config` geeft `leadEnabled`, `csrfToken` en publieke contactgegevens terug. Het antwoord zet een HttpOnly SameSite=Strict-cookie; dit is uitsluitend bedoeld om het door de bezoeker gevraagde formulier tegen vervalste aanvragen te beschermen.

`POST /api/leads` vereist JSON, dezelfde cookie, `X-CSRF-Token`, een toegestane `Origin` en een willekeurige `Idempotency-Key` (bijvoorbeeld `crypto.randomUUID()`). De frontend gebruikt dezelfde sleutel bij een retry met dezelfde gegevens.

```json
{
  "fullName": "Voorbeeld Bewoner",
  "email": "bewoner@example.test",
  "phone": "0612345678",
  "postcode": "1234 AB",
  "consent": true,
  "profile": {
    "solar": "yes",
    "annualUsage": 4200,
    "goal": "solar",
    "phase": "three",
    "moduleType": 9,
    "moduleCount": 2
  },
  "attribution": { "utm_source": "optioneel" },
  "website": ""
}
```

Nieuwe successen: HTTP 201 met `{ "ok": true, "requestId": "AURA-…" }`. Herhaalde bevestigde aanvragen: HTTP 200 met hetzelfde aanvraagnummer. Fouten: `{ "ok": false, "code": "…", "message": "…", "fields": {} }`; `fields` staat alleen bij validatiefouten.

## Beveiliging en gegevens

Alleen `dist` wordt publiek geserveerd. De omgeving, servercode, tests, documentatie en broncode buiten die build zijn niet via de webserver bereikbaar. Er is geen openbare beheeromgeving. Verzoekgrootte, velden, toestemmingsbevestiging, honeypot, oorsprong en CSRF-token worden gecontroleerd. Mailinhoud is platte tekst. Afzender, ontvanger, product en bron staan vast aan serverzijde. Er worden geen bestanden of externe URL's verwerkt vanuit de aanvraag.

Er zijn geen advertentiepixels, statistiekcookies of externe trackingdiensten ingebouwd. Persoonsgegevens gaan uitsluitend naar de geconfigureerde teammailbox. De applicatie slaat ze niet op schijf op en logt ze niet. Hostingtoegangslogs en mailboxbewaartermijnen vallen onder de beheerinstellingen van de eigenaar. De privacyverklaring moet aansluiten op de daadwerkelijk ingestelde ontvanger en verantwoordelijke.

### Operationele bewaartermijn

De privacyverklaring noemt een concrete beheerafspraak: **afgesloten aanvragen zonder klantrelatie worden uiterlijk zes maanden na het laatste contact verwijderd**. De **mailboxbeheerder van Thuisbatterij Team** is hiervoor verantwoordelijk en controleert periodiek zowel de ontvangende mailbox als eventuele werkadministratie waarin de aanvraag is overgenomen. Leg vóór ingebruikname vast wie deze rol uitvoert en hoe afgeronde aanvragen worden gemarkeerd, zodat de termijn ook daadwerkelijk wordt nageleefd.

Deze website verwijdert mailboxberichten of dossiers niet automatisch. De beheerder verwijdert daarom handmatig de betrokken berichten en overgenomen gegevens na afloop van de termijn, behalve wanneer een gedocumenteerde wettelijke verplichting of lopend geschil langer bewaren noodzakelijk maakt. Zodra een aanvraag een klantrelatie wordt, gelden de passende bewaartermijnen van de klantadministratie. Pas de privacytekst aan wanneer de werkelijk toegepaste werkwijze verandert.

## Grenzen van deze eerste release

Snelheidsbeperking, dagbudget en idempotentie zitten in geheugen van één serverproces; ze resetten bij een herstart of nieuwe deploy en worden niet tussen meerdere processen gedeeld. De app houdt alleen hashes, verzendstatus en ontvangstnummers bij. Start dus één app-instance. Er kunnen maximaal vijf SMTP-transacties tegelijk lopen. Een onderbreking exact tijdens SMTP-overdracht kan niet met een absolute exactly-once-garantie worden afgehandeld. Bij onzekere aflevering wordt opnieuw versturen onderdrukt; bij een duidelijk mislukte aflevering gebruiken retries hetzelfde Message-ID binnen het lopende proces. Verliest alleen de browser zijn verbinding, dan maakt de server de mailoverdracht af; een retry met dezelfde sleutel krijgt de eerder vastgelegde uitkomst.

Voor de latere uitbouw naar een netwerk met centrale leadopvolging zijn een duurzame database/outbox, gedeelde limieten, bewaartermijnen en een gecontroleerde CRM-koppeling de volgende stap. Deze landing schrijft nog niet rechtstreeks naar Odoo of de NIVO Portal. In deze release is de mailbox van Thuisbatterij Team het afleverkanaal.

## Lokaal testen

Voor ontwikkeling start je Vite en de echte aanvraag-API op dezelfde origin:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. De devserver heeft geen bestaande build nodig. `npm run dev -- --port 5174` kiest een andere poort. Er is geen tweede serverterminal of handmatige wijziging aan een Vite-proxy nodig. De opdracht leest een eventuele lokale `.env` en weigert `NODE_ENV=production`. Herstart na veranderingen aan servercode.

Voor controle van de productiebuild:

```sh
npm run build
npm test
npm run check
npm start
```

De gebouwde Express-site draait normaal op poort 3000. Laat bij lokale HTTP-tests `NODE_ENV` op `development` of `test`; productie gebruikt Secure-cookies en vereist HTTPS. `npm start` en `npm run dev:server` vereisen een bestaande `dist`. Laat `LEAD_ENABLED=false` als er geen echte mail mag worden verstuurd. De geautomatiseerde backendtests gebruiken een geïnjecteerde testtransporteur en verzenden geen echte e-mail.

### Volledig formulier met gesimuleerde aflevering

```sh
QA_MAIL_MODE=accept npm run dev:qa
```

Open `http://127.0.0.1:4173` en gebruik fictieve contactgegevens. `tests/preview-dev.mjs` start de frontend en een test-API samen. De interne test-API gebruikt poort 3001. Je hoeft geen proxy-instellingen te wijzigen of losse API-opdracht uit te voeren. Met `QA_MAIL_MODE=reject npm run dev:qa` test je een duidelijke mailafwijzing.

Deze omgeving bindt uitsluitend aan loopback, weigert `NODE_ENV=production`, gebruikt expliciete testinstellingen en maakt nooit een echte SMTP-verbinding. Op dezelfde frontend-origin toont `/__qa/state` uitsluitend de simulatiemodus, aantallen pogingen/acceptaties/afwijzingen, de laatste HTTP-status en het gekozen productprofiel. Naam, e-mail, telefoon, postcode en campagnegegevens worden daar niet getoond. Stoppen van de preview stopt ook de test-API. **Deploy altijd `server.mjs`, nooit de QA-testserver.**

## GitHub Actions en Lighthouse-rapporten

De workflow **Build and verify** bouwt en controleert wijzigingen op `main`, pull requests naar `main` en handmatige workflowstarts. De browserflow gebruikt een SMTP-testvervanger. `scripts/audit.mjs` meet daarna de gebouwde homepage met Lighthouse op desktop en mobiel, op een tijdelijke lokale Express-server met mail uitgeschakeld. Het script gebruikt geen productiecredentials of `.env` en weigert uitvoering buiten GitHub Actions.

De samenvatting verschijnt in de Actions-run. De workflow uploadt tevens `lighthouse-<run_id>-<run_attempt>` met een bewaartermijn van zeven dagen:

| Artifactbestand | Inhoud |
| --- | --- |
| `desktop.html`, `mobile.html` | Leesbare volledige Lighthouse-rapporten |
| `desktop.json`, `mobile.json` | Ruwe rapportgegevens |
| `summary.md`, `summary.json` | Scores, kernmetingen, bevindingen, instellingen, commit en eventuele auditfouten |

Bij een onderbroken of mislukte meting kunnen sommige rapportbestanden ontbreken; de samenvatting geeft de vastgestelde fout weer. Bekijk bij fouten ook het artifact `verification-failure-<run_id>-<run_attempt>`, als dat is aangemaakt.

Beoordelingsdoelen: **performance minimaal 90**, en **accessibility, best practices en SEO 100**. Lagere scores veroorzaken reviewwaarschuwingen en blijven zichtbaar in het rapport. Een onvolledig rapport of runtimefout laat de auditstap mislukken. Een groene workflow is dus geen claim dat elk scoredoel gehaald is.

Deze laboratoriummeting gebruikt de GitHub-runner en Lighthouse-throttling. Zij is geen meting van echte bezoekers of veld-Core Web Vitals en omvat niet de uiteindelijke Hostinger-latency, DNS, TLS of CDN. Controleer na de domeinkoppeling ook de daadwerkelijke publieke website en mailboxaflevering.
