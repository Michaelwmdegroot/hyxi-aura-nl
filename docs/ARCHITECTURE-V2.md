# HYXI AURA 2.0 — Technische architectuur (ontwerp)
**Datum:** 14 november 2026. **Niet in productie geïmplementeerd.**

## 1. Bestaande technische situatie
Node.js 24, Express, Vite, Three.js, Zod en Nodemailer. De publieke API valideert origin/CSRF/body, herkent dezelfde aanvraag en verzendt via SMTP. Limieten en verzendstatussen zitten in het geheugen; persoonsgegevens staan na aflevering alleen in de teammailbox. Geen MySQL, auth, outbox of dashboard aanwezig.

## 2. Nieuwe gegevensroute
    Bezoeker -> beveiligde POST /api/leads
             -> valideer intent, consent en idempotency
             -> MySQL COMMIT: leads + submission_keys + lead_events + notification_outbox
             -> HTTP 201: aanvraag ontvangen, uniek aanvraagnummer
             -> gecontroleerde notificatieverwerking -> Hostinger SMTP -> leads@thuisbatterijteam.nl
             -> dashboard, alleen na veilige login
             -> optioneel later: versieerbare NIVO Portal-adapter

Belangrijke semantiek: na een geslaagde databasecommit is de aanvraag ontvangen, ook wanneer een teamnotificatie nog wacht; toon niet ten onrechte 'e-mail afgeleverd'. Bij falende DB-write geen succes. Bij falende SMTP-write geen verlies van reeds opgeslagen lead. Voorkom dat bezoekers automatisch eindeloos opnieuw versturen.

## 3. Voorgestelde MySQL-dataobjecten
| Object | Inhoud / doel |
|---|---|
| leads | uniek ID, contact, postcode, bron, type advies/offerte, productprofiel, status, eigenaar, privacyversie, created/updated |
| submission_keys | idempotency-key, inhoudhash, uniek lead-ID, validiteitsduur, unique index |
| lead_events | append-only status/wijziging/contactering met actor en tijd |
| notification_outbox | uniek notificatie-ID, type, status, pogingenteller, retry-na, SMTP-resultaatcode |
| admin_users | accounts zonder self-signup, rol, gehashte wachtwoorden, MFA en disabled_at |
| admin_sessions | gehashte sessiesleutels, verlopen/revoked, minimale devicecontext |
| admin_audit | actor, actie, dossier-ID, tijd, resultaat; geen requestbody/PII in log |
| aggregated_events | alleen veilige funnelaggregaten; nog niet activeren zonder privacybeoordeling |

Hostinger ondersteunt MySQL bij Node; gebruik mysql2/promise, DB_HOST=127.0.0.1, DB_PORT=3306, prepared statements, minimaal bevoorrechte gebruiker, schema-migraties, back-up en daadwerkelijke hersteltest. Hostinger-documentatie: https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/

## 4. API-contracten
- V1 blijft achterwaarts compatibel. Adviesaanvragen zonder requestType worden als advice verwerkt; quote wordt een later expliciet toegelaten requestType.
- Response bevat een onveranderlijk aanvraagnummer, ontvangststatus en geen persoonsgegevens.
- Zelfde Idempotency-Key + zelfde inhoud = zelfde lead; zelfde key met andere inhoud = 409.
- SQL-transactie commit vóór ontvangstbevestiging; outbox-event in dezelfde transactie.
- In backoffice worden ontvangen, genotificeerd, gekwalificeerd, offerte verzonden en gewonnen/verloren afzonderlijke toestanden.
- Rate limiting, honeypot, max body, consent, CSRF en origincontroles behouden of versterken.

## 5. Dashboard security
Afgeschermd onder /beheer en niet indexeerbaar. Server-side RBAC op ieder endpoint (geen client-only toegangscontrole), admin- en salesrollen met beperkte rechten, geen publieke registratie. Sla wachtwoorden op via beproefde Argon2id/equivalente hash, MFA voor beheer, eenmalige uitnodigings-/hersteltokens, Secure/HttpOnly/SameSite cookies, sessierevocation, CSRF, brute-force-limieten en audittrail. Begin bij accounts en autorisatietests vóór het tonen van één echte lead.

## 6. Notificatie/outbox
Claim en verwerk notificaties transactieveilig; retries met backoff; duidelijke afwijs-/onzekerstatus. SMTP kent geen absolute exactly-once garantie. Ambigue SMTP-respons vraagt behoedzaamheid en eventueel handmatige bevestiging. Een uniek message-id en notificatierecord voorkomen waar mogelijk dubbel werk. Kies pas een worker/cronmechanisme nadat Hostinger-ondersteuning op het betreffende pakket geverifieerd is; neem geen oneindig draaiende worker aan. Leadontvanger is leads@thuisbatterijteam.nl; SMTP-afzender blijft de eigen Hostinger-mailbox.

## 7. AVG/privacy
Bestaande privacyverklaring noemt NIVO Groep Holland B.V. als websiteverantwoordelijke, Thuisbatterij Team voor opvolging en zes maanden bewaartermijn voor afgeronde dossiers zonder klantrelatie. Dat is gepubliceerd, niet geautomatiseerd. Voordat MySQL en analytics worden aangezet: rollen/grondslag, verwerkers, opslag, rechten, retentie en verwijdering inclusief mail/werkadministratie laten kloppen met werkelijk beheer. Geen PII in analytics of foutmeldingen.

## 8. Veilige incrementele uitrol
1. Eerst DB-schema + migraties/testdata in geïsoleerde omgeving, backup/restore en negatieve tests.
2. Daarna verbinding/health zonder de bestaande API-route te breken.
3. Nieuwe opslag met featureflag en outbox, met testaanvragen en controlemomenten.
4. Pas na bewijs van betrouwbare opslag overstappen van SMTP-only naar DB als bron van waarheid.
5. Auth/invitations in geïsoleerde omgeving, autorisatietests op alle persoonsdata-routes.
6. Werkbank openbaar voor bevoegde accounts, logs/retentie conform beleid.
7. Offertes, analytics en Portal-adapter pas na afzonderlijke review.

## 9. Voorgestelde toekomstige environment keys
Dit is nog **geen** benodigde configuratie van de huidige live app. Voeg pas toe wanneer de nieuwe code gereed is.

    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_NAME=(Hostinger databasenaam)
    DB_USER=(Hostinger DB-gebruiker)
    DB_PASSWORD=(geheim, nooit in Git)
    ADMIN_SESSION_SECRET=(lang uniek geheim)
    LEAD_TO=leads@thuisbatterijteam.nl

## Issues en eigenaarstoegang
[Mail #1](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/1) · [DB #2](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/2) · [Login #3](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/3) · [Dashboard #4](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/4) · [Offertes #5](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/5) · [Analytics #8](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/8) · [Operations #9](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/9)
