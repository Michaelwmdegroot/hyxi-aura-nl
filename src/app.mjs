import { configuration, decimal } from './configurator-model.mjs';
import { energyScenario } from './energy-model.mjs';
import { mountFallbackScene } from './fallback-scene.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const icon = name => `<svg class="icon" aria-hidden="true"><use href="/icons.svg#${name}"></use></svg>`;
let chosen = configuration();
let mode = 'solar';
let batteryEnabled = true;
let scene = null;
let sceneStarting = false;
let fallbackScene = mountFallbackScene($('#scene-fallback'));

const stories = {
  solar: {
    index: '01', time: '13:00 · De zon doet het werk',
    on: { title: 'De zon op je dak.\nEnergie voor later.', description: 'Je panelen wekken meer op dan je nu gebruikt. AURA bewaart een deel van dat overschot voor vanavond.', flows: ['Je woning gebruikt eerst de zonnestroom.', 'De batterij slaat het overschot op.', 'Wat niet past, gaat naar het stroomnet.'], battery: 'AURA laadt op', caveat: 'Rekenvoorbeeld met een batterij die nog laadruimte heeft. De getallen zijn geen voorspelling voor jouw woning.' },
    off: { title: 'Overdag over.\nVanavond weer inkopen.', description: 'Zonder batterij gebruik je direct wat je nodig hebt. Het overschot van dit moment gaat terug naar het net.', flows: ['Je woning gebruikt 1,2 kW zonnestroom.', 'Er wordt geen energie bewaard voor later.', 'In dit voorbeeld lever je 3,0 kW terug.'], battery: 'Geen batterijopslag', caveat: 'Direct zonnestroom gebruiken blijft altijd zinvol. De waarde van teruglevering hangt af van je energiecontract.' },
  },
  evening: {
    index: '02', time: '20:00 · Jouw avond begint',
    on: { title: 'De avond aan.\nDe zon nog dichtbij.', description: 'De panelen rusten. Met de energie die je eerder hebt bewaard, helpt AURA je woning van stroom te voorzien.', flows: ['Je zonnepanelen wekken nu niets op.', 'AURA levert in dit voorbeeld 1,8 kW.', 'Pas als het nodig is, vult het net aan.'], battery: 'AURA levert stroom', caveat: 'Voorbeeld met voldoende opgeslagen energie. Bij een lege batterij of een hogere vraag heb je ook netstroom nodig.' },
    off: { title: 'De zon is weg.\nHet net neemt over.', description: 'Zonder opgeslagen zonnestroom komt de stroom voor je avond uit het elektriciteitsnet.', flows: ['De panelen leveren nu geen stroom.', 'Je woning vraagt in dit voorbeeld 1,8 kW.', 'Die stroom haal je volledig uit het net.'], battery: 'Geen batterijopslag', caveat: 'Dit voorbeeld vergelijkt alleen de energiestroom. Het berekent geen kosten, jaarrendement of terugverdientijd.' },
  },
  backup: {
    index: '03', time: '21:00 · Het stroomnet valt uit',
    on: { title: 'Het net valt weg.\nDe basis blijft aan.', description: 'Bij een geschikte back-upinstallatie kan AURA geselecteerde apparaten blijven voeden. Denk aan verlichting, koelkast en wifi.', flows: ['Het systeem ontkoppelt veilig van het net.', 'De batterij voedt de gekozen back-upgroepen.', 'Beschikbare lading en vermogen begrenzen wat kan.'], battery: 'AURA voedt back-up', caveat: 'Illustratie met 0,6 kW aan geselecteerde apparaten. Geen garantie voor je hele woning of een vaste overbruggingstijd.' },
    off: { title: 'Zonder back-up\nblijft het donker.', description: 'Als het net uitvalt en er geen geschikte back-upvoorziening is, worden de apparaten in dit voorbeeld niet meer gevoed.', flows: ['Het elektriciteitsnet is niet beschikbaar.', 'Er is geen batterij die de groepen overneemt.', 'De apparaten wachten tot het net terugkomt.'], battery: 'Geen back-upstroom', caveat: 'Een batterij geeft alleen noodstroom als installatie en instellingen daarop zijn ingericht. Zonnepanelen alleen zijn meestal geen back-up.' },
  },
};

function updateScenario() {
  const values = energyScenario(mode, batteryEnabled);
  const story = stories[mode][batteryEnabled ? 'on' : 'off'];
  $('#experience-card').dataset.mode = mode;
  $$('.scenario-button').forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const title = $('#scenario-title');
  title.replaceChildren();
  story.title.split('\n').forEach((line, index) => { if (index) title.append(document.createElement('br'), document.createTextNode(' ')); title.append(document.createTextNode(line)); });
  $('#scenario-description').textContent = story.description;
  story.flows.forEach((flow, index) => $(`#flow-${index + 1}`).textContent = flow);
  $('#scene-caveat').textContent = story.caveat;
  $('#scene-time').textContent = stories[mode].time;
  $('#battery-label').textContent = story.battery;
  $('#home-label').textContent = mode === 'backup' ? 'Back-upgroepen' : 'Je woning';
  for (const [id, value] of [['solar', values.solar], ['home', values.home], ['battery', Math.abs(values.battery)]]) {
    $(`#scene-${id}`).innerHTML = `${decimal(value, 1)} <em>kW</em>`;
  }
  $('#battery-toggle').setAttribute('aria-pressed', String(batteryEnabled));
  $('#battery-toggle-label').textContent = batteryEnabled ? 'Met AURA' : 'Zonder AURA';
  $('#energy-scene').setAttribute('aria-label', `${story.description} ${story.flows.join(' ')}`);
  scene?.setMode(mode);
  scene?.setBattery(batteryEnabled);
  fallbackScene?.setMode(mode);
  fallbackScene?.setBattery(batteryEnabled);
}

$$('.scenario-button').forEach(button => button.addEventListener('click', () => { mode = button.dataset.mode; updateScenario(); }));
$('#battery-toggle').addEventListener('click', () => { batteryEnabled = !batteryEnabled; updateScenario(); });

async function startScene() {
  if (sceneStarting) return;
  sceneStarting = true;
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'low-power' });
    if (!context) { $('#energy-scene').dataset.ready = 'fallback'; return; }
    const { mountEnergyScene } = await import('./energy-scene.mjs');
    scene = await mountEnergyScene($('#energy-scene'), {
      canvas, context,
      onReady() { $('#scene-fallback').hidden = true; $('#energy-scene').dataset.ready = 'true'; },
      onError() { $('#scene-fallback').hidden = false; $('#energy-scene').dataset.ready = 'fallback'; },
    });
    scene?.setMode(mode);
    scene?.setBattery(batteryEnabled);
  } catch {
    // The educational copy and every control work even when WebGL is unavailable.
    $('#energy-scene').dataset.ready = 'fallback';
    $('#scene-fallback').hidden = false;
  }
}
if ('IntersectionObserver' in window) {
  const sceneObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { startScene(); sceneObserver.disconnect(); }
  }, { rootMargin: '150px' });
  sceneObserver.observe($('#experience-card'));
} else startScene();


function updateConfiguration() {
  const phase = $('input[name="offer-phase"]:checked').value;
  const slider = $('#module-count');
  slider.max = phase === 'single' ? '2' : '3';
  if (Number(slider.value) > Number(slider.max)) slider.value = slider.max;
  chosen = configuration(phase, Number(slider.value));
  const moduleText = chosen.count + (chosen.count === 1 ? ' module' : ' modules');
  $('#module-count-label').textContent = chosen.advertisedKwh + ' kWh · ' + moduleText;
  slider.setAttribute('aria-valuetext', chosen.advertisedKwh + ' kWh · ' + moduleText);
  slider.style.setProperty('--range-progress', ((chosen.count - 1) * 100 / (Number(slider.max) - 1)) + '%');
  const ticks = Array.from({length: Number(slider.max)}, (_, i) => {
    const mark = document.createElement('span');
    mark.textContent = ((i + 1) * 9) + ' kWh';
    return mark;
  });
  $('#offer-capacity-ticks').replaceChildren(...ticks);
  $('#nominal-capacity').textContent = decimal(chosen.nominal);
  $('#usable-capacity').textContent = decimal(chosen.usable) + ' kWh';
  $('#stack-count').textContent = chosen.count + '× BAT-Q9';
  $('#stack-module-caption').textContent = '9,04 kWh per module';
  $('#offer-preview-label').textContent = chosen.phaseLabel + ' · ' + chosen.inverterKw + ' kW';
  $('#offer-inverter').textContent = chosen.phaseLabel + ' · ' + chosen.inverterKw + ' kW omvormer · back-up inbegrepen';
  $('#capacity-description').textContent = chosen.count === 1 ? 'Een compacte start met ruimte om te groeien.' : 'Meer BAT-Q9-modules voor later gebruik van je zonnestroom.';
  const stack = $('#stack-modules');
  while (stack.children.length > chosen.count) stack.lastElementChild.remove();
  while (stack.children.length < chosen.count) {
    const module = document.createElement('div');
    module.className = 'stack-module';
    stack.append(module);
  }
  $('#form-configuration').textContent = chosen.phaseLabel + ' · ' + chosen.advertisedKwh + ' kWh';
  $$('[data-quote-link]').forEach(link => {
    link.href = '/offerte/?phase=' + chosen.phase + '&moduleType=9&moduleCount=' + chosen.count;
  });
}
$$('input[name="offer-phase"]').forEach(input => input.addEventListener('change', updateConfiguration));
$('#module-count').addEventListener('input', updateConfiguration);
updateConfiguration();

const scrollHandler = () => {
  document.body.classList.toggle('is-scrolled', scrollY > 25);
  $('#mobile-cta').classList.toggle('is-visible', scrollY > 590);
};
window.addEventListener('scroll', scrollHandler, { passive: true });
scrollHandler();
if ('IntersectionObserver' in window) {
  const navigation = $$('.desktop-nav a');
  const navObserver = new IntersectionObserver(entries => {
    const active = entries.find(entry => entry.isIntersecting);
    if (!active) return;
    navigation.forEach(link => { if (link.hash === `#${active.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  }, { rootMargin: '-15% 0px -65% 0px' });
  navigation.forEach(link => { const section = $(link.hash); if (section) navObserver.observe(section); });
}

// Contact data stays in this document's memory. Never put it in a URL or storage.
const dialog = $('#lead-dialog');
const form = $('#lead-form');
const errorBox = $('#form-error');
let formStep = 0;
let submitting = false;
let completed = false;
let apiConfig = null;
let apiPending = null;
let idempotencyKey = null;
let lastBody = null;
let opener = null;

async function loadApiConfig(force = false) {
  if (apiPending && !force) return apiPending;
  apiPending = fetch('/api/config', { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(8000) })
    .then(async response => { if (!response.ok) throw new Error('Config unavailable'); const config = await response.json(); if (typeof config.leadEnabled !== 'boolean' || typeof config.csrfToken !== 'string') throw new Error('Invalid config'); apiConfig = config; return config; })
    .catch(() => { apiConfig = null; return null; })
    .finally(() => { apiPending = null; });
  return apiPending;
}

function showError(message, directContact = false) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  $('#unavailable-contact').hidden = !directContact;
}
function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
  $('#unavailable-contact').hidden = true;
  $$('[aria-invalid]').forEach(field => { field.removeAttribute('aria-invalid'); field.removeAttribute('aria-describedby'); });
  $('#annualUsage').setAttribute('aria-describedby', 'usage-hint');
}

function contactAvailability() {
  if (formStep !== 2 || submitting || completed) return;
  const unavailable = apiConfig !== null && !apiConfig.leadEnabled;
  $('#form-submit').disabled = unavailable;
  if (unavailable) {
    showError('Online aanvragen is op dit moment niet beschikbaar. Vraag je AURA-advies rechtstreeks aan bij Thuisbatterij Team of bel ons.', true);
  }
}

function setStep(step) {
  formStep = step;
  clearError();
  $$('.form-step').forEach(section => section.hidden = Number(section.dataset.step) !== step);
  dialog.setAttribute('aria-labelledby', ['lead-title', 'home-step-title', 'contact-step-title'][step]);
  $('#step-label').textContent = `Stap ${step + 1} van 3`;
  $('#lead-progress').style.width = `${(step + 1) / 3 * 100}%`;
  $('#form-back').hidden = step === 0;
  $('#form-next').hidden = step === 2;
  $('#form-submit').hidden = step !== 2;
  $('#form-submit').disabled = false;
  contactAvailability();
  dialog.scrollTop = 0;
  $(`.form-step[data-step="${step}"] h2`).focus({ preventScroll: true });
}

function openRequest(event) {
  // Preserve browser modified-link behavior and all ordinary non-JavaScript links.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  opener = event.currentTarget;
  if (dialog.open) return;
  dialog.showModal();
  updateConfiguration();
  const matchingPhase = form.querySelector('input[name="phase"][value="' + chosen.phase + '"]');
  if (matchingPhase) matchingPhase.checked = true;
  if (!completed) {
    setStep(formStep);
    loadApiConfig().then(contactAvailability);
  } else $('#success-title').focus({ preventScroll: true });
}
$$('[data-open-lead]').forEach(link => link.addEventListener('click', openRequest));
function closeDialog() {
  if (submitting) return;
  dialog.close();
  opener?.focus({ preventScroll: true });
}
$('.dialog-close').addEventListener('click', closeDialog);
$('#success-close').addEventListener('click', closeDialog);
dialog.addEventListener('cancel', event => { if (submitting) event.preventDefault(); });
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(); } });

function validateUsage() {
  const usage = $('#annualUsage');
  if (usage.value !== '' && (!Number.isInteger(Number(usage.value)) || Number(usage.value) < 500 || Number(usage.value) > 100000)) {
    showError('Vul een jaarverbruik in van 500 tot 100.000 kWh, of laat het veld leeg als je dit niet weet.');
    usage.setAttribute('aria-invalid', 'true'); usage.setAttribute('aria-describedby', 'usage-hint form-error'); usage.focus(); return false;
  }
  return true;
}
$('#form-next').addEventListener('click', () => { clearError(); if (formStep === 1 && !validateUsage()) return; setStep(Math.min(2, formStep + 1)); });
$('#form-back').addEventListener('click', () => { if (!submitting) setStep(Math.max(0, formStep - 1)); });

function payload() {
  const data = new FormData(form);
  const attribution = {};
  const params = new URLSearchParams(location.search);
  // Only forward bounded campaign codes; ignore arbitrary query parameters.
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const value = params.get(key);
    if (value && /^[a-zA-Z0-9_. -]{1,80}$/.test(value)) attribution[key] = value;
  }
  return {
    fullName: String(data.get('fullName') || '').trim(), email: String(data.get('email') || '').trim(),
    phone: String(data.get('phone') || '').trim(), postcode: String(data.get('postcode') || '').replace(/\s/g, '').toUpperCase(),
    consent: data.get('consent') === 'on', website: String(data.get('website') || ''),
    profile: { solar: data.get('solar'), annualUsage: data.get('annualUsage') ? Number(data.get('annualUsage')) : null,
      goal: data.get('goal'), phase: data.get('phase'), moduleType: 9, moduleCount: chosen.count, offerPhase: chosen.phase }, attribution,
  };
}

function validateContact() {
  for (const field of $$('.contact-grid input')) {
    field.value = field.value.trim();
    if (!field.checkValidity()) {
      const label = $(`label[for="${field.id}"]`).textContent.replace('*', '').trim().toLowerCase();
      showError(`Controleer je ${label}. ${field.id === 'postcode' ? 'Gebruik een Nederlandse postcode, bijvoorbeeld 1234 AB.' : 'Vul dit veld volledig en correct in.'}`);
      field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', 'form-error'); field.focus(); return false;
    }
  }
  if (!$('#consent').checked) { showError('Geef aan dat Thuisbatterij Team contact mag opnemen over deze aanvraag.'); $('#consent').focus(); return false; }
  return validateUsage();
}

function setSending(value) {
  submitting = value;
  $('#form-submit').disabled = value;
  $('#form-back').disabled = value;
  $('.dialog-close').disabled = value;
  form.setAttribute('aria-busy', String(value));
  $('#form-submit').innerHTML = value ? 'Je aanvraag wordt verstuurd…' : `Vraag mijn advies aan ${icon('arrow-up')}`;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || completed) return;
  if (formStep < 2) { $('#form-next').click(); return; }
  clearError();
  if (!validateContact()) return;
  const body = JSON.stringify(payload());
  if (body !== lastBody || !idempotencyKey) { lastBody = body; idempotencyKey = crypto.randomUUID(); }
  setSending(true);
  try {
    const config = await loadApiConfig(true);
    if (!config?.leadEnabled) { showError('Je aanvraag is nog niet verstuurd. Online aanvragen is tijdelijk niet beschikbaar. Neem rechtstreeks contact op met Thuisbatterij Team.', true); return; }
    const response = await fetch('/api/leads', { method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': config.csrfToken, 'Idempotency-Key': idempotencyKey },
      body, signal: AbortSignal.timeout(40000) });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok || typeof result.requestId !== 'string') {
      showError(result?.message || 'Je aanvraag is nog niet bevestigd. Probeer het opnieuw of neem rechtstreeks contact op met Thuisbatterij Team.', true);
      if (result?.fields) {
        const first = Object.keys(result.fields).find(name => ['fullName', 'email', 'phone', 'postcode', 'consent'].includes(name));
        if (first) { const field = $(`#${first}`); field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', 'form-error'); field.focus(); }
      }
      return;
    }
    completed = true;
    form.hidden = true;
    $('#success-state').hidden = false;
    dialog.setAttribute('aria-labelledby', 'success-title');
    $('#step-label').textContent = 'Aanvraag ontvangen';
    $('#lead-progress').style.width = '100%';
    $('#request-id').textContent = result.requestId;
    // Clear completed contact data from the form and local retry memory.
    form.reset(); lastBody = null; idempotencyKey = null;
    $('#success-title').focus({ preventScroll: true });
    dialog.scrollTop = 0;
  } catch {
    showError('We konden de ontvangst niet bevestigen. Probeer opnieuw; we gebruiken dezelfde aanvraagcode om dubbele verzending te voorkomen. Je kunt ons ook rechtstreeks bellen.', true);
  } finally { setSending(false); contactAvailability(); }
});

window.addEventListener('pagehide', () => { scene?.destroy(); scene = null; fallbackScene?.destroy(); fallbackScene = null; });
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    fallbackScene = mountFallbackScene($('#scene-fallback'));
    $('#scene-fallback').hidden = false;
    fallbackScene.setMode(mode); fallbackScene.setBattery(batteryEnabled);
    sceneStarting = false; startScene();
  }
});
