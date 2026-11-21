/**
 * HYXI AURA source-backed product data.
 * Verified 2026-11-14 against manufacturer V2.1-20261026 preliminary datasheets.
 * Battery nominal energy, usable energy and power are different quantities.
 * Availability, final specification and installation suitability require confirmation.
 */
export const verifiedAt = '2026-11-14';

export const MODULES = Object.freeze({
  7: Object.freeze({ nominal: 7.03, usable: 6.7, power: 3.5, weight: 68 }),
  9: Object.freeze({ nominal: 9.04, usable: 8.6, power: 4.6, weight: 79 }),
});

export const sourceUrls = Object.freeze({
  product: 'https://www.hyxipower.com/nl/ProductsDetail/hyxi-aura',
  productEnglish: 'https://www.hyxipower.com/en/ProductsDetail/hyxi-aura',
  singlePhase: 'https://webfile.hyxipower.com/soft/20261111/HYX-H%283-12%29K-HSA2_Datasheet_V2.1-20261026_EN-%28Preliminary%29.pdf',
  threePhase: 'https://webfile.hyxipower.com/soft/20261111/HYX-H%285-30%29K-HTA2_Datasheet_V2.1-20261026_EN-%28Preliminary%29.pdf',
  warranty: 'https://webfile.hyxipower.com/soft/20261010/HYXiPOWER-Products-Warranty-Terms--Conditions-EU_EN-20260918.pdf',
  localSinglePhase: '/downloads/hyxi-aura-1-fase-datasheet.pdf',
  localThreePhase: '/downloads/hyxi-aura-3-fasen-datasheet.pdf',
  localWarranty: '/downloads/hyxi-eu-garantievoorwaarden.pdf',
});

export const faqs = Object.freeze([
  {
    question: 'Wat kost een HYXI AURA inclusief installatie?',
    answer: 'De prijs hangt af van de batterijmodules, de omvormer, je meterkast en de gewenste back-upvoorziening. We publiceren daarom nog geen vanafprijs. Thuisbatterij Team bekijkt je situatie en bevestigt de actuele prijs, beschikbaarheid en installatiekosten in een persoonlijk voorstel. Je aanvraag is vrijblijvend.',
  },
  {
    question: 'Kan de AURA bij mijn bestaande zonnepanelen?',
    answer: 'Dat moet per installatie worden beoordeeld. De AURA combineert een hybride omvormer met batterijopslag. Of je bestaande omvormer kan blijven, hangt onder meer af van het merk, het aansluitschema en de gewenste functies. Geef bij je aanvraag aan dat je al zonnepanelen hebt; de installateur controleert de passende aansluiting.',
    sourceUrl: sourceUrls.product,
    sourceLabel: 'Officiële productinformatie',
  },
  {
    question: 'Is de AURA geschikt voor 1 fase én 3 fasen?',
    answer: 'Thuisbatterij Team biedt 1-fasepakketten met een 5 kW omvormer en 9 of 18 kWh BAT-Q9-opslag, en 3-fasenpakketten met een 10 kW omvormer en 9, 18 of 27 kWh BAT-Q9-opslag. De fabrikant beschrijft daarnaast andere vermogens, maar die bieden wij hier niet aan. De installateur controleert je aansluiting, gewenste back-upgroepen en de uiteindelijke uitvoering.',
    sourceUrl: sourceUrls.productEnglish,
    sourceLabel: 'Datasheets van beide uitvoeringen',
  },
  {
    question: 'Heb ik bij stroomuitval automatisch overal stroom?',
    answer: 'De AURA heeft geïntegreerde back-uptechniek. Welke groepen bij uitval blijven werken, wordt bij de installatie bepaald. Beschikbaar vermogen en overbruggingstijd hangen af van de omvormer, batterijmodules, laadstatus en aangesloten apparaten. De genoemde 63 A is de doorlaatstroom, geen beloofd batterijvermogen. De fabrikant vermeldt 0 ms omschakeltijd.',
    sourceUrl: sourceUrls.threePhase,
    sourceLabel: 'Back-upspecificaties in de datasheet',
  },
  {
    question: 'Kan ik klein beginnen en later uitbreiden?',
    answer: 'AURA is technisch modulair. Wij bieden hier vijf BAT-Q9-pakketten aan: 9 en 18 kWh bij 1 fase (5 kW) en 9, 18 en 27 kWh bij 3 fasen (10 kW). De fabrikant beschrijft ook andere modules, maar die maken geen deel uit van ons standaardaanbod. Geschiktheid, latere uitbreiding en back-upgroepen beoordelen we per woning.',
    sourceUrl: sourceUrls.singlePhase,
    sourceLabel: 'Batterijgegevens in de datasheet',
  },
  {
    question: 'Hoe zit het met de garantie?',
    answer: 'De Europese voorwaarden van september 2026 noemen 10 jaar voor de vermelde AURA-omvormers en BAT-Q9, met aanvullende voorwaarden en batterijlimieten. Een ontwerp voor 15 jaar gebruik is geen garantie van 15 jaar. Je ontvangt de actuele voorwaarden die horen bij het aangeboden BAT-Q9-pakket en de bijbehorende omvormer.',
    sourceUrl: sourceUrls.warranty,
    sourceLabel: 'Europese garantievoorwaarden',
  },
  {
    question: 'Heeft een thuisbatterij zin zonder zonnepanelen?',
    answer: 'Opslag kan ook interessant zijn om energiegebruik in de tijd te verschuiven of als onderdeel van een back-upvoorziening. Of dat financieel zinvol is, hangt af van je contract, tarieven, verbruik en de beschikbare aansturing. Zonder eigen zonnestroom is er geen zonnestroomoverschot om te bewaren. We beoordelen daarom eerst je doel en situatie.',
  },
  {
    question: 'Hoeveel bespaar ik en wanneer verdien ik de batterij terug?',
    answer: 'Dat is vooraf niet met één bedrag te zeggen. Je verbruiksprofiel, zonnestroomoverschot, energiecontract, laadverliezen, instellingen en aanschafprijs bepalen het resultaat. De voorbeelden op deze pagina leggen de werking uit; het zijn geen rendementsprognoses. Voor een onderbouwde keuze bekijken we je eigen gegevens. We garanderen geen terugverdientijd of handelsopbrengst.',
  },
]);
