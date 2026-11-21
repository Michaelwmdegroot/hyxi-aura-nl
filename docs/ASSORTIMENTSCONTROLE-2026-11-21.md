# HYXI AURA — assortimentscontrole 21 november 2026

## Vastgestelde commerciële waarheid
Deze website biedt uitsluitend **vijf door de eigenaar goedgekeurde pakketten** aan:

| Aansluiting | Omvormer | Opslag | BAT-Q9-modules | Nominaal | Bruikbaar |
|---|---:|---:|---:|---:|---:|
| 1 fase | 5 kW | 9 kWh | 1 | 9,04 kWh | 8,6 kWh |
| 1 fase | 5 kW | 18 kWh | 2 | 18,08 kWh | 17,2 kWh |
| 3 fasen | 10 kW | 9 kWh | 1 | 9,04 kWh | 8,6 kWh |
| 3 fasen | 10 kW | 18 kWh | 2 | 18,08 kWh | 17,2 kWh |
| 3 fasen | 10 kW | 27 kWh | 3 | 27,12 kWh | 25,8 kWh |

Alle pakketten worden beschreven met geïntegreerde ATS/back-up; de daadwerkelijke noodstroomgroepen worden vóór installatie gecontroleerd. Niet aangeboden als standaardpakket: BAT-Q7, 1 fase met 3 modules, 4–6 modules, andere vermogens, HYXI Halo en concurrerende merken. De bestaande fabrikantbronnen mogen deze uitvoeringen **uitleggen**, nooit als bestelbaar tonen. Prijzen blijven uit de publieke site zolang de verkoopprijs-/btw-/installatiekolommen niet zijn bevestigd.

## Broncontrole van alle 30 actieve publieke pagina's
De bestaande configurator en offerteformulieren waren al Q9-only. De grootste inhoudelijke inconsistenties bleken op de modellenpagina, capaciteitsgidsen, negen vergelijkingspagina's en het centrale fabrikantregister: BAT-Q7 werd daar als gelijkwaardige commerciële keuze of in tabelkolommen naast ons daadwerkelijk aangeboden Q9 gezet. Verder noemden aankoopchecklists beide moduletypen en zes-module-opstellingen.

### Gecorrigeerd
- **Negen merkvergelijkingen:** HYXI-tekst en tabellen vergelijken nu uitsluitend de vijf verkoopbare BAT-Q9-pakketten, niet Q7/Q9 als keuze. Fabrikantbronnen en opmerkingen over de concurrenten blijven intact.
- **Modellen & centrale marktvergelijking:** nieuwe SEO-titel, meta description, OG en WebPage-schema leggen de vijf aangeboden configuraties uit. Het marktregister en de centrale HYXI-rij hebben alleen Q9. Technische fabriekstabellen bevatten bijbehorende disclaimers.
- **Homepage FAQ:** klantgerichte fase- en garantieuitleg gaan over het actuele 5 kW/10 kW Q9-aanbod, in zowel `src/product-data.mjs` als de zichtbare HTML/JSON-LD.
- **Capaciteit en uitbreiden:** verkoopachtige Q7-tabelrijen verwijderd; een zes-modulesom staat uitsluitend nog als expliciet niet-aangeboden **fabrikantvoorbeeld**.
- **Aankoopchecklists:** btw, salderen, dynamisch contract, plaatsing en datasheet verwijzen nu naar de vijf verkoopbare opstellingen.
- **HYXI POWER / Halo:** duidelijk vermeld dat Halo en andere fabrikantlijnen alleen informatief worden beschreven; geen verkoop via deze site.
- **Offerte:** bij ‘aansluiting onbekend’ wordt de bestaande standaardkeuze expliciet als **voorlopig** aangeduid; alle vijf daadwerkelijke pakketten en de bestaande lead-/Odoo-route blijven onveranderd.
- **Klantgerichte links:** geen Q7-teaser meer in de homepage en gerelateerde koopgerichte kaarten; fabrikantdata in de originele PDF's blijven beschikbaar.
- Geen nieuwe prijzen, retourclaims, SEO-URL's, database-/CRM-routes of klantdata.

## Niet uit te voeren zonder aanvullende verificatie
Het is via deze omgeving niet mogelijk Hostinger live HTML of fabrikantwebsites rechtstreeks te laden. De controle is daarom gebaseerd op de actuele GitHub `main`-bron en de overeengekomen pakketten; geen live-deployment of marktvoorraad geclaimd. De feitelijke leverbaarheid, omvormer-BAT-Q9-compatibiliteit, installatie-inclusie en actuele consumentprijzen moeten door eigenaar/inkoop per pakket schriftelijk worden bevestigd.

## QA
Regressietest `tests/offer-catalog-integrity.test.mjs` waarborgt het vijfpakketregister, commerciële Q9-only-vergelijkingen, correcte aanbiedingsteksten en de offerte. Bestaande tests `tests/market-comparisons-seo.test.mjs` en `tests/seo-longtail-phase2.test.mjs` zijn in lijn gebracht met de nieuwe inhoud, zonder technische fabrikantbronnen te verwijderen.

Run in de Node24-omgeving: `npm run build && npm test && npm run check`, plus bestaande browser-/productieprobes waar beschikbaar. GitHub Actions zijn niet vereist. **Publiceer pas na een codecheck op de final branch; een push naar main is nog geen bewijs dat Hostinger daadwerkelijk is gedeployed.**

## Uitgevoerde broncode-QA (21 november 2026)
- Branch bevat 30 publieke HTML-bronpagina's; de verwijderde Q7/Q9-keuzeroute staat niet in de sitemap of Vite-ingangen.
- **16/16** handmatige bronasserties op homepage, modellen, offerte, Q9-capaciteit/uitbreiding, HYXI POWER, centrale marktdata, prijscaveat en gegenereerde FAQ-bron zijn geslaagd.
- **9/9** merkvergelijkingen bevatten nu BAT-Q9, geen BAT-Q7 als vergelijking van het commerciële HYXI-aanbod, een expliciet HYXI AURA-offertelabel en relevante concurrentievoorbehouden. Ze behouden minimaal 900 leesbare woorden per artikel.
- Alle **30/30** pagina's zijn op één H1, bestaande canonieke URL, meta-descriptionlengte en interne links naar de vervallen Q7-keuzegids statisch gecontroleerd. Er zijn geen verwijzingen naar die oude route aangetroffen.
- Regres­sietest `tests/offer-catalog-integrity.test.mjs` toegevoegd en de twee eerdere keyword-/longtailtests aangepast. **Deze tests zijn niet hier uitgevoerd**: geen volledige lokale checkout en Node 24-runtime. De code is wel statisch geverifieerd.
- Actuele voorraad-, daadwerkelijke installatie-inclusie, fabrikantbeschikbaarheid en verkoopprijzen vergen een afzonderlijke, schriftelijke eigenaarscontrole. De site publiceert geen onbevestigde consumentprijzen.

## Betekenis voor de lancering
De **commerciële teksten en pakketkeuzemogelijkheden** zijn consistent gemaakt met het door de eigenaar goedgekeurde assortiment. Een broncontrole of GitHub-push is niet gelijk aan live-Hostinger-deployment of bewijs van productvoorraad. Controleer de gepubliceerde pagina's op productie vóór actieve campagnes. Geen echte proefleads of Odoo-tests nodig voor deze inhoudelijke correctie.
