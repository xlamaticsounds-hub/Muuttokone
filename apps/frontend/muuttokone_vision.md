# Muuttokone.fi – Vision, Backlog & Information Architecture

Tämä dokumentti kokoaa backlogiin siirretyt kehityskohteet, sivuston tietorakenteen (IA) sekä mermaid-kaavion koko sivustosta.

## 1) Backlog (siirretty tasks.md:stä)

### Milestone 3 – Tarjousfunneli (MVP)

- [ ] Sivu: `/pyyda-tarjous`
- [ ] Komponentit: `components/Forms/QuoteForm/{Step1.tsx, Step2.tsx, Progress.tsx, index.tsx}`
- [ ] Step 1: nimi, yhteystieto (puhelin/sähköposti), mistä→minne, kohteen koko, muuttopäivä (valinn.)
- [ ] Step 2: lisäpalvelut (pakkaus, siivous), inventaario (vapaateksti/checkboxit), hissi/etäisyys, lisähuomiot
- [ ] API-reitti: `src/app/api/quote/route.ts` (POST) → tallenna (Sanity/CRM) tai lähetä sähköposti
- [ ] Kiitos-näkymä + CTA:t (videokartoitus/WhatsApp/Soita)
- [ ] GDPR-teksti + linkki tietosuojakäytäntöön

Hyväksymiskriteerit:

- [ ] Step1 → Step2 → submit toimii ja talletus/lähetys onnistuu, virheviestit näkyvät

### Kehitys & ajaminen

- Dev-server PowerShell (Windows):

```powershell
npm install
npm run dev -- --turbo
```

- Rakennus tuotantoon:

```powershell
npm run build
```

### Milestone 4 – Sanity skeemat ja sisällöt

- [ ] Skeemat: `services`, `testimonial` (rating, segment), `priceExample`, `badge`, `location`
- [ ] Päivitä `schemas/index.ts`
- [ ] Utilit `sanity-utils.ts`: getServices/getTestimonials/getLocations/getPriceExamples
- [ ] Palvelusivut hakevat datan Sanitystä (SSR/ISR)

Hyväksymiskriteerit:

- [ ] Palvelusivujen sisältö tulee CMS:stä; revalidate toimii

### Milestone 5 – Hinnoittelu & esimerkit

- [ ] Komponentti: `components/Pricing/PriceExamples.tsx` (kortit, €-haarukka, “sisältyy” lista)
- [ ] Upotus `/kotimuutto` & `/yritysmuutto`
- [ ] CTA “Varaa maksuton kartoitus” jokaisen esimerkin jälkeen

Hyväksymiskriteerit:

- [ ] Hintaesimerkit renderöityvät ja CTA:t toimivat

### Milestone 6 – Luottamuselementit

- [ ] `components/Badges/*` SMPY/ISO-badgets
- [ ] Nostot: Google-arviot (lainaukset/widget), B2B-asiakaslogot yrityssivulle
- [ ] Vakuutus & tietoturva -teksti tarjous- ja yhteyssivuilla

Hyväksymiskriteerit:

- [ ] Badge-komponentti näkyy etusivulla ja footerin yläpuolella; tekstit lisätty

### Milestone 7 – SEO & tekniset

- [ ] `robots.txt`, `sitemap.xml`
- [ ] Strukturoitu data: LocalBusiness, FAQ
- [ ] Laajemmat meta/OG + canonical-politiikka
- [ ] Performance: `next/image` käyttö, lomakkeiden lazy import, kriittiset CSSit OK

Hyväksymiskriteerit:

- [ ] Pages pass basic SEO checks; Lighthouse: hyvä taso (Core Web Vitals OK)

### Milestone 8 – Analytiikka & eventit

- [ ] GA4/Matomo integrointi
- [ ] Eventit: `quote_start`, `quote_submit`, `book_survey_click`, `whatsapp_click`
- [ ] Dashboard/raporttiperusteet

Hyväksymiskriteerit:

- [ ] Eventit näkyvät analytiikassa ja funnel on mitattavissa

### Footer-navin yhtenäistys

- [ ] Päivitä `Footer/footerNavData.tsx` vastaamaan olemassa olevia sivuja (poista placeholderit tai lisää sivut `/pakkaus`, `/varastointi`, `/referenssit`, `/ukk`, `/blogi`, `/ota-yhteytta`)

## 2) Information Architecture (Mermaid)

```mermaid
flowchart TD
  A[Etusivu /] --> B[Palvelut /palvelut]
  A --> C[Yritys /yritys]
  A --> D[Hinnat /hinnat]
  A --> E[Yhteystiedot /yhteystiedot]
  A --> F[Pyydä tarjous /pyyda-tarjous]
  A --> G[Blogi /blog]

  B --> B1[Kotimuutto /kotimuutto]
  B --> B2[Yritysmuutto /yritysmuutto]
  %% Ankkurit /palvelut sivulla (myöhemmin): pakkaus, varastointi, siivous, pianot

  E --> E1[Kontaktitiedot + lomake]
  E --> E2[FAQ /usein-kysytyt-kysymykset]

  G --> G1[Artikkelit /blog/[slug]]
```

## 3) Tekniset periaatteet

- Konfiguraatio keskitetty: `src/config/site.ts` (puhelin, email, aukioloajat, some)
- Integraatiot kunnioittavat `integrations.config.tsx`
- UI-teksti suomeksi, Tailwind v4 teema, `next/image` käytössä
- Sticky navbar + hero-asettelun parannukset päällä

## 4) Sprint-ehdotus (päivitetty)

- Sprint 2: Milestones 3–5 (tarjousfunneli + hintaesimerkit)
- Sprint 3: Milestones 6–8 (luottamuselementit, SEO & tekniset, analytiikka)
