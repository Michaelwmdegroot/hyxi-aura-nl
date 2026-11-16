# Phase 4 — premium productweergave en transparante bedrijfsidentiteit

**16 november 2026 · Phase 4 UX-sprint 1 · GitHub issue #6**

## Nieuwe elementen
- Hero-copy legt het geïntegreerde hybride/modulaire product uit en dat de werkelijke aansluitbaarheid persoonsgebonden beoordeeld wordt; geen prijzen, leveringstermijn, opbrengst- of garantieclaim.
- Progressieve, drieledige HYXI-productgalerij met bestaande fabrikant-WebP: front, schuin en andere hoek. Primaire afbeelding initieel aanwezig; extra beelden alleen bij gebruikersinteractie; geen externe bibliotheek of netwerkdienst. De drie knoppen zijn native, toetsenbordbereikbaar, met `aria-pressed`, relevante alt en verklarende caption.
- Vroege, onopgesmukte vertrouwensstrook noemt **NIVO Groep Holland B.V.** (initiatief/exploitatie), **Thuisbatterij Team** (adviseur en ontvanger) en **HYXI** (fabrikant); expliciete niet-officiële fabrikantstatus. Doorlinks naar NIVO en bronverklaring.
- Responsieve en `prefers-reduced-motion`-gestuurde CSS met eigen gallerypositie op mobiel.

## Voor-/na-vergelijking
**Voor:** alleen vooraanzicht in hero, herkomst en verantwoordelijke bedrijven voornamelijk in footer/bronpagina.  
**Na:** drie echte HYXI-aanzichten bovenin; controleerbare bedrijfsherkomst en productbronnen vroeg in de journey; meer beschrijvende hero met concrete klantvragen.

GitHub Actions genereert `desktop-page.png` en `mobile-page.png` na alle browsercontroles. Historische baseline: `docs/screenshots/desktop.jpg`. Deze sprint claimt **geen eigenaarsscore boven 7/10** zonder eigenaarreview en geen gemeten conversiestijging.

## Regressie en acceptatie
- PR op de actuele `main`; bouw, static SEO, unit, Playwright/axe op 1440/390/320 px, alle galerieknoppen op desktop/390, WebGL/SVG, formulier- en beveiligde Beheerflow, geïsoleerde MySQL, productie-only install en Lighthouse.
- Geen wijzigingen in `server/`, MariaDB, SMTP, Beheer, privacy, Odoo, storage of toekomstige portal. Geen nieuwe echte leadproeven.
- Na 3/3 groen merge naar `main`, controleer homepage publiek/readiness en registreer de exacte CI-run. Rollback via revert van de squash-merge op `main` en Hostinger auto-deploy; geen schemawijzigingen.
- Issue #6 blijft open voor daadwerkelijke eigenaarbeoordeling, eventuele echte montagecases met toestemming, mobile Safari review en verdere visuele iteraties.
