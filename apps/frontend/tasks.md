# Muuttokone.fi – tehtävälista ja toimintasuunnitelma

Tämä tiedosto kokoaa konkreettiset tehtävät ja etenemissuunnitelman guide.md:n pohjalta. Käytetään tätä sprinttisuunnitteluun ja seurantaan.

## Milestone 0 – Nykytilan stabilointi (valmis/osin tehty)

- [x] Etusivun metadata FI (title/desc)
- [x] Contact-sektio korjattu ja suomennettu (Contact/index.tsx, contactData, formData, validoinnit)
- [x] Testimonials-osion korjaus ja suomennos
- [x] Footerin kuvaus ja valikkoryhmät suomeksi, uutiskirjeen tekstit suomeksi
- [x] Etusivulla `Contact`-import korjattu
- [x] QuickQuote upotettuna etusivulle

Hyväksymiskriteerit:
- [x] Build/compile virheettömästi
- [x] Kaikki edellä mainitut komponentit suomeksi ja näkyvät oikein

## Milestone 1 – Navigaatio ja CTA:t

- [x] Headeriin pää-CTA:t (oikea laita):
  - [x] Linkki: "/pyyda-tarjous" – “Pyydä tarjous” (primary)
  - [x] Linkki: tel:+358… – “Soita” (outline)
- [x] Päivitä `menuData.tsx` FI-reiteillä (alias-URLit tarvittaessa)

Hyväksymiskriteerit:
- [x] Headerissa näkyy kaksi CTA:ta desktopissa ja mobiilimenu tukee samoja reittejä

## Milestone 2 – Reitit ja sivut (FI-URLit)

- [x] Luo sivut:
  - [x] `/kotimuutto` – luotu (sisältö alustava, CTA:t lisätty)
  - [x] `/yritysmuutto` – luotu (sisältö alustava, CTA:t lisätty)
  - [x] `/palvelut` – luotu (jakosivu; ankkurit voidaan lisätä myöhemmin)
  - [x] `/yritys` – luotu (korvaa vaatimuksen `/meista`)
  - [x] `/yhteystiedot` – luotu
  - [x] `/ukk` – luotu (alias: `/usein-kysytyt-kysymykset` → redirect)
  - [x] `/blog` – käytössä (alias: `/blogi` → redirect)
- [x] Päivitetty `Header/menuData.tsx` osoittamaan FI-sivuille
- [x] Footerin linkit päivitetty vastaamaan olemassa olevia sivuja (poistettu placeholderit)

Huomio:
- Dynaaminen reitti `/toimialueet/[city]` on poistettu laajuudesta (descoped pyynnöstä).
 - Legacy EN-reitit ohjataan FI-reiteille (`/services*` → FI vastineet, `/contact` → `/yhteystiedot`).

Hyväksymiskriteerit:
- [x] Reitit renderöityvät ja linkittyvät headerissa; 404 ei esiinny perusnavigaatiossa

## Milestone 3 – Tarjousfunneli (MVP)

Muutettu backlogiin (siirretty tiedostoon `muuttokone_vision.md`).

## Milestone 4 – Sanity skeemat ja sisällöt

Siirretty backlogiin (katso `muuttokone_vision.md`).

## Milestone 5 – Hinnoittelu & esimerkit

Siirretty backlogiin (katso `muuttokone_vision.md`).

## Milestone 6 – Luottamuselementit

Siirretty backlogiin (katso `muuttokone_vision.md`).

## Milestone 7 – SEO & tekniset

Siirretty backlogiin (katso `muuttokone_vision.md`).

## Milestone 8 – Analytiikka & eventit

Siirretty backlogiin (katso `muuttokone_vision.md`).

## Työnjako ja käytännöt

- Tech-rajaukset: kun integraatioita käytetään, kunnioita `integrations.config.tsx`
- Tyylit: Tailwind v4, käytä olemassa olevia teema-arvoja (bg-primary, text-primary…)
- Kieli: kaikki UI-teksti suomeksi, numerot/osoitteet FI-muodossa
- Laatuportit ennen PR:ää: build, lint/typecheck, pieni smoke test

## Muut tiedot

- Kehitys: käynnistä dev-palvelin PowerShellissä:

```powershell
npm install
npm run dev -- --turbo
```

- Tärkeät dokumentit: `guide.md`, `tasks.md`, `muuttokone_vision.md`, `README.md`

## Ehdotettu eteneminen (päivitetty)

- Sprint 1 (valmis): Milestones 0–2 ydin (navigaatio + perussivut)
- Sprint 2 (ajantasainen backlog): katso `muuttokone_vision.md` (Milestones 3–8)

Lisähuomio (tekniset parannukset):
- [x] Yhtenäinen konfiguraatio: `src/config/site.ts` (puhelin, email, aukioloajat, some)
- [x] Sticky navbar valkoinen tausta + vahvempi kontrasti kaikilla sivuilla
- [x] Hero-sektion kuvien ja tekstin asettelun korjaukset
