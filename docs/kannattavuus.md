# Kannattavuusanalyysi

_Luotu 2026-10-19 laskurin nykyisellä hinnoittelulla (`pricing.ts`). 304 vakioskenaariota._

> **Luvut ovat kustannusoletuksia, eivät todellisia kuluja.** Päivitä `COST_PRESETS` tiedostossa `profitability.ts` oikeilla luvuilla (palkat, auton kulut, ALV-tila) ja aja `pnpm profit-report` uudelleen. Luotettavin tulos on **break-even-palkka**: se ei riipu palkkaoletuksesta.

## Miten tulos luetaan

- **Break-even-palkka** = suurin työntekijän tuntikustannus (€/h/henkilö), jolla skenaario on vielä voitollinen. Jos todellinen kustannus on pienempi, jäädään voitolle.
- **Kate** = voitto / tuotto. Tavoitekate on 15 %; alle sen skenaario on "ohut".
- Kustannukset lasketaan **todellisesta työajasta**: varsinainen työ + todellinen ajo + **tyhjä paluumatka** + laskuttamaton lisäaika. Hinnoittelukaavan oma ajoaika-arvio ei vaikuta kustannuksiin.
- Tuotto on ALV-velvolliselle hinta / 1,255, koska hinnan sisältämä ALV tilitetään valtiolle.

## Oletukset

| Oletus | Konservatiivinen | Kevyt |
|---|---|---|
| Työntekijän kokonaiskustannus €/h | 30 | 22 |
| Työntekijöitä täydessä palvelussa | 2 | 2 |
| ALV-velvollinen (tuotto = hinta / 1,255) | kyllä | kyllä |
| Auton kiinteät kulut €/h | 12 | 7 |
| Auton muuttuvat kulut €/km | 0.3 | 0.25 |
| Todellinen ajonopeus taajamassa / valtatiellä km/h | 35 / 85 (taajama 15 km) | 35 / 85 (taajama 15 km) |
| Tyhjä paluumatka (1 = koko matka) | 1 | 1 |
| Laskuttamaton lisäaika h / lisäajo km | 0.25 / 10 | 0.25 / 10 |
| Admin € / työ | 15 | 8 |
| Tarvikkeet € / työ (täysi palvelu) | 8 | 5 |
| Markkinointi % tuotosta | 8 | 4 |
| Maksukulut % hinnasta | 1.5 | 1 |

## Yhteenveto

### Konservatiivinen (30 €/h per työntekijä)

| Palvelu | Skenaarioita | Tappiollisia | Kate < tavoite | Mediaanikate | Pienin break-even €/h |
|---|---|---|---|---|---|
| Täysi palvelu | 96 | 41 | 72 | 4 % | 15 |
| Kuljettaja + auto | 96 | 37 | 80 | 4 % | 16 |
| Kantoapu | 96 | 95 | 96 | -24 % | 17 |
| Kuljetus | 16 | 14 | 16 | -16 % | 13 |

### Kevyt (22 €/h per työntekijä)

| Palvelu | Skenaarioita | Tappiollisia | Kate < tavoite | Mediaanikate | Pienin break-even €/h |
|---|---|---|---|---|---|
| Täysi palvelu | 96 | 1 | 10 | 33 % | 22 |
| Kuljettaja + auto | 96 | 0 | 4 | 34 % | 28 |
| Kantoapu | 96 | 19 | 60 | 12 % | 18 |
| Kuljetus | 16 | 1 | 6 | 19 % | 20 |

## Break-even-palkka €/h (helppo pääsy; normaali päivä / -15 % päivä)

_Ei-työkustannukset (auto, admin, markkinointi) konservatiivisella mallilla, eli varovainen arvio._

### Täysi palvelu

| Koko | 5 km | 19 km | 40 km | 100 km | 180 km | 300 km |
|---|---|---|---|---|---|---|
| 1h | 27 / 21 | 25 / 20 | 28 / 22 | 25 / 19 | 23 / 17 | 21 / 15 |
| 2h | 32 / 26 | 30 / 24 | 31 / 25 | 28 / 21 | 25 / 19 | 23 / 17 |
| 3h | 49 / 40 | 40 / 33 | 33 / 26 | 30 / 23 | 27 / 21 | 25 / 19 |
| 4h+ | 48 / 40 | 45 / 37 | 46 / 38 | 42 / 34 | 39 / 31 | 36 / 29 |

### Kuljettaja + auto

| Koko | 5 km | 19 km | 40 km | 100 km | 180 km | 300 km |
|---|---|---|---|---|---|---|
| 1h | 55 / 43 | 31 / 23 | 35 / 26 | 30 / 21 | 27 / 18 | 25 / 16 |
| 2h | 40 / 31 | 37 / 28 | 39 / 30 | 34 / 25 | 31 / 22 | 28 / 19 |
| 3h | 43 / 34 | 40 / 31 | 42 / 32 | 37 / 28 | 33 / 24 | 30 / 21 |
| 4h+ | 45 / 36 | 42 / 33 | 43 / 34 | 39 / 29 | 35 / 26 | 31 / 22 |

### Kantoapu

| Koko | 5 km | 19 km | 40 km | 100 km | 180 km | 300 km |
|---|---|---|---|---|---|---|
| 1h | 34 / 29 | 23 / 19 | 25 / 21 | 22 / 19 | 21 / 17 | 20 / 17 |
| 2h | 28 / 23 | 26 / 22 | 27 / 22 | 24 / 20 | 22 / 19 | 21 / 18 |
| 3h | 29 / 24 | 27 / 23 | 28 / 23 | 25 / 21 | 24 / 20 | 22 / 19 |
| 4h+ | 30 / 25 | 28 / 24 | 28 / 24 | 26 / 22 | 24 / 21 | 23 / 19 |

## Heikoimmat skenaariot — Konservatiivinen

| Skenaario | Hinta | Voitto | Kate | Break-even €/h |
|---|---|---|---|---|
| Kantoapu · 1h · 300 km · -15 % päivä · hissi | 439 € | −243 € | -69 % | 17 |
| Kantoapu · 1h · 300 km · -15 % päivä · ei hissiä, 4. krs | 458 € | −245 € | -67 % | 17 |
| Kantoapu · 2h · 300 km · -15 % päivä · hissi | 516 € | −248 € | -60 % | 18 |
| Kantoapu · 1h · 180 km · -15 % päivä · hissi | 325 € | −156 € | -60 % | 17 |
| Kantoapu · 2h · 300 km · -15 % päivä · ei hissiä, 4. krs | 535 € | −250 € | -59 % | 18 |
| Kantoapu · 1h · 180 km · -15 % päivä · ei hissiä, 4. krs | 344 € | −157 € | -57 % | 18 |
| Kantoapu · 3h · 300 km · -15 % päivä · hissi | 592 € | −254 € | -54 % | 19 |
| Kantoapu · 3h · 300 km · -15 % päivä · ei hissiä, 4. krs | 630 € | −256 € | -51 % | 19 |
| Kantoapu · 2h · 180 km · -15 % päivä · hissi | 401 € | −161 € | -50 % | 19 |
| Kantoapu · 4h+ · 300 km · -15 % päivä · hissi | 650 € | −257 € | -50 % | 19 |

## Heikoimmat skenaariot — Kevyt

| Skenaario | Hinta | Voitto | Kate | Break-even €/h |
|---|---|---|---|---|
| Kantoapu · 1h · 300 km · -15 % päivä · hissi | 439 € | −75 € | -21 % | 18 |
| Kantoapu · 1h · 300 km · -15 % päivä · ei hissiä, 4. krs | 458 € | −72 € | -20 % | 18 |
| Kantoapu · 2h · 300 km · -15 % päivä · hissi | 516 € | −61 € | -15 % | 19 |
| Kantoapu · 1h · 180 km · -15 % päivä · hissi | 325 € | −37 € | -14 % | 19 |
| Kantoapu · 2h · 300 km · -15 % päivä · ei hissiä, 4. krs | 535 € | −58 € | -14 % | 19 |
| Kantoapu · 1h · 180 km · -15 % päivä · ei hissiä, 4. krs | 344 € | −34 € | -12 % | 19 |
| Kantoapu · 3h · 300 km · -15 % päivä · hissi | 592 € | −48 € | -10 % | 20 |
| Kantoapu · 3h · 300 km · -15 % päivä · ei hissiä, 4. krs | 630 € | −41 € | -8 % | 20 |
| Kantoapu · 2h · 180 km · -15 % päivä · hissi | 401 € | −24 € | -7 % | 20 |
| Kantoapu · 4h+ · 300 km · -15 % päivä · hissi | 650 € | −37 € | -7 % | 20 |

## Huomioita

- Päiväalennus (-15 %) ei muuta kustannuksia, joten se syö katteen suoraan; pitkillä matkoilla alennuspäivä on ohuin tilanne.
- Pitkillä matkoilla tyhjä paluumatka on kustannus, jota hinta ei erikseen kata. Kantoavussa (2 henkilöä, ei autoa) sama paluuaika kasvattaa kustannusta ilman auton kuluja.
- Mallin työaika-arviota voi verrata toteutuneeseen: hallinnan **Työajat**-osio tallentaa leimatut työajat ja henkilötunnit, ja liidin sivu näyttää keikan hinnan jaettuna henkilötunneilla (€ / henkilötunti, ennen kuluja). Jos toteutunut työaika poikkeaa mallin arviosta jatkuvasti, säädä `pricing.ts`:n työaika-arvioita.
- Vanhat laskelmat (`pricing_optimization.py`, `business_analytics.py`, `FINANCIAL_DATA.csv`) perustuvat vanhaan hinnoitteluun (120/140 €/h, 0,59 €/km) eivätkä enää vastaa laskuria.
