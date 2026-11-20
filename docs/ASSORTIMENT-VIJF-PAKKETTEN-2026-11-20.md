# HYXI AURA — vijf aangeboden configuraties (20 november 2026)

## Eigenaarbesluit
Op hyxi-aura.nl worden uitsluitend deze vijf samengestelde BAT-Q9-opstellingen aangeboden:

| Pakket | Fase | Omvormer | Modules | Nominaal | Bruikbaar | Back-up |
|---|---|---:|---:|---:|---:|---|
| 1 fase · 9 kWh | 1 fase | 5 kW | 1 × BAT-Q9 | 9,04 kWh | 8,6 kWh | geïntegreerde ATS |
| 1 fase · 18 kWh | 1 fase | 5 kW | 2 × BAT-Q9 | 18,08 kWh | 17,2 kWh | geïntegreerde ATS |
| 3 fasen · 9 kWh | 3 fasen | 10 kW | 1 × BAT-Q9 | 9,04 kWh | 8,6 kWh | geïntegreerde ATS |
| 3 fasen · 18 kWh | 3 fasen | 10 kW | 2 × BAT-Q9 | 18,08 kWh | 17,2 kWh | geïntegreerde ATS |
| 3 fasen · 27 kWh | 3 fasen | 10 kW | 3 × BAT-Q9 | 27,12 kWh | 25,8 kWh | geïntegreerde ATS |

### Wat NIET wordt aangeboden
BAT-Q7, een 1-faseopstelling met drie BAT-Q9-modules, 4–6 modules en andere omvormercombinaties zijn geen standaardpakketten. De fabrikant vermeldt technisch meer mogelijkheden. Die informatie blijft staan op echte datasheet-/kennispagina's, expliciet gelabeld als fabrieksinformatie en **niet te bestellen via deze site**.

### Nog niet te publiceren prijzen
In de door de eigenaar aangeleverde tabel ontbreken kolomkoppen. De eerste drie kolommen volgen wel de BTW-rekenkundige opbouw, maar de vierde is een los bedrag en de vijfde is het verschil met de eerste. Hierdoor valt niet vast te stellen welke kolom een juridische consumentenverkoopprijs **inclusief BTW en installatie** is. Publiceer geen interne kostprijzen of marges in deze publieke repository en verzin geen consumentenprijs. Gebruik tot schriftelijke bevestiging **offerte op maat**; ontvang een persoonlijk voorstel via de bestaande leadflow.

### Technische implementation
- Eén vast register `OFFERED_PACKAGES` in `src/configurator-model.mjs` voor precies vijf varianten.
- Homepage: fase bepaalt slidergrens (1–2 of 1–3 modules). Nominale capaciteit, bruikbare capaciteit en geselecteerde fase/omvormer worden synchroon bijgewerkt. Technische 7 kWh-optie is niet zichtbaar.
- Offerte: 9 kWh-module is vast, maximaal 3 per 3-fasenpakket, oude Q7/4–6-module-URL's worden genegeerd. De toegestane `phase` in de URL dient uitsluitend voor anonieme prefill; persoonsgegevens komen nooit in query of storage.
- API: uitsluitend moduleType=9 en moduleCount 1–3; bij 27 kWh moet 3 fasen expliciet of als geselecteerd pakket worden vastgelegd. `offerPhase` is optioneel voor legacy-integratiecalls maar wordt vanuit de actuele website ingevuld.
- Overige fabrikantinformatie in de SEO-pagina's blijft technisch brongetrouw en heeft een zichtbare verklaring dat BAT-Q7 niet onder ons assortiment valt.
- Homepage Google-reviewdatum is verwijderd; score is nog steeds statische weergave, geen Google API-feed.

### Acceptatie
`npm run build`, `npm test`, `npm run check` en Chromium-tests voor de vijf configuraties, 320/390/1440px, de quote-prefill en het bestaande advies/offerte-API-pad. Op branch 3/3 CI groen; na merge op `main` postmerge CI groen en publieke Hostinger-releasechecks. De domein/GSC-runner kent een eerder apart `urllib.URLError`-verschil; geen onterechte indexatieclaims.
