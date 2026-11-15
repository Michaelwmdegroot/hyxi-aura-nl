# HYXI AURA — P0 productieacceptatie en herstelroute (15 november 2026)

**Status: testinstructie, geen bewijs van voltooiing.** Basis: `main` 87882ae en bestaande Hostinger-productie met MariaDB 11.8.9, migraties 001–004, werkend password-only /beheer. Database en beheer **niet opnieuw opzetten**. Doel: aantoonbare keten **publiek formulier → DB-ontvangstnummer → /beheer → inbox van leads@thuisbatterijteam.nl**.

## Wat deze release daadwerkelijk wijzigt

- `privacy/index.html` beschrijft voortaan de bestaande versleutelde DB-opslag, outbox, audit, handmatige bewaarbeheer en aparte beheercookies. Het oude onjuiste "geen database" vervalt.
- Nieuwe aanvragen krijgen privacyversie `2026-11-15` in de database en interne mail.
- Automatische opslag, mail, verwijdering of backup worden **niet** door het corrigeren van de tekst geactiveerd.
- Retentiebeleid voor niet-klanten is op de publieke pagina **zes maanden na laatste contact**. Dit is vandaag **niet technisch afgedwongen**. Bevestig een uitvoerbare maandelijkse controle met privacyverantwoordelijke en vul later pas geautomatiseerde verwijdering in, inclusief actieve aanvragen/geschillen/boekhouduitzonderingen.

## Verificatie — één test, zonder echte klantdata in GitHub

1. Controleer na Hostinger-deploy `https://hyxi-aura.nl/api/health` en `https://hyxi-aura.nl/api/config`. Beide moeten `leadEnabled: true` tonen. `/api/health` toont **niet** de database-/SMTP-details; deel geen `.env` of wachtwoorden.
2. Als `leadEnabled: false`: controleer **privé in hPanel**, zonder waarde te kopiëren, dat `LEAD_STORAGE_MODE=database`, `ADMIN_ENABLED=true`, `LEAD_ENABLED=true`, `LEAD_TO=leads@thuisbatterijteam.nl` en de benodigde `DB_*`, `LEAD_*`-sleutels en `SMTP_*` ingevuld zijn. Herstart alleen de app nadat de geldige private configuratie is opgeslagen. `LEAD_ENABLED=true` werkt uitsluitend met volledige SMTP én database-configuratie.
3. Verstuur vanuit de **gewone publieke webpagina** één herkenbare aanvraag met uitsluitend eigen, geautoriseerde testcontactgegevens; zet bijvoorbeeld **TEST HYXI** in het naamveld. Gebruik de gekozen Q7/Q9-modules en doorloop de bestaande drie stappen, inclusief vereiste contacttoestemming. Bewaar uitsluitend de ontvangen **AURA-UUID**, de gekozen moduleconfiguratie en de UTC-tijd in het testrapport — geen adres, mailadres, telefoon of ruwe browsercookies.
4. Meld je met het bestaande e-mailadres en **één wachtwoord** aan via `/beheer`; zoek het aanvraag-ID in de recentste dossiers. Controleer opgeslagen profiel, status `new`, bron, en afzonderlijk de mailstatus. Verwacht niet dat een SMTP-status `accepted` de inboxaflevering bewijst.
5. Controleer `leads@thuisbatterijteam.nl` in INBOX én Junk op exact `[HYXI AURA] Nieuwe adviesaanvraag <AURA-ID>`. Controleer ontvanger, afzender, Reply-To, correcte modulekeuze en waar beschikbaar SPF/DKIM/DMARC. Alleen bij aantoonbare inboxontvangst mag de operationele mailboxproef als geslaagd worden genoteerd.
6. Herhaal **dezelfde inzending** uitsluitend als de browser zelf een retry aanbiedt met dezelfde Idempotency-Key; er mag geen tweede dossier ontstaan. Niet handmatig nieuwe testleads spammen. Onzekere/mislukte mail in `/beheer` eerst vergelijken met inbox/Junk vóór een handmatige retry.
7. Registreer in issue #1 alleen: datum/UTC, gekort aanvraag-ID indien nodig, DB-status, SMTP-status, inboxontvangst ja/nee, eventuele foutcode zonder PII en actie/eigenaar.

## Mailbox-readiness op 15 november

De gekoppelde Hostinger Mail-account voor `leads@thuisbatterijteam.nl` is read-only bereikbaar: er is een INBOX en een Junk-map; een gerichte HYXI AURA-onderwerpzoekopdracht in INBOX had op 15 november geen hits. Dit is **geen bewijs dat de API of SMTP niet werkt**; er was vóór dit onderzoek nog geen geverifieerde HYXI-proef. Na een ingezonden test kan dezelfde mailbox opnieuw worden gecontroleerd, zonder authenticatiegegevens in de repository.

## Continuïteit, backups en incidenten

- **Databasekopie:** controleer via Hostinger of dagelijkse herstelpunten actief zijn; maak een toegangsbeperkte handmatige SQL-export vóór schemawijzigingen. De export bevat persoonsdata en blijft **uitsluitend buiten GitHub en browserdownloads die worden gedeeld**. Herstel de export eerst in een afzonderlijke testdatabase (schema, rijtellingen, ontsleuteling van fictieve testrecords); test **nooit** een restore over productie.
- **Sleutels:** bewaar `LEAD_ENCRYPTION_KEY`, `LEAD_HASH_SECRET`, `ADMIN_SESSION_SECRET`, DB- en SMTP-wachtwoorden in een beveiligde kluis met recoverytoegang. Zonder originele encryptiesleutel is een SQL-restore van leads niet leesbaar.
- **DB-uitval:** publieke API mag geen ontvangstbevestiging afgeven bij mislukte commit. Blijf klantfallback aanbieden. **Niet** stilzwijgend terugschakelen naar mail-only; herstel eerst de DB.
- **SMTP-uitval:** leads blijven gecommit in de outbox; werk `failed` en `uncertain` via de bestaande Mailcontrole af. `accepted` = SMTP-acceptatie, **niet** een geverifieerd inboxbericht. Bij ambiguïteit eerst mailbox doorzoeken; vermijd dubbel versturen.
- **Retentie:** verifieer maandelijks afgesloten niet-klantdossiers ouder dan zes maanden sinds laatste contact, mailboxkopieën en werkadministratie. Beoordeel bewaarexcepties en privacyverzoeken met de bevoegde verantwoordelijke. Er is nog **geen** veilige automatische verwijderroutine of geverifieerde Hostinger-restoretest; claim dit niet als voltooid.
- **Opvolging:** wijs een persoon aan die `leads@` en Beheer minimaal iedere werkdag controleert, plus een vervanger bij afwezigheid. Controleer onafgehandelde dossiers en mailfouten. Geen koppeling met NIVO Portal nodig.
- **Rollback:** herdeploy de laatst werkende git-commit bij defecte code, **zonder** de bestaande DB te wissen, keys te veranderen of reeds uitgevoerde migraties terug te draaien. Bij dataverlies eerst de recovery-verantwoordelijke inschakelen.

## Nog open om P0 af te tekenen

- [ ] Nieuwste `main` daadwerkelijk in productie en privacytekst zichtbaar.
- [ ] Read-only `leadEnabled: true` op de **actuele** live API.
- [ ] Eén live aanvraag-ID zichtbaar in beveiligde database en dashboard.
- [ ] Overeenkomstige HYXI-mail aangetroffen in `leads@` INBOX/Junk.
- [ ] Hostinger backup **en herstel naar geïsoleerde testdatabase** geverifieerd.
- [ ] Beheerder mailbox + reservepersoon benoemd; retentie-eigenaar benoemd.
