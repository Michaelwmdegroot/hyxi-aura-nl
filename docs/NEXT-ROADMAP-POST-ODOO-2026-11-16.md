# HYXI AURA — vervolgroadmap na bevestigde Odoo-ontvangst (16 november 2026)

**Status:** vervolgplan voor de bestaande en autonoom op Hostinger werkende site; geen herbouw van backend/Beheer/database/outbox.  
**Live:** https://hyxi-aura.nl/ · **Hoofdissue:** [#10](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/10) · **Launch-gates:** [volledige checklist](LAUNCH-READINESS-2026-11-16.md).

## Overname na PR #46 — actuele vertrekpositie

- **Pre-Search Console inhouds- en broncontrole: DONE.** Laatste functionele code-/monitor-merge `f1b55681` (PR #46), publiek geteste **14/14 PASS** op 16 november 2026. Bronwaarschuwing HTA2/HSA2 en onzekere `160000W` is live bewaakt; acht zelfstandige routes zijn in de sitemaps/checks opgenomen. Zie [volledige audit](PRE-GSC-CONTENT-FACT-AUDIT-2026-11-16.md).
- **GSC nog OPEN:** de GSC Wizard-app wees op 16 november 2026 opnieuw zowel accountinformatie als propertylijst af met `payment_required` (geen actieve trial/abonnement). Niet blijven proberen zonder gewijzigde toegang; de eigenaar kan de **gratis** Google Search Console rechtstreeks gebruiken via `https://search.google.com/search-console`. Propertyverificatie en URL-indexatiestatus zijn **niet** geverifieerd.
- **Commerciële GO nog OPEN:** eigenaarsscore V6 minimaal 9/10 op desktop en echte iPhone Safari; echte sitebezoekers-naar-leadmeting en operationele sales-SLA niet bewezen. Bestaande leadmailimport naar Odoo voor beide typen is reeds getest; stuur geen nieuwe synthetische aanvragen.
- **Scope:** uitsluitend handoff/documentatie; wijzig geen productcodes, prijzen, registratie, backend, mail, GSAP of officiële voorlopige PDFs zonder afzonderlijke getoetste opdracht.

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
| 0 | **Design finale review V6** | Eigenaar | Live desktop én echte iPhone Safari gecontroleerd; eigenaar geeft ≥9/10 (of exact de laatste verbeterpunten) voor commerciële promotie. 14/14 publieke checks is geen visuele score |
| 1 | **Search Console & indexatie** | Growth + eigenaar bij accountverificatie | Domein geverifieerd; `/sitemap.xml` bekend bij GSC; indexatiestatus van alle 8 publieke URLs per URL geverifieerd; eventuele fouten gelogd met bron en datum. Niet beweren dat sites geïndexeerd zijn zonder GSC |
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
- [Historische 3/3 Build & verify](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43956562134) en [12/12 live-checks](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43956562135) zijn inmiddels opgevolgd door [PR #45](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/45), [PR #46](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/46) en [14/14 read-only productiechecks](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43971898853), inclusief alle acht routes. Dit bewijst geen CRM-verkoop of Google-indexatie.

**Uitvoeringsvolgorde na het eigenaarssignaal:** eerst GSC/indexatie + metriekontwerp (parallel), dan brongetrouwe content en een beperkte acquisitiepilot. De commerciële eigenaar houdt Odoo-verkoopopvolging intern; HYXI levert leads aan de bestaande mailbox.


## 17 november 2026 — favicon en laatste SEO-eerste-indruk-afwerking DONE

Na de pre-GSC fabrikant-/copy-audit zijn het **origineel door eigenaar aangeleverde huis/batterij-icoon** en de resterende zoekresultaat-/merkmetadata daadwerkelijk gebouwd, getest en live gepubliceerd. [PR #48](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/48) is gemerged als `4653b842`, [3/3 CI op main](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43989145262) en [15/15 publieke Hostinger-checks](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43989145299) zijn groen. Lighthouse PR-head desktop én mobiel vier categorieën 100; dit is een laboratoriumscore, geen Google-posities of gemeten conversie.

**Niet opnieuw bouwen:** favicon/apple-touch/manifest en bijpassende 192/512-beeldbestanden; acht unieke publieke SEO-routes met consistente OpenGraph, canonical, titles en structured data; bestaande MySQL/outbox/Beheer/Odoo-aanvragen. [Exact releasebewijs en beperkingen](PRE-GSC-BRAND-SEO-RELEASE-2026-11-17.md).

**Hierna:** eigen, gratis Google Search Console-property verifiëren, de huidige sitemap indienen, de acht URL's met echte indexatiegegevens beoordelen. Losstaand blijft eigenaarreview design op iPhone Safari en privacyvriendelijke bezoek-naar-leadmeting. Geen automatisch indexatiesucces claimen vóór GSC-data.
