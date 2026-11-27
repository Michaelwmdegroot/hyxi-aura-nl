# Productinformatie en bronbeleid

Gecontroleerd op **16 november 2026** aan de hand van de twee door eigenaar geüploade Engelstalige V2.1-PDF’s en de actuele Engelse HYXI-productpagina. Dit document legt vast welke productinformatie de landingspagina mag gebruiken en waar aanvullende bevestiging nodig is.

## Exploitant, adviseur en fabrikant

HYXI AURA is een product van Zhejiang Hyxi Technology Co., Ltd. Deze website is een commerciële informatie- en aanvraagwebsite die aanvragen naar **Thuisbatterij Team** leidt. De eigen website is niet de officiële website van HYXI. Verwijzingen naar Thuisbatterij Team en NIVO Groep Holland leggen de advies- en installatiecontext uit; ze bewijzen geen fabrikantstatus, certificering, exclusiviteit of officieel dealerschap.

De geïmplementeerde exploitant is **NIVO Groep Holland B.V.**, KvK 95227768, Lireweg 52, 2153 PH Nieuw-Vennep. NIVO beheert de website en de gegevensverwerking op deze website. **Thuisbatterij Team** ontvangt de interne advies- en offerteaanvragen op `leads@thuisbatterijteam.nl` en behandelt die inhoudelijk; `info@thuisbatterijteam.nl` blijft algemeen contact- en privacyadres. De bestaande e-mailimport zet een ontvangen HYXI-mail vervolgens als verkoopkans in Odoo CRM, zonder directe HYXI/Odoo API-koppeling. Deze taakverdeling staat op de bronnen- en privacypagina. Hieruit volgt geen claim van een moeder-dochterrelatie, exclusiviteit of fabrikantstatus. Houd de openbare informatie gelijk aan de daadwerkelijk ingestelde ontvanger.

## Primaire bronnen

| Bron | Versie of datum | Toepassing |
| --- | --- | --- |
| [Nederlandse productpagina](https://www.hyxipower.com/nl/ProductsDetail/hyxi-aura) | Gelezen 2026-11-14 | Functies, officiële productafbeeldingen |
| [Engelse productpagina](https://www.hyxipower.com/en/ProductsDetail/hyxi-aura) | Gelezen 2026-11-14 | Actuele documentlinks |
| [1-fase datasheet](https://webfile.hyxipower.com/soft/20261111/HYX-H%283-12%29K-HSA2_Datasheet_V2.1-20261026_EN-%28Preliminary%29.pdf) | V2.1, 2026-10-26, Preliminary | HSA2 en BAT-Q7/BAT-Q9 |
| [3-fasen datasheet](https://webfile.hyxipower.com/soft/20261111/HYX-H%285-30%29K-HTA2_Datasheet_V2.1-20261026_EN-%28Preliminary%29.pdf) | V2.1, 2026-10-26, Preliminary | HTA2 en BAT-Q7/BAT-Q9 |
| [Europese garantievoorwaarden](https://webfile.hyxipower.com/soft/20261010/HYXiPOWER-Products-Warranty-Terms--Conditions-EU_EN-20260918.pdf) | 2026-09-18 | Termijnen, batterijlimieten en uitsluitingen |

De fabrikant koppelde de huidige datasheets via de Engelse pagina; de Nederlandse pagina bood die downloadlinks bij deze controle niet. Oudere zoekresultaten bevatten andere specificaties. Gebruik de genoemde versie als basis en controleer opnieuw bij een nieuwe productrelease. Ook de huidige documenten zijn expliciet voorlopig.

Lokale, ongewijzigde kopieën staan in `public/downloads/` onder de stabiele namen `hyxi-aura-1-fase-datasheet.pdf`, `hyxi-aura-3-fasen-datasheet.pdf` en `hyxi-eu-garantievoorwaarden.pdf`.

## Gegevens voor de configurator

De batterijtabellen op de laatste pagina van beide datasheets vermelden:

| Grootheid | BAT-Q7 | BAT-Q9 |
| --- | ---: | ---: |
| Totale energie | 7,03 kWh | 9,04 kWh |
| Bruikbare energie | 6,7 kWh | 8,6 kWh |
| Nominaal laad-/ontlaadvermogen | 3,5 kW | 4,6 kW |
| Gewicht | 68 kg | 79 kg |

Er passen één tot zes modules per controller. Zes BAT-Q9-modules leveren rekenkundig 54,24 kWh totale en 51,6 kWh bruikbare capaciteit. De fabrikant rondt de totale capaciteit in marketing af naar 54 kWh. Een modulevermogen is niet automatisch het systeemvermogen: ook de omvormer en installatie begrenzen dit.

Brondata staat in `src/product-data.mjs`. Berekeningen op de pagina moeten nominale capaciteit, bruikbare capaciteit, elektrisch vermogen en een eventueel illustratief energiemodel uit elkaar houden.

## Back-up en omvormers

De datasheets beschrijven 1 fase met 3–12 kW en 3 fasen met 5–30 kW nominale uitvoering, een maximale doorlaatstroom van 63 A en een omschakeltijd van 0 ms. De productpagina beschrijft een geïntegreerde ATS, zonder losse gateway. Dit is geen belofte dat ieder apparaat of iedere groep bij iedere laadstatus blijft functioneren. De installateur bepaalt de aansluiting en controleert het beschikbare vermogen, fasebelasting, piekbelasting en de noodzakelijke reserve.

De 3-fasendatasheet bevat kennelijke tabelonvolkomenheden, waaronder HSA2-labels in een HTA2-document en een verdachte PV-invoerwaarde van 160000 W. Deze waarden worden niet overgenomen.

## Garantie, omstandigheden en levensduur

De Europese voorwaarden noemen 10 jaar voor de vermelde AURA-omvormers, BAT-Q9 en bases. BAT-Q7 ontbreekt in die tabel. Voor BAT-Q9 vermeldt de doorvoertabel 50,7 MWh; daarnaast gelden de overige vervalvoorwaarden. Controleer de definitieve garantie bij het voorstel. Arbeid en accessoires vallen niet automatisch onder dezelfde dekking.

De datasheet vermeldt IP66 voor batterij en omvormer. Voor de batterij geldt −20 tot +55 °C; voor de omvormer −30 tot +60 °C. De productpagina bundelt dit onder een ruimere marketingclaim. Een systeemclaim mag niet zonder toelichting de ruimste componentwaarde gebruiken.

De batterijcycluswaarde is 10.000 onder de gespecificeerde testcondities, met 60% EOL. De woorden over 15 jaar ontwerpgebruik en onbeperkte cycli op de marketingpagina zijn geen onbeperkte garantie. Vermijd een vereenvoudigde garantieclaim.

## Introductie en beschikbaarheid

[HYXI's aankondiging](https://www.hyxipower.com/en/NewsDetail/323), gepubliceerd 24 juni 2026, beschrijft de internationale introductie op 23 juni. [BM Energy kondigde een Nederlands introductie-evenement aan](https://bmenergy.nl/en/blog/hyxi-aura-launch-event) voor 10 november 2026. Dat evenement bewijst geen voorraad of leverdatum bij Thuisbatterij Team. De pagina gebruikt daarom actuele beschikbaarheid op aanvraag, zonder fictieve countdown.

## Redactionele grenzen

- Geen verzonnen installatieprijs, levertijd, terugverdientijd, klantbeoordelingen of aantal installaties.
- Geen onvoorwaardelijke besparing van 20% uit een marketingvergelijking zonder duidelijke referentiesituatie.
- Geen claim dat een complete woninginstallatie in vijf of tien minuten klaar is.
- Geen algemene compatibiliteitsgarantie voor bestaande zonnepanelen, omvormers, leveranciers of EMS-diensten.
- Geen fabrikant-, dealer- of certificeringsstatus die de opdrachtgever niet heeft bevestigd.
- Illustraties en interactieve voorbeelden worden als uitleg behandeld, niet als persoonlijk financieel advies of prestatiegarantie.

## Onderhoud

Bij wijziging van brondata: download de nieuwe fabrikantdocumenten, vergelijk de verschillen, werk de gegevensmodule en zichtbare toelichting samen bij en noteer de nieuwe controledatum. Bewaar oudere bronverwijzingen in Git. Laat de installateur het uiteindelijke ontwerp en de offerte toetsen aan de daadwerkelijk leverbare uitvoering.

## Aanvullende broncheck voor Phase 4 — 16 november 2026

De [officiële HYXI AURA-pagina (NL)](https://www.hyxipower.com/nl/ProductsDetail/hyxi-aura) is opnieuw gecontroleerd. Daarop worden de geïntegreerde ATS, 0 ms omschakeling, 63 A doorlaatstroom per fase en modulaire uitbreiding nog beschreven. Dit herbevestigt de kwalitatieve uitleg in de nieuwe kennisgidsen, niet de geschiktheid van een specifieke woning.

De in deze repository bewaarde datasheets blijven **V2.1 van 26 oktober 2026, Preliminary**. Er is bij deze sprint **geen nieuwe definitieve datasheet geclaimd**, geen garantie in de bronmodule gewijzigd en geen prijzen of beschikbaarheid toegevoegd. Gebruik dezelfde brondata voor de nieuwe inhoud:
- `/kennis/bat-q7-vs-bat-q9/`: per module BAT-Q7 7,03/6,7 kWh en 3,5 kW / 68 kg; BAT-Q9 9,04/8,6 kWh en 4,6 kW / 79 kg; geaggregeerde kWh zijn rekenkundige illustraties.
- `/kennis/noodstroom/`: geïntegreerde ATS en fabrikantvermelde 0 ms, 63 A **doorlaatstroom** expliciet niet gelijkgesteld aan geleverd noodvermogen; installateur bepaalt groepen, reserve en aansluiting.

Inzichtelijk bronlog: [Phase 4 SEO-release](PHASE4-SEO-RELEASE-2026-11-16.md). Controleer beide fabrikantdocumenten opnieuw vóór een bindende klantofferte.
 
## Pre-GSC hercontrole — 16 november 2026

**Zelfde fabrikantdocumenten gecontroleerd:** de Engelse [HYXI AURA-pagina](https://www.hyxipower.com/en/ProductsDetail/hyxi-aura) biedt op 16 november nog de twee 5-pagina's **Preliminary V2.1**-datasheets aan. Het bestand van de eigenaar voor HSA2 is 1.497.333 bytes en heeft SHA-256 `6c5c6c42383c469cc36fb622cb7748c570333888de887a6809953366a2c222fe`; HTA2 is 1.498.576 bytes, SHA-256 `1d0a8e3c737f0bca427e6539071c407f4b76ed0687bbef15ed9f60f5c1c0a928`. De bestanden in deze repo hebben diezelfde lengte, maar een aparte bytes-hash vergelijking van de GitHub-blob is **niet** uitgevoerd; claim niet dat exact gelijke bytes onafhankelijk bewezen zijn.

**Feitelijk bevestigd:** BAT-Q7 = 7,03/6,7 kWh, 3,5 kW nominaal, 68 kg; BAT-Q9 = 9,04/8,6 kWh, 4,6 kW nominaal, 79 kg. Eén tot zes modules per controller. 0 ms en 63 A zijn fabrikantspecificaties van omschakeling en netdoorlaat, geen gegarandeerd uit batterij beschikbaar vermogen. Batterijbedrijfstemperatuur −20 tot +55°C, omvormer −30 tot +60°C. 10.000 cycli staat bij 25°C±2°C en 60% EOL, niet onder alle omstandigheden of als onbeperkte garantie.

**Letterlijke voorlopige HTA2-fouten:** HSA2-modelnamen in tabellen onder HTA2-titel op pagina's 1–4; `Max. PV Input Power` op pagina 1 voor de 8k-variant wordt als `160000W` weergegeven. Dit is een **kennelijk onjuist veld**, maar onze website corrigeert of kopieert de waarde **niet** als definitieve specificatie. De publieke bronnenpagina benoemt de inconsistenties en vraagt om bevestiging van exacte modelcode en uitvoering vóór een offerte.

**Aanvullende unieke bezoekersvraag:** `/kennis/1-fase-of-3-fasen/` beschrijft het werkelijke verschil tussen de HSA2- en HTA2-productfamilies, aansluit-/PV-/back-upafwegingen, waar de PDF's fouten bevatten en hoe je de juiste installatievraag voorbereidt. Geen landelijke compatibiliteitsclaim, geen verzonnen leverbare modelcodes/prijzen.

**Nieuwe operationele privacytransparantie:** de zakelijke e-mailimport van `leads@thuisbatterijteam.nl` naar Odoo CRM was door de eigenaar voor advies én offerte bevestigd. De privacyverklaring noemt die **werkelijke downstreamkopie** nu expliciet; versie `2026-11-27` wordt voor nieuwe aanvragen samen met de SQL-aanvraagregistratie en de uitgaande CRM- en salesnotificatie vastgelegd. Geen verandering aan Odoo of SMTP.

Zie [de volledige 8-pagina audit en bronbeoordeling](PRE-GSC-CONTENT-FACT-AUDIT-2026-11-16.md).
