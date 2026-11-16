# HYXI AURA — P1 Mailincidenten duidelijk zichtbaar voor beheerders

**Datum:** 16 november 2026 · **Issue:** #9 (Operations) · **Repository:** `Michaelwmdegroot/hyxi-aura-nl` · **Featurebranch:** `feature/p1-mail-incident-triage`  
**Codebasis:** `main a2ef7c32e2e9cc04d3b48d39d1b07657e5311927` · visuele homepage V6 **niet wijzigen**.  
**Status:** ontwerp vastgelegd vóór implementatie.

## Waarom deze kleine sprint

HYXI ontvangt leads in de versleutelde MariaDB, gebruikt de bestaande SMTP-outbox en laat de bestaande Odoo-mailimport CRM-verkoopkansen maken. De mailwerkbank `/beheer` bevat al `Mailcontrole` en beschermde knoppen voor `failed` of `uncertain`, plus een dashboardtelling. **Nieuw bouwen van een outbox, Odoo-API, CRM, mailworker of database is onnodig en risicovol.**

Nog open: een beheerder kan in het dagelijkse werkoverzicht een mislukte/onzekere teamnotificatie missen. Een opgeslagen lead mag niet onopgevolgd blijven doordat een notificatieprobleem onduidelijk zichtbaar is. Deze sprint biedt daarom **een prominente admin-only signalering bij het inloggen/vernieuwen**, inclusief rechtstreeks navigeren naar de bestaande, al geauditeerde mailcontrole.

## Voorgestelde wijziging

1. **Alert alleen voor geauthenticeerde admins met incidenten.** De al bestaande `GET /api/beheer/summary` heeft `notifications.failed` en `notifications.uncertain`. Als hun som groter dan 0 is, toon boven de werkbanktabbladen een rustig maar duidelijk incidentpaneel met het **aantal open meldingen**, de aantallen `Mislukt` en `Aflevering onzeker` en één knop `Open mailcontrole`. Als er geen incident is, toon niets. Bij salesrollen of uitloggen: incidentpaneel en de admin-only mailmetriek verborgen.
2. **Bestaande handeling hergebruiken.** De knop opent de al aanwezige tab `Mailcontrole` en verplaatst focus naar de kop. Er komen geen nieuwe mailacties, auto-retries of externe links. De bestaande status-/attempt-vergelijking, mailbox-bevestigingsvraag en admin-audit blijven ongewijzigd.
3. **Mini-runbook in de Mailcontrole-tab:** controleer eerst `leads@thuisbatterijteam.nl` op het aanvraagnummer; controleer zo nodig de huidige Odoo-verkoopkans; **bij `uncertain` niet blind opnieuw verzenden** (duplicaten mogelijk); daarna expliciet kiezen tussen `Ontvangst bevestigd` of gecontroleerde heraanbieding. `accepted` is alleen SMTP-acceptatie, geen bewijs van inboxontvangst.
4. **Weerbare refresh:** als de mailoverzicht-API tijdelijk faalt maar `summary` wél antwoordt, moet het zichtbare incidentpaneel alsnog bijgewerkt worden en mag een tekortschietende pagina-fetch het incident niet stilzwijgend verbergen. Behoud de bestaande sessie-/CSRF- en late-responsebescherming.

## Wat dit nadrukkelijk niet is

- **Geen automatische externe push of alarmmail.** Deze melding is alleen zichtbaar als een bevoegde beheerder daadwerkelijk `/beheer` opent of vernieuwt. Een toekomstig proactief alert vereist een betrouwbare eigenaar/fallback-contactmethode en een beveiligde scheduler; die gegevens zijn nog niet vastgesteld.
- **Geen bewijs van Odoo-invoer, mailboxontvangst of salescontact.** De telling betreft uitsluitend database-outboxstatussen.
- **Geen publiek dashboard of PII.** Geen aanvraagnummer, contactgegevens, errorcode, log-/body-/SMTP-secrets in het incidentpaneel. Detailinzage blijft in de bestaande admin-only mailcontroletab.
- Geen wijziging aan database/schema, `server/`, encryptie, SMTP-transport, Odoo-compatibiliteit, retentie, marketingevents, cookies, betaalde diensten of productie-Hostingerconfiguratie.

## Technische scope en tests

- `admin/beheer.html`: alert + knop en beknopte, juiste instructies in de bestaande tab.
- `admin/beheer.mjs`: pure UI-weergave op bestaande summary, admin-gating, nette focus bij tabnavigatie, fouttolerante refresh zonder verlies van incidentcijfers.
- `admin/beheer.css`: mobiele en toegankelijke eenvoudige opmaak zonder misleidende rood/knipperend alarmgevoel.
- `tests/beheer-browser.mjs`: mock-incidents 1 en 0, admin en salesrechten, klik/focus, mobiel 390, WCAG A/AA, geen ongewenste mailmutatie, fout in mailoverzicht zonder stilvallen van summary; logout reinigt alles.
- Bestaande CI: Node24 Hostinger-only build, API, Beheer-/MySQL8 integraal, volledige website/SEO/GSAP/V6 visuals en Lighthouse **3/3 groen vóór merge**. Publieke read-only monitor **12/12 groen** na merge; deze publieke monitor bewijst niet de interne mailalert (die vereist inloggen).
- Documenteer PR-run, eventuele fixes en echte gates in dit bestand en issue #9; geef de bestaande owner/fallback-afspraak en Odoo-controle expliciet als nog open terug.

## Uitrol- en fail-safecriteria

Geen productie-testleads, bulkmail, auto-retention, automatische statusmutaties of Odoo-schrijfoperaties. Rollback via revert van geïsoleerde feature-PR. Als de bestaande flow afwijkend blijkt, hoogstens een interne UI-read-only verandering behouden, niet de operationele SMTP-worker aanraken.

**Open vóór volledige commerciële launch:** owner & vervanger, duidelijke follow-up-SLA, Odoo-quote recordcontrole, inboxdeliverability (SPF/DKIM/DMARC/bounces), privacykopieën en echte visuele 9/10-eigenaarsscore.

## Uitvoering en gecontroleerd PR-head-bewijs — 16 november 2026

**[PR #43](https://github.com/Michaelwmdegroot/hyxi-aura-nl/pull/43)** bouwt de signalering als een kleine toevoeging aan de al bestaande login, summary en Mailcontrole. Geen nieuwe endpoint of SQL en geen nieuwe mailtransportactie. Beheeradmin krijgt boven de tabs een melding met aantallen `failed` en `uncertain`, de route `Open mailcontrole` en een directe focusverplaatsing naar de bestaande kop. De bestaande, geauditeerde afhandeling met expliciete mailboxbevestiging blijft ongewijzigd.

**[PR-head CI 43954892389](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43954892389): 3/3 succesvol.** Getest in een geïsoleerde omgeving zonder productieaccounts/leads:
- Beheerdashboard desktop 1440 en mobiel 390: een onderbouwde incidentmelding bij 1 `uncertain`, knopnavigatie + focus, bij nul incidenten verdwijnt de melding, logout verwijdert staat en sales ziet geen admin-only mailmetriek of incidentmelding.
- Gesimuleerde fout van alleen `GET /api/beheer/outbox`: de geslaagde `GET /summary` toont de melding **toch**, met afzonderlijke foutstatus over de mailcontrole; geen SMTP-heraanbieding door refresh.
- Bestaande beveiliging (auth/RBAC/CSRF, concurrency/sent-attempt, GDPR export/delete), geïsoleerde MySQL8, configurator, beide offerte-/adviesjourneys, Three.js/SVG, bron-SEO en twee Lighthouse-profielen blijven intact.
- Handmatige screenshotreview `beheer-desktop-dashboard.png` en `beheer-mobile-dashboard.png`: melding past in bestaande werkbank en veroorzaakt geen horizontale overflow. [Browserartifact uit CI](https://github.com/Michaelwmdegroot/hyxi-aura-nl/actions/runs/43954892389).
- Synthetische Lighthouse op de **publieke homepage** desktop én mobiel 100/100/100/100 (geen bewijs voor interne Beheerprestatie of echte velddatameting).

**Releasevoorwaarde:** PR-head en na de merge `main` CI 3/3 groen; publieke GET-ready 12/12. Die externe monitor **meet de interne mailincidenten niet**; dit is bewust een sessiebeveiligde Beheerfunctie. Volledige automatisering vereist nog een gekozen verantwoordelijke en veilig proactief kanaal.
