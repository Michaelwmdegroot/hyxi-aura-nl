# Productinformatie en bronbeleid

Gecontroleerd op **14 november 2026**. Dit document legt vast welke productinformatie de landingspagina mag gebruiken en waar aanvullende bevestiging nodig is.

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
