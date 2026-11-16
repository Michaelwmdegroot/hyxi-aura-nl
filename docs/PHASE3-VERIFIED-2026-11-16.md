# HYXI AURA — Phase 3: uitvoering, productieacceptatie en volgende prioriteiten
**Statusdatum:** 16 november 2026  
**Website:** https://hyxi-aura.nl · **Dashboard:** https://hyxi-aura.nl/beheer · **Offerte:** https://hyxi-aura.nl/offerte/  
**Repository:** Michaelwmdegroot/hyxi-aura-nl, productiebranch `main`.

## Nieuwe opleveringen na P1 privacyrelease

| Gebouwd | Status en bewijs | Zakelijke waarde |
| --- | --- | --- |
| [PR #26](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/26) — Vervolgacties vandaag/verlopen | Gemerged naar `main` (`447ee6c`), 3/3 groene CI, externe productiereadiness groen | Sales en admin kunnen actie-overzicht en dossierdetails openen zonder nieuwe Odoo- of mail-workflow |
| [PR #27](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/27) — Privacyvriendelijke lead-KPI's | Gemerged naar `main` (`843900d`), 3/3 groene CI, externe productiereadiness groen | 14-daagse daadwerkelijke ontvangen advies- en offerteaanvragen per UTC-dag, rolgescheiden en zonder trackingpixels |
| Nieuwe offerte-P0-acceptatie | [Eénmalige GitHub Action](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43785349123) **HTTP 201** met `AURA-3b22e306-ebee-406f-94f8-8d72b74ffbab`; corresponderende `[HYXI AURA] Nieuwe offerteaanvraag` werkelijk in `leads@thuisbatterijteam.nl` INBOX aangetroffen (2026-11-16 01:17:18 UTC) | Ook de afzonderlijke offertevariant is aantoonbaar opgeslagen en de juiste interne mail ontvangen |

De synthetische quote bevatte een herkenbaar testlabel, **3 × BAT-Q7**, projectwensen, herkomst en privacyversie `2026-11-15`, allemaal inhoudelijk gecontroleerd in de ontvangen e-mail. **Geen echte klantgegevens**, mailbody, wachtwoorden of screenshot van privé-CRM is in GitHub geplaatst. Voor specifiek deze offerte is de verdere **Odoo-mailimport niet afzonderlijk opnieuw bewezen**. De eerdere adviesflow was al tot een Odoo-verkoopkans door eigenaar bevestigd.

## Precisie over de nieuw gebouwde functionaliteit

**Vervolgacties:** huidige datum wordt bepaald in tijdzone `Europe/Amsterdam`, en status `won`/`lost`/`not_suitable` sluit afgesloten leads uit. De datum staat versleuteld en is nog niet als afzonderlijk SQL-indexveld beschikbaar. Daarom scant de eerste versie maximaal **2.500 actieve zichtbare dossiers** en toont maximaal **100 acties**, met een expliciete waarschuwing bij een mogelijke onvolledige scan. Dat is een **echte schaalgrens**, niet verstopt achter een misleidend 'alle taken'-totaal. Geen automatische reminder of extra Odoo-API.

**KPI's:** de laatste 14 **UTC-dagen**, op basis van op dit moment bestaande, transactioneel opgeslagen HYXI-leads. Het huidige `request_type` splitst `advice`, `quote` en overige typen; ontbrekende dagen worden nul. Beheerders zien de organisatie en sales alleen huidige eigen toewijzingen. De meting is **geen** websiteverkeer, leadconversiepercentage, eerste menselijk-contacttijd, omzet of historische cumulatieve telling van inmiddels gewiste dossiers. Er zijn geen cookies/pixels/events aan de publieke website toegevoegd.

**Privacyoperatie:** de eerdere [PR #24](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/24) is afgerond: geauditeerde handmatige dossierexport/-verwijdering. Zesmaandenretentie blijft echter **niet automatisch afgedwongen**, omdat een bewezen datum van het **laatste werkelijke klantcontact** ontbreekt; e-mail- en Odoo-kopieën vragen afzonderlijke verwerking. De dagelijkse Hostinger-backups zijn door eigenaar als voldoende bevestigd; dit is geen onafhankelijk hersteltestbewijs.

## Nog open, nu op volgorde van waarde

1. **#4 en #2 — betrouwbaarheid van vervolgdossiers:** bij groei de begrensde due-scan vervangen door een indexeerbare, privacybewuste due-projectie zodra werkelijk nodig; vastleggen van gecontroleerd `last_contact_at` als basis voor retentie (niet gelijkstellen aan technische statuswijziging). Geen extra mailing totdat het huidige Odoo-opvolgproces daartoe aanleiding geeft.
2. **#7 — duurzame SEO:** Search Console-verificatie bij eigenaar, echte indexdekking, unieke diepgaande informatiepagina's op officiële HYXI-bronnen over capaciteit, installatie, compatibiliteit, back-up en prijsfactoren (geen verzonnen eurobedragen of opbrengsten). Sitemap/robots/canonical en `/offerte/` zijn al live.
3. **#6 — premium conversie-UX:** gerichte verbeteringen boven bestaande 7/10, gebaseerd op officiële productbeelden, menselijk vertrouwen, mobile Safari en behoud van snelle Three.js/SVG-fallback.
4. **#8 — volwassen meetdefinities:** bezoekers-/formulierstartmetingen en echte eerste opvolging pas ontwerpen als privacygrondslag, consentregime en sales-/Odoo-bron betrouwbaar zijn. De 14-daagse leadvolumes hoeven niet opnieuw gebouwd.
5. **#9 — operationele afspraken:** alerts voor `failed`/`uncertain` meldingen en eigenaarschap/fallback; geen eigen Hostinger-backupsysteem, geen MFA of directe Portal-API.

## Releasebewijs, instellingen en grenzen

- `main` autodeployt op Hostinger; CI test Node 24, production-only install, geïsoleerde MySQL, complete publieke advies- en offertestromen, desktop/mobile Beheer, WCAG en Lighthouse.
- [Run PR #26](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43784169973) geslaagd; [run PR #27](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43785092284) geslaagd.
- [Publieke readiness na KPI-merge](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43785383303) geslaagd. **Deze publieke probe leest geen private dashboardgegevens**; geautoriseerde Beheer-functionaliteit is uitsluitend in geïsoleerde CI getest, niet met het werkelijke eigenaarwachtwoord.
- Geen nieuwe MariaDB-schema's/migraties, geen extra Beheer-accounts, geen 2FA, geen productie-wachtwoorden of API-geheimen in GitHub, geen afhankelijkheid van een Mac.
- Odoo CRM-leads ontstaan via **inkomende e-mail**. De kernsite blijft onafhankelijk van Odoo, OpenClaw, Mac en NIVO Portal.

Voor verdere uitvoering: [actuele roadmap](ROADMAP-FASTLANE-2026-11-16.md), [technische vervolgacties](P1-DUE-FOLLOWUPS-2026-11-16.md), [KPI-definities](P2-LEAD-KPIS-2026-11-16.md), [privacybeperkingen](PRIVACY-P1-MANUAL-OPS-2026-11-16.md) en [masterissue #10](https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/10).
