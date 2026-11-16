# HYXI AURA — volledige pre-Search Console inhouds-, SEO- en broncontrole

**Datum:** 16 november 2026 · **Auteur:** pre-GSC uitvoerende content-/productaudit  
**Repository:** `Michaelwmdegroot/hyxi-aura-nl` · **Basis `main`:** `3ab171de1a2c809d01b6c47b6d54fe5dfbc705de` · **Feature:** `feature/pre-gsc-content-source-audit`  
**Scope:** ALLE zeven bestaande openbare routes, originele 1-fase/3-fasen-datasheets, officiële HYXI-site en technische contentbronmodule. **Buiten scope:** Search Console instellen, advertenties, database-/outbox-/Odoo-aanpassingen, live testleads.

## 1. Primaire bronnen, onafhankelijk herlezen

De opdrachtgever heeft exact twee voorlopige HYXI-EN-datasheets geüpload:
1. `HYX-H(3-12)K-HSA2_Datasheet_V2.1-20261026_EN-(Preliminary).pdf`, **5 pagina's**, SHA-256 `6c5c6c42383c469cc36fb622cb7748c570333888de887a6809953366a2c222fe`.
2. `HYX-H(5-30)K-HTA2_Datasheet_V2.1-20261026_EN-(Preliminary).pdf`, **5 pagina's**, SHA-256 `1d0a8e3c737f0bca427e6539071c407f4b76ed0687bbef15ed9f60f5c1c0a928`.

Beide geüploade bronbestanden hebben exact de **bestandsgroottes** als de in GitHub aanwezige kopieën: **1.497.333 bytes** en **1.498.576 bytes**. De bytes in GitHub zelf zijn niet opnieuw door een checksum vergeleken; claim daarom geen onafhankelijk hash-match. De officiële [Engelse HYXI AURA-productpagina](https://www.hyxipower.com/en/ProductsDetail/hyxi-aura) linkt nog steeds direct naar deze twee **V2.1 Preliminary** datasheets (via `webfile.hyxipower.com/soft/20261111/`). De website bevestigt ingebouwde ATS zonder aparte back-upgateway, 0ms-omschakeling, 63A passthrough **per fase**, 1–6 modules en marketing tot 54 kWh **totale** energie. De fabrikant noemt ook marketingclaims zoals *unlimited cycles*, *whole home backup* en *20% higher returns*; deze mogen **niet** zonder toepasselijke voorwaarden als generieke installatie-/garantie-/rendementsbelofte worden overgenomen.

**Datasheet, laatste pagina van BEIDE documenten:** BAT-Q7 totale 7,03 kWh, bruikbaar 6,7 kWh, nominaal 3,5 kW, 68 kg; BAT-Q9 totale 9,04 kWh, bruikbaar 8,6 kWh, nominaal 4,6 kW, 79 kg; 1–6 modules per controller, LFP, 10.000 cycli alleen bij **25°C±2°C en 60% EOL**; batterijbedrijfstemperatuur −20 tot +55°C, IP66. De AURA-omvormerdocumenten beschrijven **omvormer** −30 tot +60°C: dit is **niet** de uniforme temperatuurgrens van de gehele batterijopslag.

**Omvormerfamilies:** HSA2 = eenfasige productfamilie, 3–12 kW nominale uitvoeringen; HTA2 = driefasige productfamilie, 5–30 kW. Zowel 0 ms als 63 A zijn **fabrikantspecificaties**, geen garantie op onbeperkt batterijvermogen, UPS-werking met iedere belasting of volledige woningachtervang.

**Bevestigde fouten in voorlopige HTA2-datasheet zelf:**
- Eerste technische tabel op pagina 1 heeft in het **HTA2**-document modelkolommen gelabeld als `...-HSA2`; dit is intern inconsistent.
- `Max. PV Input Power` voor de 8k-variant is geprint als **160000W**, een kennelijke factor-tien-typfout; gebruik **geen gecorrigeerd getal als definitief feit** voordat de fabrikant dit bevestigt.
- Ook op pagina's 2–4 staan HSA2-modelaanduidingen onder HTA2-koppen. De site moet deze mislabels niet klakkeloos reproduceren of als zekere leverbare modelcodes presenteren.

## 2. Bestaande 7 routes — geautomatiseerde broncode-audit

Alle zeven productie-ingangspagina's zijn statisch vanaf `main` gelezen; actuele live-readiness 12/12 van `main` bewijst bereikbaarheid, maar is **geen** onafhankelijke volledige live-content-render van alle pagina's. De technische audit heeft **zeven unieke canonicals, zeven H1's, een actuele robots/sitemap en nul onopgeloste lokale links of ontbrekende fragmenten** aangetroffen. De bestaande `scripts/check.mjs` controleert ook gegenereerde links/fragmenten/bronbestanden. GSC-indexatie is niet geverifieerd.

| URL | Inhoudstoestand vóór verbetering | Concreet actiepunt |
| :-- | :-- | :-- |
| `/` | sterke premium hero, ~1.800 leesbare woorden, bronverantwoording, prijscaveats en beveiligde aanvraag | inhoud niet opnieuw ontwerpen; zorgvuldig linken naar aparte fasevergelijking |
| `/bronnen/` | nuttige uitleg, datasheet-, garantie- en module-tabel, 746 woorden | broncontroledatum actualiseren; zichtbare waarschuwing over HTA2-typo en voorlopige modelnamen; TBT-first merk |
| `/offerte/` | zelfstandige offerteflow met beveiligde consent, 375 woorden uitleg | TBT als aanbieder in header/footer, kortere meta-description; bestaande POST/onboarding niet wijzigen |
| `/kennis/bat-q7-vs-bat-q9/` | originele, stevige keuzehulp (~848 woorden), exacte 7.03/6.7 & 9.04/8.6, vermogens-/gewichtstabel | merkidentiteit consistent, eigen link naar verschil 1- en 3-fasen, voorkomen dat 7/9 kWh als eigen systeemvermogen geldt |
| `/kennis/noodstroom/` | originele gids (~884 woorden), nu juiste 63A- versus noodvermogen-uitleg | consistente TBT-merknaam, interne link naar fasegids met installatie- en aansluitonderscheid |
| `/kennis/installatiecheck/` | interactieve nuttige driedelige voorbereiding (~770 woorden), geen PII in GET-handoff | juiste TBT-merknaam; verwijzing fasegids, kortere meta-desc |
| `/privacy/` | ~1.179 woorden, beveiligingscookies en retentie transparant, privacyversie 15 november | expliciet vermelden dat `leads@thuisbatterijteam.nl` e-mail via bestaande import in **Odoo CRM** als lead kan worden verwerkt; datum/consentversie gelijktijdig consistent aanpassen, kopieën en handmatige verwijdering juist toelichten |

**Branding-issue:** publieke homepage is TBT-first in header én footer. Op de overige zes routes staan nog oude `HYXI AURA`-merkregels waardoor het opnieuw op een fabrikantwebsite kan lijken. Harmoniseer op 7/7 routes als **Thuisbatterij Team / presenteert HYXI AURA**, zonder een officieel HYXI-dealership/logo te verzinnen. NIVO blijft exploitant en verwerkingsverantwoordelijke zoals in de bestaande privacytekst.

**SEO-copy:** de bestaande indexeerbare Q7/Q9- en noodstroomgidsen zijn **geen dunne placeholders**; behoud hun originele unieke inhoud. De meta descriptions voor offerte en installatiecheck zijn relatief lang (175/182 tekens); inkorten zonder keyword-stapeling. Nieuwe aanvullende route wordt alleen toegevoegd voor een **afzonderlijke technische koopvraag**: `HYXI AURA 1 fase of 3 fasen`, waarbij de 1-/3-fase-omvormerfamilies, technische én praktische aansluiting, relevante backupbeperkingen en datasheetfouten aantoonbaar verder uitgewerkt worden dan de installatiecheck. Niet een duplicaat van die interactieve check.

## 3. Prioriteiten / GO-criteria

1. **P0 – feiten en privacy:** Odoo-afhandeling eerlijk noemen; update bestaande privacyversie in website, nieuwe DB-leadprivacyversion en notificatiemail in **één** PR (zodat bewijs en consentmetadata niet uit elkaar lopen); formulieren en huidige bestaande opslag blijven overigens ongewijzigd. Corrigeer op bronnenpagina zichtbare Preliminary-/HTA2-datasheetwaarschuwing.
2. **P0 – afzender:** alle zeven huidige publieke route-headers en voetteksten consistent met TBT-presentatie; geen designdisruptie van hoofdpagina of fout op 320/390px.
3. **P1 – unieke fasegids:** achtste publieke SEO-route `/kennis/1-fase-of-3-fasen/`, >900 woorden originele consumentenvoorlichting, eigen H1/title/canonical/Article+BreadcrumbList, echte vergelijkende tabel zonder onzekere PV-waarde, datum/bronnen en CTA naar configurator/offerte; intern ontdekt vanuit homepage, installatiecheck en relevante gidsen. Geen willekeurige extra ‘prijs zonder prijs’-SEO-doorway.
4. **P1 – preventieve QA:** sitemap 7→8, Vite route, test bronintegriteit tegen `MODULES`, metadata, links, privacy-consentversie consistent, browser WCAG desktop/390/320, no-overflow, hele bestaande web/Beheer/MySQL/leadflow en GSAP unchanged; publieke read-only monitor voegt exact nieuwe route toe.
5. **Release:** 3/3 groen op PR-head; pas dan merge; 3/3 groen na merge en 13/13 publieke productiechecks inclusief de achtste sitepagina. **Niet** claimen dat Google al indexeert of dat verkoopresultaten stijgen.

## 4. Wat open blijft

- Echte Google-indexatie en Search Console-eigendom tot na deze audit.
- Eigenaar visuele eindreview (≥9/10, echte iPhone Safari).
- Salesbeheer, echte kwalificatie/omzet, privacybeleid voor HYXI + Odoo/mail; Odoo e-maildoorzet voor beide leadtypes is **al bewezen** en hoeft niet opnieuw te worden getest.
- Garantiematrix BAT-Q7 t.o.v. BAT-Q9 schriftelijk bevestigen; huidige EU-documenten zijn de bron, geen claim voor batterijgarantie zonder voorwaarden.
- HSA2/HTA2 datasheetfouten bij fabrikant opvragen; niet ‘zelf’ technische waarden fixen.
