/**
 * Installation check: only non-identifying solar/phase/goal selections.
 * A native GET form works without JavaScript. Never persist inputs or add PII.
 */
const form = document.getElementById('installation-check-form');
const preview = document.getElementById('check-preview-summary');
if (form && preview) {
  const questions = Object.freeze({
    solar: Object.freeze({
      yes: 'Bestaande zonnepanelen: controleer hoe je huidige omvormer is aangesloten en of aanpassing nodig is.',
      planned: 'Zonnepanelen gepland: bekijk opwek en opslag samen, zodat het aansluitontwerp past bij beide onderdelen.',
      no: 'Geen zonnepanelen: bespreek het nut van opslag bij jouw energiecontract en gebruiksprofiel; er is geen eigen zonnestroomoverschot.'
    }),
    phase: Object.freeze({
      single: '1-faseaansluiting: laat beoordelen welke 1-fase-uitvoering en beveiliging geschikt zijn.',
      three: '3-fasenaansluiting: laat ook belasting en verdeling over de fasen controleren.',
      unknown: 'Aansluiting onbekend: dat is geen probleem; het team kan dit bij de beoordeling nagaan.'
    }),
    goal: Object.freeze({
      solar: 'Doel: eigen zonnestroom beter benutten. Jaarverbruik, opwek en teruglevering zijn dan belangrijk.',
      prices: 'Doel: flexibel omgaan met prijzen. Bespreek contract, aansturing en kosten zonder opbrengstgarantie.',
      backup: 'Doel: noodstroom. Noteer welke groepen belangrijk zijn en bespreek benodigde reserve en piekvermogen.',
      unsure: 'Doel nog open: een adviseur helpt kiezen tussen verbruik, flexibiliteit en noodstroom.'
    })
  });
  const update = () => {
    const data = new FormData(form);
    const summaries = ['solar', 'phase', 'goal']
      .map(name => questions[name][String(data.get(name) || '')])
      .filter(Boolean);
    preview.replaceChildren(...summaries.map(statement => {
      const paragraph = document.createElement('p');
      paragraph.textContent = statement;
      return paragraph;
    }));
    if (!summaries.length) {
      const paragraph = document.createElement('p');
      paragraph.textContent = 'Maak je keuze bij zonnepanelen. We tonen welke extra gegevens de installateur dan nodig heeft.';
      preview.append(paragraph);
    }
  };
  form.addEventListener('change', update);
  update();
}
