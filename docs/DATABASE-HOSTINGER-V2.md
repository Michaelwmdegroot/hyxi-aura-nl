# HYXI AURA — database en beheer op Hostinger

Bijgewerkt 15 november 2026. De eigenaar heeft een database en databasegebruiker aangemaakt. De echte verbinding, serverversie, backup/restore en migraties zijn nog niet vanuit deze ontwikkelomgeving bewezen.

## 1. Privé-instellingen voorbereiden

Gebruik [config/beheer.env.example](../config/beheer.env.example) als **aanvulling**, niet als vervanging van de bestaande omgeving. Neem de volledige DB_NAME en DB_USER inclusief Hostinger-prefix over. DB_PASSWORD is het databasewachtwoord, niet het mailboxwachtwoord. Bewaar werkende SMTP_*, SITE_URL, LEAD_TO, LEAD_ENABLED en CSRF_SECRET.

Genereer vier onafhankelijke geheimen op een vertrouwde terminal en bewaar ze in een beveiligde kluis:

| Variabele | Generatie |
| --- | --- |
| LEAD_ENCRYPTION_KEY | openssl rand -base64 32 |
| LEAD_HASH_SECRET | openssl rand -hex 32 |
| ADMIN_SESSION_SECRET | openssl rand -hex 32 |
| ADMIN_MFA_KEY | openssl rand -base64 32 |

Houd LEAD_STORAGE_MODE=mail en ADMIN_ENABLED=false tijdens de voorbereiding. Plaats echte waarden alleen in Hostinger of een private, genegeerde .env; niet in GitHub, chat of screenshots. Een Node-CLI moet de juiste private omgeving inladen; de hPanel-omgeving van de draaiende website is niet automatisch de omgeving van iedere SSH-shell.

## 2. Verbinding, versie en herstel controleren

Vanuit de Node-appmap, met Node.js 24:

```sh
npm run db:check -- --connection
```

Dit is read-only en toont de serverversie zonder hostnaam, gebruiker of wachtwoord te loggen. Test eerst een afzonderlijke database met fictieve gegevens en een backup/restore. De CI gebruikt MySQL 8; de werkelijk door Hostinger aangeboden versie moet apart worden bevestigd.

## 3. Schema expliciet toepassen

```sh
DB_SCHEMA_APPLY=explicit-review-completed npm run db:prepare
npm run db:check
```

De volgorde is 001_initial_leads, 002_admin_auth, 003_account_audit en 004_notification_budget. Herhalen controleert checksums en de werkelijke structuur. Een afwijkende tabel of checksum stopt de procedure. MySQL-DDL is niet volledig transactioneel: inspecteer bij een fout de doelomgeving, herstel de gecontroleerde oorzaak en herhaal het script. Wijzig geen historische migratiebestanden.

De applicatie voert nooit automatisch DDL uit. Op de echte productiedatabase pas uitvoeren nadat doel, backup en herstelmogelijkheid zijn gecontroleerd.

## 4. Eigenaar maken

```sh
ADMIN_BOOTSTRAP=interactive-confirmed npm run admin:create
```

Alleen een vertrouwde interactieve terminal wordt geaccepteerd. De procedure werkt terwijl opslag nog op mail staat en beheer uitgeschakeld is. Wachtwoord en bevestigingscode zijn verborgen. Stel de getoonde MFA-sleutel in je authenticator in, bevestig de code en wacht vervolgens op een nieuwe code voor het eerste inloggen.

Accountbeheer daarna:

```sh
ADMIN_OPERATIONS=interactive-confirmed npm run admin:manage
```

## 5. Activeren

Als schema, herstel, owner/MFA, privacy/retentie en mailboxproces gecontroleerd zijn, stel in Hostinger in:

```dotenv
LEAD_STORAGE_MODE=database
ADMIN_ENABLED=true
LEAD_ENABLED=true
```

Herstart/redeploy en controleer /api/health plus /beheer. Een echte testaanvraag moet als dossier én als notificatie in leads@thuisbatterijteam.nl verschijnen. Automatische tests versturen geen echte mail.

Op 15 november gaf de live-healthcheck vóór deze wijzigingen leadEnabled:false. Controleer daarom óók LEAD_ENABLED en de volledigheid van SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM en LEAD_TO; alleen de databasevariabelen toevoegen herstelt dit niet.

## Werking

- Lead + idempotency + event + outbox worden samen gecommit; pas daarna volgt het ontvangstnummer.
- Persoonsgegevens zitten versleuteld in de leadpayload; geen vrije contactkolommen in de leadlijst of technische audit.
- SMTP_DAILY_LIMIT begrenst verzendpogingen in database-modus via een gedeeld UTC-dagbudget. De worker draait iedere circa 30 seconden zolang het Node-proces actief is.
- 'pending'/'retry_wait': wachten op verwerking; 'accepted': SMTP nam de notificatie aan; 'failed'/'uncertain': beheercontrole; 'confirmed': inboxontvangst door beheerder bevestigd.
- Een crash tijdens verzending maakt de melding onzeker. Handmatig opnieuw aanbieden vereist mailboxcontrole en wordt geaudit. Geen automatische herhaling van onzekere verzendingen.
- Beheer blijft werken wanneer publieke intake uitstaat of SMTP-configuratie ontbreekt. De database en adminconfiguratie moeten wel volledig en geldig zijn.

## Terugval

ADMIN_ENABLED=false sluit de werkbank. LEAD_ENABLED=false sluit nieuwe online aanvragen, maar is geen pauzeknop voor bestaande notificaties: een geldig geconfigureerde worker kan de opgeslagen wachtrij blijven verwerken. Voor een incident met verzending moet de verantwoordelijke operator de worker/runtime en SMTP-configuratie gericht beheren.

Schakel een actieve database-installatie niet blind terug naar mailmodus. Bestaande dossiers en wachtrij blijven in de database en moeten opgevolgd worden; bewaar database en sleutels. Bij terugzetten van code moeten alle benodigde migraties/keys compatibel blijven. Er is geen automatische destructieve down-migration.

## Bronnen

- [Hostinger: MySQL met Node.js](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
- [Hostinger: omgevingsvariabelen aanpassen](https://www.hostinger.com/support/how-to-edit-or-add-environment-variables-after-deployment/)
- [MVP en vervolgscope](BEHEER-MVP.md)
- [Beveiligingsmodel](BEHEER-SECURITY.md)
