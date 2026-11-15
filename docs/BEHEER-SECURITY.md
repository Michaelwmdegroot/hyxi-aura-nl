# HYXI AURA Beheer — beveiligingsmodel

Bijgewerkt 15 november 2026. Dit beschrijft de code en gecontroleerde testscenario's, geen algemene securitygarantie of bewijs van actieve productie-inrichting.

## Accounts en toegang

- Geen publieke signup of herstelroute. Eerste eigenaar en vervolgbeheer via een vertrouwde interactieve terminal.
- Eén inlogwachtwoord met salted scrypt-hash, N=32768/r=8/p=1, minimaal 12 niet-lege tekens en maximaal 1024 bytes. Geen TOTP of 6-cijferige code.
- De bestaande lege legacy MFA-databasekolom voorkomt een extra migratie. Bij een nieuw account wordt geen authenticatorgeheim aangemaakt of opgeslagen.
- Willekeurige 256-bit sessietokens, alleen HMAC-hash in DB, acht uur geldig. HttpOnly/SameSite=Strict/Secure cookies in productie. Server-side sessie- en rolcontrole per aanvraag.
- Persistente limieten per gehashte bron-IP en account. Bron-IP wordt eerst begrensd zodat een geblokkeerde bron geen onbeperkte nieuwe accountcounters maakt. Login matcht het genormaliseerde e-mailadres exact.
- Herstel vervangt het wachtwoord, trekt sessies in en wist alleen de accountguard. Credentialvergelijking binnen de logintransactie voorkomt een nieuwe sessie met inmiddels ingetrokken credentials.
- Accountmutaties delen de bootstrap-lock en schrijven een transactionele audit. De laatste actieve admin kan niet worden uitgeschakeld. Herstel heft een uitschakeling niet op.
- Audit target_user_id onderscheidt doelaccount en actor. Terminalacties hebben actor NULL en een vaste actiecode; geen wachtwoorden, MFA-seeds, contactgegevens of vrije tekst in auditregels.

## Dossiers en mail

- Admin ziet alle dossiers; sales alleen toegewezen dossiers. Toewijzing en mailcontrole zijn admin-only, ook bij rechtstreeks API-gebruik.
- Geen persoonsgegevens in statische HTML, URL's, analytics of localStorage. Payload wordt na autorisatie ontsleuteld. Inzage en mutaties worden geaudit.
- CSRF-token én toegestane Origin voor wijzigingen. Frontend ververst de 15-minuten-CSRF voor mutaties. Afmelden/sessieverval wist de weergave en onderbreekt oude requests.
- Databaseontvangst betekent een geslaagde commit. SMTP-acceptatie en menselijke inboxbevestiging hebben afzonderlijke statussen.
- Outboxclaim en UTC-dagbudget worden samen gereserveerd. Herstart/gelijklopende workers herstellen geen budget. Completion vereist dezelfde verzendpoging.
- Onzekere verzendingen worden nooit automatisch herhaald. De beheerder bevestigt mailboxcontrole en neemt expliciet een beslissing; status én poging worden vergeleken met de bekeken melding.

## Defaults, schema en herstel

LEAD_STORAGE_MODE=mail en ADMIN_ENABLED=false blijven de defaults. De productie-entry past geen SQL toe. Schema-readiness controleert InnoDB, kolommen, kritieke types, unieke sleutels, foreign keys en checksums. Beheer vereist account-auditmigratie 003; verzending vereist budgetmigratie 004. Database en werkbank starten onafhankelijk van de aanvraagknop en SMTP-configuratie.

Voor activering: door eigenaar bevestigde Hostinger MariaDB-verbinding/schema, backup/restore, privacy/retentieafspraak, operationele mailboxcontrole en eerste eigenaarlogin. Drie private servergeheimen blijven buiten Git, chat en logs: LEAD_ENCRYPTION_KEY, LEAD_HASH_SECRET en ADMIN_SESSION_SECRET. De oude ADMIN_MFA_KEY is niet meer vereist of gebruikt. Bewaar sleutels veilig; sleutelverlies kan versleutelde leads onleesbaar maken.

## Tests

Disposable MySQL 8 controleert auth/RBAC/CSRF, sessieverval, recovery/credentialrace, last-admin bescherming, auditrollback, toewijzing, mailbeslissingen, outboxlease/dagbudget en schema-invarianten. Chromium/axe controleert desktop en mobiel. Alle accounts/aanvragen zijn fictief en mailtransporten zijn geïnjecteerde testvervangers. Zie [Beheer-MVP](BEHEER-MVP.md) voor commando's en actuele productgrenzen.
