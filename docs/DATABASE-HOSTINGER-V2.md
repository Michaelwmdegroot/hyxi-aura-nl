# HYXI AURA — Hostinger MySQL (voorbereiding voor V2)

**Status op 14 november 2026:** eigenaar heeft voor `hyxi-aura.nl` een MySQL-database en databasegebruiker aangemaakt. Dit bewijst nog **geen** verbinding vanuit Node.js. Geen databasewachtwoorden, echte leads of persoonsgegevens in deze repository.

## Wat is nu klaar?
- De bestaande V1-website draait op Hostinger en verstuurt aanvragen voor het team via SMTP.
- Er is een aparte MySQL-database aangemaakt in Hostinger, met een gebruiker.
- Deze featurebranch bevat een **conceptuele eerste SQL-migratie** in `db/migrations/001_initial_leads.sql`.
- De SQL is **niet toegepast**. De API ondersteunt inmiddels een **uitgeschakelde, opt-in MySQL-variant**; de live e-mailroute blijft de standaard.

## Instellingen uitsluitend in Hostinger
Wanneer de code na volledige review voor staging wordt ingezet, voeg via **Websites → Beheer → Omgevingsvariabelen** onderstaande sleutels toe. Gebruik bij database en gebruiker de volledige naam (inclusief Hostinger-prefix) zoals weergegeven in Databases → Management.

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=VUL_HIER_VOLLEDIGE_DATABASE_NAAM_IN
DB_USER=VUL_HIER_VOLLEDIGE_DATABASE_GEBRUIKER_IN
DB_PASSWORD=VUL_HIER_HET_DATABASE_WACHTWOORD_IN
```

**Belangrijk:** `DB_PASSWORD` is het wachtwoord dat je bij de MySQL-database hebt gemaakt, **niet** het SMTP-mailwachtwoord. Deel het niet in chat, GitHub, screenshots of logbestanden. Hostinger adviseert voor Node.js `127.0.0.1` in plaats van `localhost`, omdat die laatste op recente Node-versies vaak als IPv6 `::1` wordt opgevat.

De V2-branch leest deze variabelen uitsluitend bij ingeschakelde database-modus. Behoud `LEAD_STORAGE_MODE=mail` voor productie. Neem het bestaande `LEAD_TO=leads@thuisbatterijteam.nl` en alle SMTP-variabelen ongewijzigd mee. AES-256-GCM is geïmplementeerd achter de featureflag, maar sleutels/rotatie en operationeel beheer zijn nog niet op productie ingericht.

## Schema / gegevensmodel
V1 levert alleen per SMTP af. Voor V2 zijn afzonderlijke objecten gepland:

- `aura_leads`: unieke aanvraag, status en versleutelde payload.
- `aura_submission_keys`: duurzame idempotency, geen dubbele ontvangen aanvragen na een redeploy.
- `aura_lead_events`: audittrail van niet-gevoelige statuswijzigingen.
- `aura_notification_outbox`: mailnotificaties en uitval-/herstelstatus; SMTP-acceptatie is niet hetzelfde als inboxontvangst.
- `aura_schema_migrations`: migratieversie- en controlesomregister.

Personen- en woninggegevens worden **niet** in losse plattetekstkolommen ontworpen. De uiteindelijke toepassing moet applicatie-encryptie, sleutelrotatie, toegangsniveaus en verwijdering implementeren vóórdat het schema voor echte leads mag worden gebruikt. In de branch staan inmiddels werkende encryptie-, mysql2- en notificatiemodules met MySQL 8 CI-tests. Sleutelrotatie, privacyretentie, een dashboard voor mislukte notificaties en een daadwerkelijk geteste Hostinger-verbinding ontbreken nog.

## Wat vóór een echte migratie nog moet gebeuren
1. Controleer MySQL/MariaDB-versie via phpMyAdmin en documenteer compatibiliteit.
2. Maak een afzonderlijke, geïsoleerde testdatabase en voer alleen fictieve gegevens in.
3. Gebruik de gebouwde migratie-runner op een geïsoleerde omgeving; hij accepteert alleen een expliciete bevestigingsvlag en registreert de checksum.
4. De MySQL 8-transactie- en outboxtests zijn in CI geslaagd; voer daarnaast een compatibiliteitstest uit op de daadwerkelijke Hostinger-serverversie.
5. Back-up en restore *testen* voordat productie gewijzigd wordt.
6. De `mysql2/promise`-adapter, AES-256-GCM, foutpaden, idempotentie en data-outbox zijn gebouwd; controleer ze nog op echte Hostinger-staging en voeg operationele notificatiemonitoring toe.
7. Controleer AVG-grondslag, retentie en beheerder voor nieuwe databaseopslag.
8. Schakel pas via een gecontroleerde featureflag over na een werkende end-to-end test en rollbackplan.

**Niet rechtstreeks de concept-SQL in de productie-phpMyAdmin uitvoeren.** DDL in MySQL is niet automatisch transactie-rollbackbaar; een gedeeltelijke migratie moet bewust hersteld worden.

## Na integratie: acceptatie
- Bezoeker ontvangt een ontvangstnummer **na databasecommit**, ongeacht of SMTP op dat moment beschikbaar is.
- Bezoekers zien geen adminroutes; persoonsgegevens zijn alleen na rolgecontroleerde login zichtbaar.
- Dezelfde `Idempotency-Key` en inhoud leveren altijd dezelfde aanvraag-ID op, ook na herstart.
- Mislukte DB-write levert geen succesmelding; niet-afgeleverde notificaties zijn zichtbaar in de beheerwerkbank.
- Geen dubbele e-mails bij normaal retrypatroon; voor onzekere SMTP-acknowledgements bestaat een veilig proces.
- Back-up, restore en verwijdering zijn operationeel getest.

## Bronnen en issues
- [Hostinger: MySQL met Node.js verbinden](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
- [Hostinger: omgevingsvariabelen na deployment wijzigen](https://www.hostinger.com/support/how-to-edit-or-add-environment-variables-after-deployment/)
- [GitHub issue #2 — MySQL-opslag](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/2)
- [Technische V2-architectuur](ARCHITECTURE-V2.md)

## Beveiligde featureflag en activering

De database is **NIET actief op productie**. Bij een later gedeployde V2-branch gebruikt de applicatie standaard de bestaande mailroute. Er komt pas een databaseverbinding bij expliciet `LEAD_STORAGE_MODE=database`, volledige databasegegevens, een geldige encryptiesleutel en HMAC-sleutel, SMTP-configuratie en een toegepaste migratie.

Nieuwe benodigde omgevingssleutels: `LEAD_STORAGE_MODE=mail`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `LEAD_ENCRYPTION_KEY` en `LEAD_HASH_SECRET`. Gebruik `openssl rand -base64 32` voor de encryptiesleutel en `openssl rand -hex 32` voor de HMAC-sleutel. Bewaar de sleutelwaarden buiten Git, tickets en chat. Zonder sleutels of schema blijft de webpagina beschikbaar, maar de DB-aanvraagroute wordt uitgeschakeld; er vindt nooit stille terugval naar mailmodus plaats.

Na het aanmaken van een **geïsoleerde** testdatabase en herstelbackup kan de migratie gecontroleerd worden uitgevoerd met de CLI en het commando `DB_SCHEMA_APPLY=explicit-review-completed npm run db:migrate`. Dit gebeurt nooit automatisch tijdens het starten van de website. Controleer daarna `npm run db:check`. Voer deze commando's niet op productie uit voordat de eigenaar de databaseversie, backup/restore en privacyaanpassingen heeft goedgekeurd.

De outbox controleert bij een actief Node-proces periodiek wachtende meldingen. Voor echte productie moet een betrouwbare cron- of monitoringroute worden vastgesteld; onzekere afleveringen mogen niet automatisch opnieuw worden verstuurd. Zolang een beveiligd dashboard of een gelijkwaardige controlewerkbank ontbreekt, blijft `LEAD_STORAGE_MODE=mail` noodzakelijk. Een database-ontvangstbewijs betekent een **geslaagde transactie**, niet de bevestiging van inboxbezorging.

**Bij een import in Hostinger:** een gedeeltelijk database-.env-bestand uitsluitend samenvoegen met de bestaande omgeving. Overschrijf of verwijder niet de werkende `SMTP_PASS`, `SMTP_USER`, `SMTP_FROM`, `CSRF_SECRET`, `SITE_URL` en `LEAD_TO`.

