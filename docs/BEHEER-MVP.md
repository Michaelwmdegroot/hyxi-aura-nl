# HYXI AURA Beheer — MVP-uitvoering, testbewijs en activatievoorwaarden

**Status:** concept-PR #13 op branch `feat/beheer-mvp`. **Niet beschikbaar op de live website**; `main` blijft de bestaande SMTP-mailroute gebruiken. Dit werk bouwt bovenop PR #11 (database) en PR #12 (beveiligingsprimitieven).

## Werkende onderdelen in de featurebranch
- Responsive beheerinterface op `/beheer` met loginscherm, werkvoorraad, statusfilter, detailvenster, notificatiestatus en volgacties.
- Express-API achter `/api/beheer/*`; geen publieke registratie, geen persoonsgegevens in statische HTML of localStorage.
- Inlogcontrole met memory-hard scrypt, verplichte TOTP/MFA inclusief anti-replay, persistente loginlimieten, veilige sessiecookies en CSRF/Origin-controle.
- MySQL-afgeschermd toegangspad: admin ziet alle dossiers; sales ziet uitsluitend toegewezen dossiers. Onbekende of niet-toegewezen leads geven 404.
- Enkelvoudige statuswijziging schrijft een audit-event in dezelfde transactie. Geen statuswijziging op basis van alleen frontendcontrole.
- Nieuw schema 002 met gebruikers, sessies, loginlimieten en audit; manual-only migratie met checksums.
- Eenmalige owner-bootstrap via een expliciet bevestigde interactieve terminal, met wachtwoord zonder echo en gecontroleerde authenticatorcode.

## Veiligheidsgrenzen / featureflags
- De standaard is `LEAD_STORAGE_MODE=mail` en `ADMIN_ENABLED=false`; in deze toestand geeft `/beheer` en `/api/beheer/*` 404.
- Beheer wordt uitsluitend voorbereid als database mode, DB-gegevens, twee lead-cryptosleutels, ADMIN_SESSION_SECRET, ADMIN_MFA_KEY, SMTP-gegevens en migratie 001 + 002 beschikbaar zijn.
- Iedere mislukte startup/readiness laat de publieke productpagina bereikbaar; beheer blijft gesloten. Er is geen stilzwijgende fallback naar onbeveiligde leesroutes.
- Backendroutes controleren de sessie en bevoegdheden bij iedere aanvraag. HTTPS is verplicht in productie voor Secure cookies. De sessieduur is acht uur.
- Alle tests gebruiken fictieve contactgegevens en een aparte disposable MySQL 8-service. Echte Hostinger-gebruikers, DB of mailbox worden niet benaderd.

## Handmatige test- en releasevolgorde
1. Bevestig en documenteer één echte SMTP-ontvangst op `leads@thuisbatterijteam.nl` voor de bestaande site; wijs mailboxbeheer aan.
2. Valideer de daadwerkelijke Hostinger MySQL/MariaDB-versie en toegang. Maak eerst een afzonderlijke, afgeschermde testdatabase en test een backup/restore.
3. Voer DB-migratie 001 en 002 uit in die testomgeving met fictieve aanvragen; controleer het migratieledger en herhaling.
4. Maak in veilige omgeving onafhankelijke cryptosleutels en een admin-sessionsecret, bewaar ze in een beveiligde kluis. Gebruik geen wachtwoorden in Git, screenshots of chat.
5. Test `npm run db:check`, daarna de expliciete migratietools `npm run db:migrate` en `npm run db:admin-migrate` alleen in de goedgekeurde omgeving met DB_SCHEMA_APPLY-vlag.
6. Gebruik het interactieve bootstrap-commando alleen via een vertrouwde SSH/TTY-omgeving, en voltooi MFA-uitgifte. Maak nooit een testaccount met herbruikbare credentials in productie.
7. Controleer persoonlijk: inloggen, uitloggen, MFA-klokafwijking, sessieherstel, onbevoegde toegang, afwijzing van onbekende dossiers, mobiele UX en audit.
8. Documenteer privacyverwerking, bewaartermijn, verwijdering, monitoring en herstel van SMTP-uitval/`uncertain`-notificaties. Pas dan kan productie-DB-modus worden geactiveerd.
9. Voer een beperkte productieproef uit met expliciete eigenaarstoestemming en controleer dat de lead in de database staat en de ontvanger de notificatie krijgt.
10. Controleer bij elke stap terugval zonder verlies van nieuwe MySQL-leads; wissel niet blind van database naar SMTP-only als er nog onverwerkte leads bestaan.

## Commando's en tests
- `npm ci && npm run build && npm test && npm run check` voor bestaande checks.
- `npm run test:db` voert alleen in de geïsoleerde CI-omgeving MySQL-migratie-, lead-, auth- en autorisatietests uit.
- `node tests/beheer-browser.mjs` voert browsercontrole met een fake admin-store uit; maakt screenshots onder `test-results/browser/beheer-*.png` en raakt geen database.
- `DB_SCHEMA_APPLY=explicit-review-completed npm run db:admin-migrate` is bedoeld voor een **handmatig** goedgekeurde migratie in de juiste omgeving; geen startup-hooks voor SQL.
- `ADMIN_BOOTSTRAP=interactive-confirmed npm run admin:create` start de eenmalige CLI-procedure; alleen voor de veilige, interactieve beheerterminal.

## Nog expliciet niet af
- Geen echte Hostinger DB-verbinding of restoreproef aangetoond.
- Geen dashboard in productie vrijgegeven; geen owneraccount op Hostinger aangemaakt.
- Geen gebruiker-uitnodiging, veilig accountherstel, beheerder-MFA-reset, admin-rolbeheer of admin-limietenmonitor.
- Geen e-mailincidentenwerkbank voor handmatige behandeling van `uncertain` SMTP-overdracht.
- Geen geautomatiseerde AVG-retentie/erasure voor leads én mailbox.
- Geen offertegenerator, volledige auditexport of NIVO Portal-koppeling.

## Gerelateerde bronnen
- [PR #13 — Beheer-MVP](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/13)
- [PR #12 — authfundament](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/12)
- [PR #11 — duurzame MySQL-opslag](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/11)
- [Database/Hostinger-handleiding](DATABASE-HOSTINGER-V2.md)
- [Projectplan](PROJECT-PLAN-V2-2026-11-14.md)
