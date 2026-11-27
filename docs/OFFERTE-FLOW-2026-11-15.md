# HYXI AURA — zelfstandige offerteaanvraag (P1)

## Wat nu bestaat

Publieke route **/offerte/** met eigen SEO-zoekintentie en canonical, toegankelijk formulier, responsieve premium vormgeving en links vanaf de bestaande productervaring. Geen account, geen 2FA, geen voorgerekende prijs of verzonnen opbrengst.

De pagina vraagt alleen relevante informatie: woning- en zonnepanelensituatie, globale verbruikswaarde (optioneel), doel, gewenste modules, projecttoelichting (optioneel), naam, woonplaats, contactgegevens, postcode en **expliciete contacttoestemming**. Er zijn geen analytics-/advertentiecookies, browseropslag, automatische foto-upload of externe formulieren.

Een succesvolle offerte gaat via **exact dezelfde productie-API /api/leads** als advies: CSRF-cookie, Origin, rate limit, honeypot, servervalidatie, idempotency-key, AES-256-GCM-opslag en transactionele outbox. De optionele intentie `quote` verandert de bestaande adviesroute niet: ontbreken van deze intentie blijft `advice`. Geen migratie, nieuwe credentials of aparte mailverbinding.

Het SQL-dossier heeft `request_type='quote'`. De CRM-mail gebruikt voor nieuwe aanvragen exact `Klantnaam | Woonplaats` als onderwerp en bevat de optionele projectwensen. Een afzonderlijke interne salesnotificatie vermeldt daarnaast de gekozen pakketkeuze en aanvraagreferentie. In Beheer verschijnt de markering 'Offerte'; geautoriseerde medewerkers zien de toelichting in het versleutelde dossier. Het formulier toont het unieke ID pas **na** geldige API-ontvangst. Bij een fout blijft de invoer beschikbaar met een telefoon/e-mailfallback; er volgt geen valse bevestiging.

## Productbeleid

Een ingevulde modulekeuze is alleen een interesse-indicatie, geen technisch voorstel of bestelling. Geen vaste prijzen, garanties, besparingen of terugverdientijd; een adviseur controleert installatie, voorwaarden en actuele prijs. Geen marketingtoestemming of automatische externe follow-upberichten.

## QA-acceptatie

1. `npm test`: adviespayload blijft compatible; offerte heeft correcte validatie; mailclassificatie en projectwensen kloppen.
2. `npm run test:db` met **fictieve data**: offerte wordt versleuteld en als `quote` vastgelegd in bestaand transactie- en outboxmodel.
3. `npm run test:browser`: /offerte/ desktop/mobiel toegankelijk, geen horizontale overflow; fictieve formulierinzending levert echte API-ontvangst en intern offerte-e-mailonderwerp via ingespoten **SMTP-stub**.
4. `npm run check`: canonical, interne navigatie en sitemap vormen één geldig productiebestand.
5. **Na merge/deploy**: externe publieke probe blijft groen; verifieer in productie `/offerte/` en doe maximaal één gemarkeerde fictieve offertetest via de browser of apart eenmalig geautoriseerd testscript. Controleer ID in Beheer en ontvangst in leads@, inclusief dat de mail het onderwerp **offerteaanvraag** heeft. Niet aannemen dat CI=live.
6. Verifieer robots/sitemap en voeg `https://hyxi-aura.nl/sitemap.xml` handmatig toe aan Search Console na eigendomsverificatie.

## Bewaarde grenzen

Geen prijsberekening, offertes in PDF, online betalingen, CRM-koppeling of automatische opvolgherinnering. De mail-outboxmelding gaat naar leads@; na ontvangst beoordeelt de bestaande salesorganisatie de aanvraag. Automatische e-mail aan de aanvrager vergt eigen deliverability-/toestemmingsbesluit. Back-up-restore en persoonsgegevensretentie volgens **docs/P0-PRODUCTION-ACCEPTANCE-2026-11-15.md** blijven operationele P0-taken.

De uitvoerbare bronpagina is `offerte/index.html`; logica `offerte/offerte.mjs`; de bestaande API en database blijven leidend.
