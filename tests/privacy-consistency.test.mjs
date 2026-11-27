import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = path => readFileSync(resolve(root, path), 'utf8');

test('publieke privacytekst beschrijft daadwerkelijke versleutelde opslag en handmatige retentie', () => {
  const privacy = file('privacy/index.html');
  assert.match(privacy, /versleuteld op in een beveiligde database/);
  assert.match(privacy, /leads@thuisbatterijteam\.nl/);
  assert.match(privacy, /handmatige beheerhandelingen/);
  assert.match(privacy, /nog geen automatische verwijdertaak actief/);
  assert.doesNotMatch(privacy, /bewaart geen aparte database/);
  assert.doesNotMatch(privacy, /gehashte kenmerken staan alleen in het werkgeheugen/);
  assert.match(privacy, /aura_beheer_session/);
});

test('privacyverklaring, database-privacyversie en mailvermelding zijn gelijk', () => {
  const privacy = file('privacy/index.html');
  const db = file('server/db/store.mjs');
  const mail = file('server/mail.mjs');
  assert.match(privacy, /Privacyverklaring · versie 27 november 2026/);
  assert.match(privacy, /naam, woonplaats, e-mailadres, telefoonnummer en postcode/);
  assert.match(db, /PRIVACY_VERSION = '2026-11-27'/);
  assert.match(mail, /Privacyversie: 2026-11-27/);
});

test('privacy notice explicitly names the already operational Odoo mail-import destination',async()=>{
  const html=await file('privacy/index.html');
  assert.match(html,/versie 27 november 2026/);
  assert.match(html,/leads@thuisbatterijteam\.nl/);
  assert.match(html,/Odoo CRM/);
  assert.match(html,/verwijdert niet automatisch/);
});
