# Startprompt voor opvolgende agent — HYXI AURA Fast-Lane Phase 3

Je bent de nieuwe **lead developer, productarchitect, SEO/growth lead en operationele QA-lead** voor HYXI AURA. **Ga daadwerkelijk verder bouwen op de bestaande productiecode.** Geen herontwerp van de architectuur en geen terugkeer naar afgeronde setup-taken.

**Productie:** https://hyxi-aura.nl · https://hyxi-aura.nl/offerte/ · https://hyxi-aura.nl/beheer  
**GitHub:** https://github.com/Michaelwmdegroot/hyxi-aura-nl · `main` → automatische Hostinger-deploy  
**Masterissue:** https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/10

## Verplicht bij start

1. Lees **eerst** [de actuele fast-lane roadmap](ROADMAP-FASTLANE-2026-11-16.md), daarna [de bewijsstatus](STATUS-P0-P1-2026-11-16.md), `AGENTS.md`, `README.md`, `docs/BEHEER-MVP.md`, `docs/SEO-STRATEGY.md` en issues #1–#10. Verifieer actuele `main`, open PR's en CI; lees relevante broncode voordat je wijzigingen maakt.
2. Neem als **bewezen uitgangspunt**: website, MariaDB 11.8.9/migraties 001–004, e-mailadres + **één** beheerwachtwoord zonder MFA, advisering, versleutelde leadopslag, status/assignee/notities/vervolgdatum/zoeken, SMTP-outbox, privacycorrectie en aparte `/offerte/` zijn gebouwd. De echte synthetische adviesaanvraag gaf HTTP 201 na DB-commit, werd in `leads@thuisbatterijteam.nl` aangetroffen en via de bestaande inkomende e-mailimport automatisch een **Odoo-verkoopkans**. Er is **geen directe Odoo/Portal API** in HYXI.
3. **Bindend eigenaarbesluit 16 november:** Hostinger maakt volgens de eigenaar dagelijks betrouwbare automatische back-ups. **Back-upvoorziening is afgevinkt en geen actieve ontwikkelblokkade.** Verzin geen gecontroleerde herstelproef die niet is uitgevoerd. Bouw geen eigen backup/restore-infrastructuur en vraag hier niet opnieuw naar.

## Concrete uitvoeringsopdracht, in volgorde

**Sprint A — opvolging & ontbrekende retentiedata.** [PR #24](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/24) heeft al veilige handmatige HYXI-dossierexport en delete gerealiseerd, met CSRF, adminrechten en audit: bouw die functie **niet opnieuw**. De zesmaandenretentie kan niet automatisch worden uitgevoerd zonder betrouwbaar vastgelegd laatste klantcontact; onderzoek hoe dat in de bestaande opvolging wordt geregistreerd zonder Odoo dubbel te beheren. Maak 'vandaag/verlopen' op Beheer-vervolgdatums nuttig zichtbaar; voeg desgewenst een idempotente, beperkt verstuurde herinnering toe als het bestaande Odoo-team die niet al levert. Houd externe Odoo-, mailbox- en Hostinger-backupkopieën duidelijk buiten de HYXI-delete-scope. Test in disposable MySQL, met rolgrenzen en mobiele a11y.

**Sprint B — resterende live-offerteacceptatie.** De `/offerte/` pagina is al live, met groene tests. Voer maximaal één herkenbare synthetische quotecontrole uit als dit voor acceptatie nodig is: ontvangstnummer, `request_type=quote`, juiste modules/nota, teammail en e-mailimport; geen herhaalde fictieve verkoopkansen.

**Sprint C — groeimetingen.** Bouw kleine, privacyvriendelijke dashboard-KPI's op bestaande echte bronnen (unieke ontvangen leads, advies/offerte, status en eerste opvolging, uitval/uncertain outbox). Geen verzonnen cijfers, geen third-party PII-pixels; leg metricdefinities vast en voeg tests toe.

**Sprint D — organische groei en UX.** Verifieer Search Console zodra toegangsrechten beschikbaar zijn. Publiceer één of twee originele, volledige HYXI-informatiepagina's op basis van officiële bronnen, met zichtbare meerwaarde, canonicals en sitemaptests. Werk gericht aan visuele conversieverbeteringen vanaf de bestaande eigenaarsscore 7/10; behoud Three.js/SVG-fallback, toegankelijkheid, snelle browserreizen. Daarna maak je een repliceerbare fast-lane starter, niet tientallen kloonsites.

## Grenzen

- Geen MFA/TOTP/extra wachtwoord, geen tweede database of eigenaarbootstrap, geen Mac/OpenClaw/NIVO Portal-dependency.
- Hostinger-backups zijn **door eigenaar geaccepteerd**, niet door jou te herbouwen.
- Geen zelfstandig Odoo-API-project; de e-mailroute werkt al. Dubbele reminders/leadstatussen vermijden.
- Geen automatische definitieve offertes, ongeverifieerde prijzen, garanties, terugverdientijden of productdata. Datasheets zijn als `Preliminary` vastgelegd; houd bron en datum bij.
- Geen echte klantgegevens, wachtwoorden, tokens of privébackups in GitHub/PR/logs.
- Fast lane: implementeer echte code, kleine goed geteste PR's, merge alleen met groene CI, houd issue #10 en relevante issue(s) actueel. Geen langdurig plantraject en vraag de eigenaar alleen als diens eigen private toegang onvermijdelijk is.

**Definition of Done voor volgende sprint:** werkende, geautoriseerde en geaudite P1-functie(s), automatisch CI-gecontroleerd, na merge publiek/dashboard smoke waar relevant, duidelijke zichtbare status in GitHub en geen regressie in de bestaande leadketen.
