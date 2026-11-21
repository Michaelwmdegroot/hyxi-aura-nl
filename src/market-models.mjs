// Bronnenregister voor vergelijkende, redactionele SEO-pagina's, 18-11-2026.
// Alleen publiek verifieerbare fabrikantproducten, geen actuele voorraad,
 // prijs, universele compatibiliteit of vergelijkingsscore.
export const MARKET_REVIEW_DATE = '2026-11-18';
export const MARKET_CATEGORIES = Object.freeze({
 hybride:'Hybride / alles-in-één',
 ac:'AC-gekoppeld / retrofit',
 modulair:'Modulaire batterij + geschikte omvormer',
 'plug-in':'Plug-in / micro-opslag'
});
export const MARKET_MODELS = Object.freeze([
  {
    "id": "hyxi-aura",
    "brand": "HYXI",
    "model": "AURA",
    "category": "hybride",
    "identity": "Ons HYXI AURA-aanbod: 1 fase met 5 kW en 9/18 kWh, of 3 fasen met 10 kW en 9/18/27 kWh; uitsluitend BAT-Q9",
    "source": "https://www.hyxipower.com/nl/ProductsDetail/hyxi-aura",
    "capacity": "8,6 kWh bruikbaar per BAT-Q9-module; vijf aangeboden pakketten",
    "limits": "Geïntegreerde ATS; alleen vijf BAT-Q9-pakketten worden door ons aangeboden; fase- en back-upgroepen controleren",
    "scope": "aanbod"
  },
  {
    "id": "sigenergy-sigenstor",
    "brand": "Sigenergy",
    "model": "SigenStor",
    "category": "hybride",
    "identity": "Modulair ecosysteem met Energy Controller, Sigen Battery en optionele modules",
    "source": "https://www.sigenergy.com/nl/support/download",
    "capacity": "Modules en controller afhankelijk van gekozen SigenStor-versie",
    "limits": "Bekijk BAT- en controller-datasheets voor Europese uitvoering",
    "scope": "vergelijking"
  },
  {
    "id": "sigenergy-neo",
    "brand": "Sigenergy",
    "model": "SigenStor Neo",
    "category": "hybride",
    "identity": "Nieuwe SigenStor Neo-serie met aparte Neo-documentatie",
    "source": "https://www.sigenergy.com/nl/support/download",
    "capacity": "Neo BAT-uitvoeringen op fabrikantdownloadpagina",
    "limits": "Niet verwarren met SigenStor van de eerdere generatie",
    "scope": "catalogus"
  },
  {
    "id": "alphaess-g3",
    "brand": "AlphaESS",
    "model": "SMILE-G3",
    "category": "hybride",
    "identity": "S5/B5 (1 fase) en T-serie (3 fasen); hybride en AC-gekoppelde varianten",
    "source": "https://www.alphaess.com/residential-energy-storage-system",
    "capacity": "Modulekeuze en capaciteit verschillen per SMILE-G3-uitvoering",
    "limits": "B5 AC, S5 hybride; exacte module en garantie controleren",
    "scope": "vergelijking"
  },
  {
    "id": "tesla-powerwall",
    "brand": "Tesla",
    "model": "Powerwall 3 / 3P",
    "category": "hybride",
    "identity": "Vaste opslag met geïntegreerde PV-omvormer en optionele Expansion-units",
    "source": "https://www.tesla.com/nl_nl/powerwall",
    "capacity": "13,5 kWh bruikbaar per Powerwall volgens Tesla",
    "limits": "NL/Europese aansluiting en 3P/3-model expliciet controleren",
    "scope": "vergelijking"
  },
  {
    "id": "enphase-flexphase",
    "brand": "Enphase",
    "model": "IQ Battery 5P with FlexPhase",
    "category": "ac",
    "identity": "AC-gekoppeld met ingebouwde IQ8T-BAT micro-omvormers",
    "source": "https://enphase.com/nl-nl/media/22099",
    "capacity": "5,0 kWh bruikbaar per unit",
    "limits": "1- of 3-fase configuratie en back-upvereisten apart controleren",
    "scope": "vergelijking"
  },
  {
    "id": "huawei-luna",
    "brand": "Huawei",
    "model": "LUNA2000-S1",
    "category": "modulair",
    "identity": "Smart String LUNA2000 met bijpassende Huawei-omvormers",
    "source": "https://solar.huawei.com/nl/products/LUNA2000-7-14-21-S1/specs/",
    "capacity": "5,0 of 6,9 kWh moduleklassen; meerdere combinaties",
    "limits": "Geen universele compatibiliteit met willekeurige bestaande omvormer",
    "scope": "vergelijking"
  },
  {
    "id": "byd-hvs",
    "brand": "BYD",
    "model": "Battery-Box Premium HVS",
    "category": "modulair",
    "identity": "Hoogspanningsbatterij zonder geïntegreerde AC-omvormer",
    "source": "https://www.bydbatterybox.com/",
    "capacity": "5,1 tot 12,8 kWh bruikbaar per HVS-toren, afhankelijk van modules",
    "limits": "Alleen vergelijken als complete set met compatibele externe omvormer",
    "scope": "vergelijking"
  },
  {
    "id": "byd-hvm",
    "brand": "BYD",
    "model": "Battery-Box Premium HVM",
    "category": "modulair",
    "identity": "HVM-serie voor andere capaciteitsreeksen dan HVS",
    "source": "https://www.bydbatterybox.com/",
    "capacity": "8,1 tot 21,7 kWh per HVM-toren volgens fabrikant",
    "limits": "Compatibiliteitslijst en BCU-versie vereist",
    "scope": "catalogus"
  },
  {
    "id": "solaredge-400v",
    "brand": "SolarEdge",
    "model": "Home Battery 400V",
    "category": "modulair",
    "identity": "DC-batterij voor SolarEdge Home Wave/Hub 1-fase-ecosysteem",
    "source": "https://www.solaredge.com/nl/batterijen/thuisbatterij-400v",
    "capacity": "9,7 kWh per unit volgens SolarEdge",
    "limits": "Back-up vereist de juiste Hub en Backup Interface",
    "scope": "vergelijking"
  },
  {
    "id": "solaredge-48v",
    "brand": "SolarEdge",
    "model": "Home Battery 48V",
    "category": "modulair",
    "identity": "DC-batterij voor SolarEdge Home 3-fase-ecosysteem",
    "source": "https://www.solaredge.com/nl/producten/thuis/batterijen",
    "capacity": "Tot circa 4,85 kWh per module, variantafhankelijk",
    "limits": "Verschillend product van Home Battery 400V",
    "scope": "catalogus"
  },
  {
    "id": "ecoflow-powerocean",
    "brand": "EcoFlow",
    "model": "PowerOcean 3-fase",
    "category": "hybride",
    "identity": "Hybride PV-/batterijsysteem met modulaire packs",
    "source": "https://energy.ecoflow.com/nl/products/powerocean",
    "capacity": "Begint bij 5 kWh, volgens fabrikant tot 45 kWh uitbreidbaar",
    "limits": "Bruikbare opslag en back-up afhankelijke configuratie",
    "scope": "vergelijking"
  },
  {
    "id": "sessy-5",
    "brand": "Sessy",
    "model": "Sessy 5 kWh",
    "category": "ac",
    "identity": "AC-gekoppelde thuisbatterij met geïntegreerde AC-omvormer",
    "source": "https://www.sessy.nl/specificaties/",
    "capacity": "5 kWh bruikbaar",
    "limits": "Onafhankelijk van bestaande zonnepanelenomvormer volgens fabrikant",
    "scope": "vergelijking"
  },
  {
    "id": "sessy-10",
    "brand": "Sessy",
    "model": "Sessy 10 kWh",
    "category": "ac",
    "identity": "Grotere AC-gekoppelde uitvoering met eigen omvormer",
    "source": "https://www.sessy.nl/specificaties/",
    "capacity": "10 kWh bruikbaar",
    "limits": "Verschil in doel en vermogen met 5 kWh-uitvoering bevestigen",
    "scope": "catalogus"
  },
  {
    "id": "growatt-apx",
    "brand": "Growatt",
    "model": "APX HV Battery 2.0",
    "category": "modulair",
    "identity": "Hoogspanningsbatterij met moduleoptimalisatie",
    "source": "https://en.growatt.com/products/apx-hv-battery-2.0",
    "capacity": "5–30 kWh volgens fabrikant",
    "limits": "Vereist compatibele omvormer en systeemconfiguratie",
    "scope": "catalogus"
  },
  {
    "id": "foxess-ep6",
    "brand": "Fox ESS",
    "model": "EP6 Plus",
    "category": "modulair",
    "identity": "Modulaire EP6-batterij uit Fox ESS-ecosysteem",
    "source": "https://nl.fox-ess.com/downloads/datasheets",
    "capacity": "5,76 kWh nominale module-energie volgens datasheet",
    "limits": "Compatibele Fox-omvormer en bruikbare energie controleren",
    "scope": "catalogus"
  },
  {
    "id": "goodwe-lynx",
    "brand": "GoodWe",
    "model": "Lynx Home F",
    "category": "modulair",
    "identity": "Hoogspannings-LFP-batterij voor geselecteerde GoodWe-omvormers",
    "source": "https://nl.goodwe.com/lynx-home-f-series-high-voltage-lithium-battery",
    "capacity": "6,6–16,4 kWh serie, modelafhankelijk",
    "limits": "Niet gelijkstellen aan nieuwere Lynx Home F G2",
    "scope": "catalogus"
  },
  {
    "id": "homewizard-plugin",
    "brand": "HomeWizard",
    "model": "Plug-In Battery",
    "category": "plug-in",
    "identity": "Zelf te plaatsen plug-in batterij met P1-meter",
    "source": "https://www.homewizard.com/nl/plug-in-battery/",
    "capacity": "2,688 kWh nominale batterij per unit",
    "limits": "Andere installatie- en vermogensklasse dan vaste HYXI AURA",
    "scope": "catalogus"
  },
  {
    "id": "marstek-venus",
    "brand": "Marstek",
    "model": "VENUS E 4.0",
    "category": "plug-in",
    "identity": "Plug-in AC-batterij in VENUS E productreeks",
    "source": "https://marstekenergy.com/nl-nl/collections/zonnepaneelsysteem-met-batterij",
    "capacity": "5 kWh klasse volgens fabrikantenoverzicht",
    "limits": "Niet dezelfde installatiecategorie als hybride all-in-one",
    "scope": "catalogus"
  },
  {
    "id": "zendure-solarflow",
    "brand": "Zendure",
    "model": "SolarFlow 2400 AC+",
    "category": "plug-in",
    "identity": "AC-gekoppeld retrofit/plug-in opslagconcept",
    "source": "https://zendure.com/collections/solarflow-series",
    "capacity": "Modulaire configuratie afhankelijk van gekoppelde packs",
    "limits": "Netto AC-vermogen en bekabeling onder lokale regels beoordelen",
    "scope": "catalogus"
  },
  {
    "id": "hyxi-halo",
    "brand": "HYXI",
    "model": "Halo",
    "category": "plug-in",
    "identity": "Andere HYXI-productlijn: plug-in AC-gekoppelde micro-ESS",
    "source": "https://www.hyxipower.com/nl/ProductsDetail/hyxi-halo",
    "capacity": "3 kWh-klasse volgens fabrikant",
    "limits": "Niet dezelfde productfamilie of offerte als HYXI AURA",
    "scope": "catalogus"
  }
].map(Object.freeze));
export const COMPARE_SLUGS = Object.freeze({
 'sigenergy-sigenstor':'sigenergy',
 'alphaess-g3':'alphaess',
 'tesla-powerwall':'tesla-powerwall',
 'enphase-flexphase':'enphase',
 'huawei-luna':'huawei',
 'byd-hvs':'byd',
 'solaredge-400v':'solaredge',
 'ecoflow-powerocean':'ecoflow',
 'sessy-5':'sessy'
});
