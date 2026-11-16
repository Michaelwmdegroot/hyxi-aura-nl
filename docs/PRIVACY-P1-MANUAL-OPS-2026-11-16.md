# HYXI AURA — P1 privacybeheer: dossierexport en handmatige verwijdering
**Uitvoering:** 16 november 2026 · **Scope:** uitsluitend de bestaande HYXI-database en het afgeschermde `/beheer`.  
**Issue:** [#2](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/2); operationele nevenkopieën onder [#9](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/9).

## Waarom deze veilige eerste stap

De openbare privacytekst vermeldt een bewaarbeleid voor afgesloten niet-klantaanvragen van zes maanden na het laatste contact. Dat beleid was nog geen afdwingbare verwijderfunctie. De bestaande database bevat wel `contact_requested_at` (eerste ontvangst), maar **geen betrouwbaar, volledig vastgelegd laatste contactmoment** uit de verkoopopvolging in Odoo of e-mail. De applicatie kan dus **niet verantwoord zelf vaststellen** dat zes maanden zijn verstreken. Er draait in deze release **geen automatische verwijdering**, cronjob of retrospectieve opschoning.

## Wat nu in code is gerealiseerd

- In een bestaand HYXI-dossier ziet **alleen een geautoriseerde beheerder** een sectie *Privacy & dossierbeheer*. Salesgebruikers zien noch de sectie, noch de operationele API.
- **Export**: knop `Dossier exporteren als JSON`. Een beveiligde POST met sessie, Origin-/CSRF-controle en server-side admin/actieve account-check ontsleutelt één dossier en logt `privacy_export` in `aura_admin_audit`. De browser downloadt JSON met het relevante profiel, contactgegevens en eventuele versleuteld opgeslagen interne notities. Deze export is **niet automatisch geschikt om ongewijzigd aan een verzoeker te verstrekken**: beoordeel interne/derdeninformatie en bewaar het bestand uitsluitend op een veilige plek. Geen PII in de URL of externe trackers.
- **Handmatige HYXI-databaseverwijdering**: beheerder kiest `retention_reviewed` of `verified_privacy_request`, typt **exact** het aanvraagnummer en bevestigt twee afzonderlijke reviews: de rechtmatigheid/bewaarplicht én het bestaan van onafhankelijke kopieën. Alleen daarna accepteert de CSRF-beveiligde POST de actie.
- `retention_reviewed` is uitsluitend beschikbaar voor status `lost` of `not_suitable`. `verified_privacy_request` vereist nog steeds expliciete handmatige beoordeling en kan niet worden gebruikt voor `won` (klantdossiers kunnen aparte verplichtingen hebben). Dit is een **administratieve werkafspraak**, geen juridisch geautomatiseerd besluit.
- **Mailveiligheid:** `pending`, `retry_wait` en `sending` blokkeren de verwijdering; eerst de bestaande mailcontrole afhandelen. Na een gecommit SQL-transactie wissen `ON DELETE CASCADE` de versleutelde lead, submission-keys, events en outboxregels. Auditregels worden van het lead-ID ontkoppeld, daarna wordt een reden-only `privacy_delete`-auditrecord zonder klantgegevens geschreven.
- **Geen destructieve verwerking door deployments/tests:** de code maakt uitsluitend een beschikbare, uitdrukkelijke beheeractie. Alle geautomatiseerde tests gebruiken een *disposable* MySQL8-CI-database met fictieve gegevens en mock-beheeraccounts. Er wordt geen echte HYXI-lead verwijderd, geen SMTP-mail verstuurd, niets in Odoo aangepast en geen nieuwe migratie uitgevoerd.

## Wat deze functie NIET verwijdert

De verwijdering uit HYXI veroorzaakt **geen** automatische verwijdering uit:
- de mailbox `leads@thuisbatterijteam.nl` of kopieën in andere e-mailfolders;
- Odoo CRM, waar een bericht reeds als verkoopkans is verwerkt;
- Hostinger's eigen dagelijkse, door eigenaar geaccepteerde backups (kopieën volgen diens eigen bewaarroutine);
- andere wettelijk vereiste administratie.

Verwerk een geverifieerd privacyverzoek ook in die afzonderlijke systemen door een bevoegd persoon volgens de voor elk systeem geldende rechten en uitzonderingen. Een HYXI-successcherm mag daarom uitsluitend **HYXI-databaseverwijdering** bevestigen, geen wereldwijd vergeten.

## Nog te doen in latere fase

1. Vastleggen van een controleerbaar `last_contact_at` of dossier-afsluitmoment dat klopt met werkelijke salesopvolging, pas daarna eventuele geautomatiseerde bewaartermijnacties ontwerpen.
2. Bevoegd en controleerbaar verzoekenregister/volledige afhandeling van e-mail- en Odoo-kopieën; juridische uitzonderingen en verwerkersrelaties.
3. Periodieke opschoning van verlopen browser-idempotency-keys en beheersessies, na afzonderlijke review.
4. Eventuele beperkte exportformaten/metadata op behoefte van de privacyverantwoordelijke.

**Backups:** door eigenaar afgevinkt als Hostinger-beheerde voorziening. Geen eigen backup-project of onafhankelijke restoretest als ontwikkelblokkade; hier wordt geen restore claim gedaan.

## Releasecontroles

`npm run build`, `npm test`, `npm run check`, geïsoleerde MySQL integraties (inclusief succesvolle/afgewezen verwijderingen, cascades, audit, CSRF en rechten) en desktop/mobiele browser/a11y via CI. **Geen echte klantgegevens of wachtwoorden** in fixtures, logs of GitHub-bewijs.
