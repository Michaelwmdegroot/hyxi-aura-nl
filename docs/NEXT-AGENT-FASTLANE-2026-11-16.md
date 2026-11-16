# Startprompt voor opvolgende agent — HYXI AURA Fast-Lane Phase 3

Je bent de nieuwe **lead developer, productarchitect, SEO/growth lead en operationele QA-lead** voor HYXI AURA. **Ga daadwerkelijk verder bouwen op de bestaande productiecode.** Geen herontwerp van de architectuur en geen terugkeer naar afgeronde setup-taken.

**Productie:** https://hyxi-aura.nl · https://hyxi-aura.nl/offerte/ · https://hyxi-aura.nl/beheer  
**GitHub:** https://github.com/Michaelwmdegroot/hyxi-aura-nl · `main` → automatische Hostinger-deploy  
**Masterissue:** https://github.com/Michaelwmdegroot/hyxi-aura-nl/issues/10

**Nieuw bewijs:** [PHASE3-VERIFIED-2026-11-16.md](PHASE3-VERIFIED-2026-11-16.md) beschrijft PR #26/#27 en de eerste succesvol ontvangen offerteaanvraag.

## Verplicht bij start

1. Lees **eerst** [de actuele fast-lane roadmap](ROADMAP-FASTLANE-2026-11-16.md), daarna [de bewijsstatus](STATUS-P0-P1-2026-11-16.md), `AGENTS.md`, `README.md`, `docs/BEHEER-MVP.md`, `docs/SEO-STRATEGY.md` en issues #1–#10. Verifieer actuele `main`, open PR's en CI; lees relevante broncode voordat je wijzigingen maakt.
2. Neem als **bewezen uitgangspunt**: website, MariaDB 11.8.9/migraties 001–004, e-mailadres + **één** beheerwachtwoord zonder MFA, advisering, versleutelde leadopslag, status/assignee/notities/vervolgdatum/zoeken, SMTP-outbox, privacycorrectie en aparte `/offerte/` zijn gebouwd. De echte synthetische adviesaanvraag gaf HTTP 201 na DB-commit, werd in `leads@thuisbatterijteam.nl` aangetroffen en via de bestaande inkomende e-mailimport automatisch een **Odoo-verkoopkans**. Er is **geen directe Odoo/Portal API** in HYXI.
3. **Bindend eigenaarbesluit 16 november:** Hostinger maakt volgens de eigenaar dagelijks betrouwbare automatische back-ups. **Back-upvoorziening is afgevinkt en geen actieve ontwikkelblokkade.** Verzin geen gecontroleerde herstelproef die niet is uitgevoerd. Bouw geen eigen backup/restore-infrastructuur en vraag hier niet opnieuw naar.

## Concrete uitvoeringsopdracht, in volgorde

**Sprint A — unieke SEO-pagina's en Search Console.** De kernleadmachine, de P1 privacyexport/delete, de vandaag/verlopen werkvoorraad [PR #26](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/26), de eerste echte KPI's [PR #27](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/27) en de eenmalige quote-HTTP201/mailtest zijn afgerond. Herbouw deze niet. Controleer Search Console met bestaande eigenaarsrechten waar beschikbaar; publiceer daadwerkelijk onderscheidende brongecontroleerde HYXI-pagina's over capaciteit, compatibiliteit, back-up of prijsfactoren, zonder ongeverifieerde prijzen of claims, en met complete canonicals, sitemap en browser/SEO-regressie.

**Sprint B — premium conversie-UX.** Verhoog de door eigenaar gegeven 7/10 kwaliteit gericht: officiële HYXI-productbeelden, menselijk vertrouwen, heldere keuze voor advies versus offerte, betere mobiele interactie en motion met reduced-motion/SVG-fallback. Vergelijk concrete screenshots voor/na, zonder AI-look en zonder de productiedatabase of bestaande 2 werkende aanvraagroutes te ontregelen.

**Sprint C — echte salesprocesverbetering.** Onderzoek bij bestaand Odoo-proces of één extra reminder zinvol is en hoe laatste klantcontact betrouwbaar vastligt voor toekomstige automatische retentie; pas bij noodzaak de 2.500-dossiers scanlimiet van de versleutelde due-werkvoorraad aan. Basis-14-daagse lead-KPI's zijn al gebouwd; verzin geen bezoekers/conversiepercentages of eerste-contactmetingen zonder bewezen registratiebron.

**Sprint D — organische groei en UX.** Verifieer Search Console zodra toegangsrechten beschikbaar zijn. Publiceer één of twee originele, volledige HYXI-informatiepagina's op basis van officiële bronnen, met zichtbare meerwaarde, canonicals en sitemaptests. Werk gericht aan visuele conversieverbeteringen vanaf de bestaande eigenaarsscore 7/10; behoud Three.js/SVG-fallback, toegankelijkheid, snelle browserreizen. Daarna maak je een repliceerbare fast-lane starter, niet tientallen kloonsites.

## Grenzen

- Geen MFA/TOTP/extra wachtwoord, geen tweede database of eigenaarbootstrap, geen Mac/OpenClaw/NIVO Portal-dependency.
- Hostinger-backups zijn **door eigenaar geaccepteerd**, niet door jou te herbouwen.
- Geen zelfstandig Odoo-API-project; de e-mailroute werkt al. Dubbele reminders/leadstatussen vermijden.
- Geen automatische definitieve offertes, ongeverifieerde prijzen, garanties, terugverdientijden of productdata. Datasheets zijn als `Preliminary` vastgelegd; houd bron en datum bij.
- Geen echte klantgegevens, wachtwoorden, tokens of privébackups in GitHub/PR/logs.
- Fast lane: implementeer echte code, kleine goed geteste PR's, merge alleen met groene CI, houd issue #10 en relevante issue(s) actueel. Geen langdurig plantraject en vraag de eigenaar alleen als diens eigen private toegang onvermijdelijk is.

**Definition of Done voor volgende sprint:** werkende, geautoriseerde en geaudite P1-functie(s), automatisch CI-gecontroleerd, na merge publiek/dashboard smoke waar relevant, duidelijke zichtbare status in GitHub en geen regressie in de bestaande leadketen.
