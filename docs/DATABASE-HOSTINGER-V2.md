# HYXI AURA — Hostinger MySQL (voorbereiding voor V2)

**Status op 14 november 2026:** eigenaar heeft voor `hyxi-aura.nl` een MySQL-database en databasegebruiker aangemaakt. Dit bewijst nog **geen** verbinding vanuit Node.js. Geen databasewachtwoorden, echte leads of persoonsgegevens in deze repository.

## Wat is nu klaar?
- De bestaande V1-website draait op Hostinger en verstuurt aanvragen voor het team via SMTP.
- Er is een aparte MySQL-database aangemaakt in Hostinger, met een gebruiker.
- Deze featurebranch bevat een **conceptuele eerste SQL-migratie** in `db/migrations/001_initial_leads.sql`.
- De SQL is nog **niet toegepast**; de huidige aanvraag-API is **niet aangepast** en gebruikt **nog geen MySQL**.

## Instellingen uitsluitend in Hostinger
Wanneer de daadwerkelijke MySQL-integratiecode na testen gereed is, voeg via **Websites → Beheer → Omgevingsvariabelen** onderstaande sleutels toe. Gebruik bij database en gebruiker de volledige naam (inclusief Hostinger-prefix) zoals weergegeven in Databases → Management.

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=VUL_HIER_VOLLEDIGE_DATABASE_NAAM_IN
DB_USER=VUL_HIER_VOLLEDIGE_DATABASE_GEBRUIKER_IN
DB_PASSWORD=VUL_HIER_HET_DATABASE_WACHTWOORD_IN
```

**Belangrijk:** `DB_PASSWORD` is het wachtwoord dat je bij de MySQL-database hebt gemaakt, **niet** het SMTP-mailwachtwoord. Deel het niet in chat, GitHub, screenshots of logbestanden. Hostinger adviseert voor Node.js `127.0.0.1` in plaats van `localhost`, omdat die laatste op recente Node-versies vaak als IPv6 `::1` wordt opgevat.

De huidige versie leest deze variabelen niet, dus ze maken op zichzelf geen verbinding. Neem het werkende `LEAD_TO=leads@thuisbatterijteam.nl` en de bestaande SMTP-variabelen ongewijzigd mee. Voor een toekomstige applicatie-laagencryptie is daarnaast een afzonderlijke beheerde encryptiesleutel nodig. Die bestaat nog niet in deze implementatie.

## Schema / gegevensmodel
V1 levert alleen per SMTP af. Voor V2 zijn afzonderlijke objecten gepland:

- `aura_leads`: unieke aanvraag, status en versleutelde payload.
- `aura_submission_keys`: duurzame idempotency, geen dubbele ontvangen aanvragen na een redeploy.
- `aura_lead_events`: audittrail van niet-gevoelige statuswijzigingen.
- `aura_notification_outbox`: mailnotificaties en uitval-/herstelstatus; SMTP-acceptatie is niet hetzelfde als inboxontvangst.
- `aura_schema_migrations`: migratieversie- en controlesomregister.

Personen- en woninggegevens worden **niet** in losse plattetekstkolommen ontworpen. De uiteindelijke toepassing moet applicatie-encryptie, sleutelrotatie, toegangsniveaus en verwijdering implementeren vóórdat het schema voor echte leads mag worden gebruikt. Er is in deze branch nog geen werkende encryptie, databaseconnectie of notificatiewerker.

## Wat vóór een echte migratie nog moet gebeuren
1. Controleer MySQL/MariaDB-versie via phpMyAdmin en documenteer compatibiliteit.
2. Maak een afzonderlijke, geïsoleerde testdatabase en voer alleen fictieve gegevens in.
3. Bouw een gecontroleerde migratie-runner die iedere verandering registreert en geen destructieve DDL zonder review uitvoert.
4. Valideer schema-indexen en transacties op een echte MySQL/MariaDB-testinstantie.
5. Back-up en restore *testen* voordat productie gewijzigd wordt.
6. Bouw de `mysql2/promise`-opslagadapter, AES-256-GCM en data-outbox, met misbruik- en foutscenario's.
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
