# HYXI AURA — Phase 4 Installation Check

**Datum:** 16 november 2026 · **Issues:** #7 (zoekintentie/organische waarde), #6 (persoonlijke conversie-UX), #10 (master)  
**Scope:** `feature/phase4-installatiecheck` / PR bij indiening

## Werkelijk gebouwd

Nieuwe `/kennis/installatiecheck/` heeft een eigen zoekintentie: *is mijn bestaande zonnepanelen-/meterkast- en gebruikssituatie voorbereid op een HYXI AURA-aanvraag?* Naast nuttige, originele statische uitleg voert de bezoeker vrijwillig drie vragen in: zonnepanelen `yes/planned/no`, aansluiting `single/three/unknown` en doel `solar/prices/backup/unsure`. In de UI geeft een klein, brongetrouw toelichtingsvak de eerstvolgende onderzoekspunten. **Geen automatische productsizing of compatibiliteitsbeslissing, geen beloofde besparing, garantie of prijs.**

De native HTML-form werkt zonder JavaScript via `GET /offerte/?solar=...&phase=...&goal=...`. De bestaande offertepagina neemt alleen expliciet toegestane waarden over; onbekende/ongeldige URL-waarden worden genegeerd. **Geen PII, notes of leadgegevens worden in URLs gezet, geen opslag/pixels/cookies voor deze checker.** De bestaande offerteacceptatie blijft ongewijzigd en vraagt pas daar om contactgegevens en toestemming.

## Content en herkomst

[Fabrikant HYXI AURA](https://www.hyxipower.com/nl/ProductsDetail/hyxi-aura) en lokaal vastgelegde 1-/3-fase datasheets V2.1 d.d. 26 oktober 2026 **Preliminary**. Geen aanname van compatibiliteit met bestaande PV-omvormers of volledige noodstroom voor elk huishouden. NIVO Groep Holland B.V. exploiteert website, Thuisbatterij Team behandelt aanvraag; geen officiële HYXI-dealersite geclaimd. Originele inhoud linkt naar capaciteitgids en noodstroomgids.

## SEO en test

- Zevende publiek indexeerbare statische Vite-route met unieke title/meta, canonical, OG, WebPage/BreadcrumbList structured data, semantische H1, interactie optioneel.
- Homepage, bestaande kennisartikelen en offerte hebben inhoudelijke contextlinks; bijgewerkte sitemap, check script en 10-punten read-only externe production probe.
- `npm run build`, `npm test`, `npm run check`, Chromium op 1440/390/320 (screenshots, axe A/AA, daadwerkelijk ingevulde antwoorden op offerteroute, geen POST) en MySQL/Beheer/energie-fallback/Lighthouse in CI.
- Voorgaande 9/9 live-readiness op main is historische baseline. De nieuwe 10/10 status wordt **uitsluitend** genoteerd na werkelijke Hostinger-probe.
- Hostinger backup / MariaDB / JWT, Beheer, SMTP, mail-Odoo en privacyretentie ongewijzigd; rollback via één revert van release-squash en automatische main-deploy.

## Grenzen en opvolging

Geen gemeten conversie-uplift of zoekverkeer; Search Console-eigendom nog niet bewezen (GSC Wizard-verbinding weigert toegang). Volgende agent kijkt naar daadwerkelijke instroom via GSC en voor gebruikers naar browserervaring en CTA's; geen nieuwe dienst of staging nodig.
