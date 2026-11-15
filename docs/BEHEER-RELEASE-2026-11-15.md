> **Nieuwe afsluitende overdracht:** [Leadgen projectstatus en roadmap](HANDOFF-LEADGEN-2026-11-15.md) · [Startprompt opvolgende agent](NEXT-AGENT-LEADGEN-2026-11-15.md). De eigenaar heeft zijn eerste account aangemaakt en is op het live dashboard ingelogd; de live lead-/mailtest is nog niet bevestigd.

> **Fast-lane actualisering 15 november 2026:** de gebruiker heeft wachtwoord-only Beheer gekozen. Het oude MFA-ontwerp in deze historische overdracht is vervangen: geen authenticatorcode of tweede wachtwoord. MariaDB 11.8.9 met schema 001–004 is door de eigenaar gecontroleerd. Lees docs/BEHEER-MVP.md en docs/BEHEER-SECURITY.md voor de actuele login.

# HYXI AURA Beheer — voortzetting en overdracht 15 november 2026

## Uitgangspunt

De vorige agent had PR #13 opgebouwd tot commit b834828. De laatste twee volledige CI-rondes waren al groen; run 43656879750 bevestigde build/unit/static, browser/axe, Lighthouse, Hostinger production-only installatie en MySQL 8. De vele eerdere wachtmeldingen betekenden dus niet dat de laatste code nog faalde.

De opvolging is uitgevoerd op dezelfde featurebranch zodat database, security en dashboard één controleerbare wijziging blijven. PR's #11/#12 bevatten eerdere tussenstappen die al in #13 zitten.

## Verholpen concrete problemen

1. Beheer was afhankelijk van actieve publieke intake en SMTP. Het kan nu onafhankelijk daarvan bestaande dossiers tonen.
2. CSRF verliep na vijftien minuten terwijl de sessie acht uur geldig bleef. Iedere mutatie ververst nu de bescherming, inclusief uitloggen.
3. Late browserantwoorden konden gewiste dossiergegevens terugplaatsen. Requests en weergavegeneraties voorkomen dit.
4. SMTP_DAILY_LIMIT gold niet in databasemodus. Een transactioneel gedeeld dagbudget begrenst nu de worker en retries, ook na herstart.
5. Oude credentials konden tijdens gelijktijdig accountherstel nog een login afronden. De transactie vergelijkt nu de gebruikte credentialset.
6. Schema-readiness keek slechts naar tabelaanwezigheid. De code controleert nu ook InnoDB, kolommen, kritieke types, keys/FKs en checksums.
7. Een oude verzendpoging of een verouderd incidentscherm kon een nieuwe poging verwarren. Completion en beheerbeslissingen zijn nu gebonden aan de poging.
8. Geblokkeerde IP's konden steeds nieuwe accountcounters laten maken. De IP-guard wordt nu eerst toegepast; e-mailmatch is na normalisatie exact.

## Afgebouwde functies

- Toewijzing aan actieve admin/sales, met onmiddellijke server-side dossierafscherming en audit.
- Mailcontrole met expliciete mailboxbevestiging en gecontroleerde retry/ontvangstbeslissing.
- Terminalaccountbeheer: create/reset/disable/revoke/list, veilige MFA-uitgifte, sessie-intrekking, bescherming laatste actieve admin en apart auditdoel.
- Owner-bootstrap tijdens mailmodus zonder adminactivering.
- Eén expliciet db:prepare-commando voor migraties 001–004, read-only verbindingscheck en een aanvullend env-sjabloon.

## Testbewijs

De nieuwe wijzigingen worden in de PR-workflow gecontroleerd. Gebruik de CI-run bij de exacte laatste codecommit in [PR #13](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/13) als actuele autoriteit.

Lokaal zijn Node.js 24 build, 41 unit/security/CLI-tests, 482 statische controles, syntax/diffcontrole en beide productie-startvormen uitgevoerd. Echte MySQL- en Chromium-tests draaien in GitHub Actions; er is hier geen lokale MySQL-server en de lokale Chromium-sandbox blokkeert de browserstart. Deze lokale beperking is geen bewezen applicatiefout.

Nieuwe suites dekken accountreset/loginrace, sessieverval, concurrent last-admin bescherming, auditrollback, toewijzing, mailbeslissingen, de status/poging-race, werkelijk serverstartgedrag zonder SMTP, dagbudgetconcurrency en schema-afwijkingen. Alle gegevens zijn fictief; er worden geen echte e-mails verzonden.

## Productiestatus en eerstvolgende handeling

De live-healthcheck vóór deze wijzigingen antwoordde op 15 november:

```json
{"ok":true,"service":"hyxi-aura","leadEnabled":false}
```

Online aanvragen stonden dus uit. Welke private instelling ontbreekt is niet via deze publieke healthcheck vast te stellen.

Nog op Hostinger uit te voeren/bevestigen: de juiste privé-omgeving laden, databaseversie en backup/restore, migraties, eigenaar/MFA, actuele privacy-/retentieafspraken en één echte inboxproef. [DATABASE-HOSTINGER-V2.md](DATABASE-HOSTINGER-V2.md) bevat de uitvoerbare volgorde. Het [env-sjabloon](../config/beheer.env.example) bevat alleen aanvullingen en invulvelden.

De code schakelt dit niet automatisch in. De veilige defaults zijn mailmodus en ADMIN_ENABLED=false. Main kan daardoor de code bevatten zonder meteen klantgegevens in een nieuwe database op te slaan.

## Productgrens

De beveiligde beheerbasis is verder afgebouwd. De volledige scopes van issues #2–#4 zijn daarmee niet automatisch gesloten: interne notities, vervolgdatum/taken, zoeken, auditexport, automatische verwijdering en e-mailuitnodigingen blijven vervolgwerk, naast de hostingacceptatie. Offertefunctionaliteit, SEO-groei, analytics en de latere NIVO Portal-koppeling blijven afzonderlijke trajecten.
