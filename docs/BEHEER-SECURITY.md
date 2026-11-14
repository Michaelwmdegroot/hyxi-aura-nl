# HYXI AURA Beheer — veilige authenticatiebasis

Status: bouwfase, nog geen openbare login of dashboard. Gebouwd in de branch feat/aura-beheer-security als afhankelijkheid van de MySQL-basis in PR #11.

## Beveiligingsbesluiten
- Geen publieke registratie; eerste eigenaar en salesgebruikers uitsluitend via een gecontroleerde uitnodiging of CLI-bootstrap.
- Gehashte en uniek gesalte wachtwoorden met memory-hard scrypt N=32768, r=8, p=1; sterke wachtwoordzin vereist.
- MFA verplicht via TOTP met anti-replay, versleutelde TOTP-seeds en apart beheerde ADMIN_MFA_KEY.
- Opaque willekeurige sessietokens; alleen HMAC-hashes in MySQL en apart ADMIN_SESSION_SECRET.
- Alle rollen, sessies en acties op serverniveau autoriseren. Geen persoonlijke leads in publiek HTML of frontend-state.
- Sessiecookies in latere route HttpOnly, Secure, SameSite Strict; Origin en CSRF-checks bij mutaties.
- Persistente login-rate-limiting via toekomstige aura_admin_login_guards, geen onderscheid tussen bestaand en onbekend e-mailadres.

## Wat al is gebouwd
- Offline server/auth/security.mjs met scrypt, TOTP, anti-replay, session HMAC en AES-256-GCM MFA-versleuteling.
- tests/admin-security.test.mjs met onafhankelijke unit-tests zonder secrets, gebruikers of netwerk.
- Concept DB-migratie 002 voor users, sessies en rate-limit; SQL is nergens automatisch uitgevoerd.

## Nog niet gebouwd
- Account-bootstrap, MFA enrollment/bevestiging, herstel, sessiestore en concrete login-API.
- Een visueel dashboard en read-only leads APIs met server-side rolcontrole.
- Productie DB-authenticatie, backup/restore, audit en privacy/retentie-controles.

## Geheime variabelen (nog NIET toevoegen)
- ADMIN_MFA_KEY: onafhankelijk gegenereerde base64 sleutel van 32 bytes.
- ADMIN_SESSION_SECRET: onafhankelijk willekeurig geheim van ten minste 32 bytes.

De bestaande live website blijft in de mailmodus staan. Merge noch activeer auth voordat alle negatieve autorisatie- en hersteltests slagen.
