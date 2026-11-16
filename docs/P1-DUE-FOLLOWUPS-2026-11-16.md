# HYXI AURA — P1 vervolgacties vandaag/verlopen
**Datum:** 16 november 2026 · [issue #4](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/4)  
**Basis:** bestaande Hostinger `main`, password-only `/beheer`, versleutelde `followUp`-velden, geen nieuwe migratie.

## Wat is gebouwd

- In de bestaande privé-werkbank staat een extra tabblad **Vervolgacties**. Zowel admins als sales kunnen dit openen. Het toont alleen dossiers die ze reeds volgens de bestaande toewijzingsrechten mogen lezen: admin alle, sales alleen expliciet toegewezen.
- Het tabblad geeft **Verlopen** en **Vandaag** apart weer op basis van de in het dossier versleutelde `followUp.dueDate`. De datumgrens gebruikt expliciet **Europe/Amsterdam**, inclusief overgangen naar zomer-/wintertijd.
- Winsten, verloren/niet-passende afgesloten aanvragen, toekomstige datums en dossiers zonder vervolgdatum verschijnen niet. Een actie kan vanuit de lijst worden geopend in het **bestaande** dossierpaneel, waarna de medewerker de bestaande vervolgdatum/volgende actie/notities kan aanpassen.
- De read-only, ingelogde `GET /api/beheer/followups` gebruikt bestaande MySQL-leads en AES-256-GCM-decryptie. De API toont **geen** contactemail/telefoon in het werkoverzicht; eventuele interne vrije-tekstactie blijft uitsluitend voor bevoegde gebruikers beschikbaar. Per inzage wordt een actor-only `followups_view`-audit geschreven, zonder vrije-tekstinhoud.
- **Geen e-mailherinneringen, geen Odoo-webhooks, geen automatische statuswijzigingen en geen nieuwe database-/configuratievereisten.** De bestaande e-mail→Odoo CRM-route wordt niet gedupliceerd.

## Belangrijke schaalgrens — bewust zichtbaar, niet verbergen

De huidige vervolgdatum staat versleuteld in het dossier, **niet in een SQL-index**. Een betrouwbare lijst zonder migratie vergt ontsleutelen van actieve dossiers aan de serverzijde. Om een onbegrensde DB-scan te voorkomen beperkt deze eerste snelle werkbank de lezing tot **2.500 actieve zichtbare dossiers**, in batches van 200 via de bestaande ID-index. Bij meer dan 2.500 waarschuwt de UI expliciet dat het overzicht **mogelijk onvolledig** is. De lijst toont maximaal de eerste **100 chronologisch gesorteerde openstaande acties**; als meer acties zijn gevonden, wordt dat vermeld. De aantallen zijn alleen volledig als `limited=false`.

**Voor de fase waarin HYXI duizenden actieve leads heeft** moet een volgende PR een geautoriseerde, geïndexeerde due-date-projectie of gecontroleerde migratie ontwerpen, met backfill, checksums en behoud van versleutelde notitie-inhoud. **Niet** nu stilzwijgend een schemawijziging op Hostinger uitvoeren. Dit huidige overzicht is geen 100%-compleet CRM-overzicht bij de cap.

## Kwaliteit en privacy

- API alleen achter bestaande Beheer-sessie; geen nieuwe login, MFA of onbevoegde publieke endpoint.
- Sales mag geen dossiers van andere medewerkers zien, ook niet via een manipulatie van de URL.
- E-mail, Odoo en Hostinger-backups worden niet aangesproken.
- In browser- en database-tests uitsluitend fictieve accounts, rollen en aanvraagwaarden. Testgegevens verlaten GitHub CI niet via SMTP.
- Vrije-tekstacties komen **niet** in applicatielogs of audit-eventmetadata.
- Na logout worden de taaklijst, aantallen en andere privégegevens uit de clientinterface verwijderd.

## Regressieacceptatie

1. Unit: Amsterdamse kalenderdag en overgang zomertijd/wintertijd, verlopen/vandaag/toekomst/afgesloten.
2. Disposable MySQL: acties uit versleutelde payload, correct gesorteerd, admin- en salesrechten en audit zonder PII.
3. Browser Chromium desktop/390px mobiel: tabnavigatie, datum-/statuslabels, dossieropenen, toegankelijkheid, logout en verbergen voor oningelogden.
4. Hostinger-achtige `npm ci --omit=dev` build, `npm test`, `npm run check`, openbare lead- en offerteflow ongewijzigd.
5. Externe publieke production-readiness blijft 7/7 groen na merge. Dit test geen privé Beheer-inhoud.

## Volgende stap

- Een betrouwbare, volledige follow-upwerkvoorraad met index wanneer de huidige scanlimiet werkelijk bereikt wordt.
- Alleen na commerciële afstemming eventueel **één gededupliceerde operationele herinnering**, met prioriteit voor de reeds bestaande Odoo-opvolging, geen dubbele mails naar consumenten.
- Later geaggregeerde opvolg-KPI's uit reële timestamps, niet uit verzonnen conversiepercentages.
