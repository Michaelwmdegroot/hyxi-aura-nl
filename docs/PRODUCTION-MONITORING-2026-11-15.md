# HYXI AURA — automatische publieke productiecontrole

De GitHub Actions workflow `.github/workflows/public-production-readiness.yml` controleert **na elke push op main** en **dagelijks** een aantal publiek leesbare kenmerken van de website met `node scripts/probe-production.mjs`.

## Wat gecontroleerd wordt

- Publieke `/api/health`: bereikbaar en `leadEnabled: true`.
- Publieke `/api/config`: dezelfde beschikbaarheidsstatus. De respons kan een CSRF-token bevatten: **de workflow logt dit nooit**.
- `/privacy/`: nieuwe DB-privacytekst is live gedeployd.
- `/sitemap.xml` en `/robots.txt`: minimale SEO-bereikbaarheid.
- `/api/beheer/leads` zonder login: moet **401** geven; er wordt geen beheerlogin geprobeerd.

De workflow verstuurt **geen** testleads en doet geen DB- of mailbox-toegang. Alle uitvoer is beperkt tot PASS/FAIL per controle. Elke rode run is een operationeel signaal, maar niet automatisch bewijs van echte lead- of mailuitval (denk aan DNS/capacity/push vóór afgeronde Hostinger deploy). Controleer de fout en herhaal na stabilisatie.

## Grenzen

Een groene run bewijst dat publieke endpoints bereikbaar en intake-vlaggen ingeschakeld zijn. Het bewijst **niet** dat een lead ook in MariaDB is gecommit, dat de mail uit de outbox is verzonden, dat de inbox daadwerkelijk ontvangen heeft of dat back-ups zijn teruggezet. Deze controles blijven onderdeel van de [P0-acceptatieprocedure](P0-PRODUCTION-ACCEPTANCE-2026-11-15.md).

Er is geen afhankelijkheid van een draaiende Mac, NIVO Portal of externe uptime-dienst. De GitHub-workflow is als fast-lane basis naar toekomstige onafhankelijke websites te porteren, maar domein, privacytekst, statusroutes en contactcontext moeten per merk worden aangepast.
