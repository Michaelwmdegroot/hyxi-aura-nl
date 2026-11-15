# HYXI AURA Beheer — beveiligingsmodel

Status: **geïmplementeerd en nog niet geactiveerd in concept-PR #13**. Dit document beschrijft de ontwikkelbranch, niet een live of onafhankelijk volledig geaudite securitygarantie.

## Kern
- Geen openbare signup. De eerste eigenaar kan alleen via een handmatig, geautoriseerd, interactief TTY-script met een bevestigde TOTP-code worden aangemaakt. Dubbele initialisatie wordt via een DB-lock geweigerd.
- Salted memory-hard scrypt-wachtwoordhashes (N=32768,r=8,p=1), minimaal 14 bytes en 12 niet-lege tekens; geen wachtwoorden in log of browseropslag.
- MFA met TOTP en anti-replay-stap op de gebruiker; TOTP-seeds zijn AES-256-GCM versleuteld met accountgebonden authenticatie en aparte MFA-sleutel.
- Cryptografisch willekeurige 256-bit sessietokens, uitsluitend HMAC-hash in DB. HttpOnly/SameSite=Strict/Secure cookies op productie. Auth-sessie 8 uur.
- CSRF-token plus toegestane Origin voor mutaties. `admin` en `sales` worden uitsluitend op de server gecontroleerd. Sales ziet alleen leads die aan het account zijn toegewezen.
- Loginlimieten per gehashte accountidentificatie en bron-IP via MySQL; geen plaintext in rate-limit tabel.
- Dossierinzage en statuswijziging komen in een audittrail. Gegevens worden server-side ontsleuteld na autorisatie, niet in statische HTML of lokale opslag.
- Gesloten standaard: zonder `ADMIN_ENABLED=true` en volledig geteste DB-configuratie geeft beheer 404.

## Tests
De CI-controle `npm run test:db` gebruikt een disposable MySQL 8-service en fictieve accounts. Ze controleert eenmalige owner-bootstrap, TOTP replay, password, sessie-invalidering, ontbrekende CSRF, salesisolatie, disabled accounts, rate-limits en status-audit. De Chromium-browsertest controleert de volledige interface (login, overzicht, dossier, status, logout) op desktop en mobiel, inclusief axe-toegankelijkheidscontrole.

## Beperkingen voor activering
Nog geen productiegebruikers, geen veilig account-herstel of salesuitnodigingen, geen privacy-/back-up-/restoreproef, geen goedgekeurde DB-migratie op Hostinger en geen operationele outbox-incidentenwerkbank. Zie [Beheer-MVP-uitrolplan](BEHEER-MVP.md) en [database-instructies](DATABASE-HOSTINGER-V2.md).

## Benodigde geheime variabelen pas bij activering
- `ADMIN_ENABLED=false` zolang er geen goedgekeurde stagingcontrole is.
- `ADMIN_SESSION_SECRET`: onafhankelijk, sterk, geheim van minimaal 32 bytes.
- `ADMIN_MFA_KEY`: onafhankelijke canonical base64-sleutel van 32 bytes.
- Beide uitsluitend in de beveiligde Hostinger-omgeving/kluis; nooit in GitHub, chat of testlogs.
