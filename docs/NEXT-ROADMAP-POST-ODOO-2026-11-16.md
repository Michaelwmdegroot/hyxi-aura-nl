# HYXI AURA — vervolgroadmap na bevestigde Odoo-ontvangst (16 november 2026)

**Status:** vervolgplan voor de bestaande en autonoom op Hostinger werkende site; geen herbouw van backend/Beheer/database/outbox.  
**Live:** https://hyxi-aura.nl/ · **Hoofdissue:** [#10](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/10) · **Launch-gates:** [volledige checklist](LAUNCH-READINESS-2026-11-16.md).

## Door eigenaar bevestigd: beide aanvraagtypes bereiken Odoo

De gebruiker heeft op **16 november 2026** via twee screenshots van de echte Odoo-CRM-interface aangetoond dat **zowel een HYXI AURA-offerteaanvraag als een HYXI AURA-adviesaanvraag** uit de bestaande `leads@thuisbatterijteam.nl`-mailimport als CRM-**lead** zijn aangemaakt en automatisch toegewezen. De gebruiker bevestigt dat de doorzet in totaal al tweemaal is getest en werkt.

**Technisch afvinken:**
- [x] Beveiligde HYXI intake en afzonderlijke offerte-intent → versleutelde MariaDB-commit.
- [x] Bestaande mailnotificatie aan `leads@thuisbatterijteam.nl` → mailimport in Odoo voor beide typen; eigenaar heeft de twee bijbehorende CRM-leads visueel bevestigd.
- [x] Odoo zet via bestaande regels binnenkomende mails om in toegewezen leads. **Er is geen HYXI→Odoo API nodig en er volgen geen extra synthetische Odoo-testleads.**
- [x] Bestaande admin-only Beheer-Mailcontrole en incidentbanner in [PR #43](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/43). Let wel: **Beheer-waarschuwing bij ingelogd bezoek**, geen externe proactieve monitor.

**Niet overclaimen:** De screenshots tonen CRM-**leads**, niet noodzakelijk al naar een verkoopkans *geconverteerde* of *gewonnen* dossiers. Er is geen bewijs van een eerste verkoopcontact, offerte-uitgifte, verkoopomzet of conversiepercentage. Die verwerking en kwaliteitsmeting horen bij sales in Odoo en vergen **geen nieuwe HYXI-CRM-integratie**. Sla de screenshots niet op in GitHub; ze zijn door eigenaar geleverd en kunnen CRM-/contactgegevens bevatten.

## Prioriteit en concrete acceptatie

| Volgorde | Werkpakket | Wie | Definition of Done |
| --- | --- | --- | --- |
| 0 | **Design finale review V6** | Eigenaar | Live desktop én echte iPhone Safari gecontroleerd; eigenaar geeft ≥9/10 (of exact de laatste verbeterpunten) voor commerciële promotie. 12/12 publieke checks is geen visuele score |
| 1 | **Search Console & indexatie** | Growth + eigenaar bij accountverificatie | Domein geverifieerd; `/sitemap.xml` bekend bij GSC; indexatiestatus van 7 openbare URLs per URL geverifieerd; eventuele fouten gelogd met bron en datum. Niet beweren dat sites geïndexeerd zijn zonder GSC |
| 2 | **Privacyvriendelijke funnelmeting** | Developer/growth met privacybesluit eigenaar | Rechtmatige, minimaal noodzakelijke definitie van page/session, configurator-/formulierstart, serveraccepted lead en bron; geen PII in URL/events of ongeautoriseerde pixels/cookies; dashboard met **echte bezoekers-denominator**, pas dan conversiepercentage |
| 3 | **Zoekintentie-SEO voor aankooporiëntatie** | Growth + development | 1–2 originele, publiek nuttige gidsen gericht op prijsfactoren/installatie/bestaande PV of capaciteit op basis van bronnen, niet duplicaten; interne links naar `/offerte/`, bron-/schema-check, 3/3 CI, live GET |
| 4 | **Salesopvolging vastleggen** | Thuisbatterij Team, operationeel | Naam/rol hoofdverantwoordelijke + vervanger, reactietermijn kantooruren, Odoo-werkproces voor nieuwe lead → kwalificatie/contact/offerte → uitkomst. Niet in HYXI code dupliceren |
| 5 | **Mailbetrouwbaarheid** | Operations | SPF/DKIM/DMARC, spam/bounce en mailboxverantwoordelijkheid checken; het admin-incidentpaneel afhandelen volgens bestaande procedure; alleen indien nodig veilig proactief alarm na owner + kanaal |
| 6 | **Privacykopieën & bewaartermijn** | Operations/privacy | Proces voor verzoeken in HYXI + mailbox + Odoo; actuele laatste-contactbron en bewaartermijn beoordelen; pas dan eventuele automatische HYXI-retentie, geen ongetoetste deletions |
| 7 | **Eerste commerciële instroompilot** | Growth + eigenaar | Na design/meet/operationele GO een beperkt, vooraf goedgekeurd zoekkanaal starten; werkelijke unieke en gekwalificeerde aanvragen/costs vergelijken; alleen dan bijsturen en opschalen |

### Wat we bewust níet gaan bouwen

- Geen tweede Odoo-integratie, Odoo webhook/API, nieuwe Odoo-recordcontrole als releasegate, nieuwe CRM-kloon of nieuwe synthetische aanvraag naar `leads@`.
- Geen nieuwe MariaDB, MFA, ownerbootstrap, backupscript of uitgeschakelde SMTP-flow.
- Geen fictieve prijzen, batterijbesparing, geïndexeerde Google-URLs, conversieratio of automatisch winstgevende leadmachine.
- Geen retargetingpixels of bezoektrackers zonder privacygrondslag; geen ongerichte tientallen SEO-doorways.

## Huidige bewijsbasis

- [Technisch geverifieerde aanvraagketen en originele quoteproef](PHASE3-VERIFIED-2026-11-16.md).
- **Nieuw door gebruiker bevestigd:** beide aanvraagtypen als Odoo CRM-*leads* via de bestaande mailimport op 16 november 2026 (twee Odoo-screenshots in de gebruikersconversatie; niet in GitHub geplaatst).
- [Hero V6 visuele release](PHASE5-EDITORIAL-POLISH-2026-11-16.md) en [admin mailtriage](P1-MAIL-INCIDENT-TRIAGE-2026-11-16.md) gebouwd.
- [Laatste main 3/3 Build & verify](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43956562134) en [12/12 read-only productiecontrole](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43956562135). Deze hebben geen CRM-verkoop uitgeprobeerd.

**Uitvoeringsvolgorde na het eigenaarssignaal:** eerst GSC/indexatie + metriekontwerp (parallel), dan brongetrouwe content en een beperkte acquisitiepilot. De commerciële eigenaar houdt Odoo-verkoopopvolging intern; HYXI levert leads aan de bestaande mailbox.
