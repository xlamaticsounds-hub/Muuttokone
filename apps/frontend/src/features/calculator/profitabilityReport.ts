import { COST_PRESETS, SCENARIO_DISTANCES, TARGET_MARGIN, analyzeScenario, standardScenarios, summarizeByGroup, type CostModel, type Scenario } from './profitability';

const pct = (value: number) => `${Math.round(value * 100)} %`;
const eur = (value: number) => `${Math.round(value).toLocaleString('fi-FI')} €`;
const wage = (value: number) => `${Math.round(value)}`;

function assumptionsTable(models: CostModel[]): string {
  const rows: [string, (m: CostModel) => string][] = [
    ['Työntekijän kokonaiskustannus €/h', (m) => String(m.moverCostPerHour)],
    ['Työntekijöitä täydessä palvelussa', (m) => String(m.moversInFullService)],
    ['ALV-velvollinen (tuotto = hinta / 1,255)', (m) => (m.vatLiable ? 'kyllä' : 'ei')],
    ['Auton kiinteät kulut €/h', (m) => String(m.vehicleFixedPerHour)],
    ['Auton muuttuvat kulut €/km', (m) => String(m.vehicleCostPerKm)],
    ['Todellinen ajonopeus taajamassa / valtatiellä km/h', (m) => `${m.urbanKmh} / ${m.highwayKmh} (taajama ${m.urbanKm} km)`],
    ['Tyhjä paluumatka (1 = koko matka)', (m) => String(m.returnTripFactor)],
    ['Laskuttamaton lisäaika h / lisäajo km', (m) => `${m.deadheadHours} / ${m.deadheadKm}`],
    ['Admin € / työ', (m) => String(m.adminPerJob)],
    ['Tarvikkeet € / työ (täysi palvelu)', (m) => String(m.suppliesPerJob)],
    ['Markkinointi % tuotosta', (m) => String(m.marketingPercent)],
    ['Maksukulut % hinnasta', (m) => String(m.paymentFeePercent)],
  ];
  return [`| Oletus | ${models.map((m) => m.name).join(' | ')} |`, `|---|${models.map(() => '---').join('|')}|`, ...rows.map(([label, f]) => `| ${label} | ${models.map(f).join(' | ')} |`)].join('\n');
}

function breakEvenTable(scenarios: Scenario[], group: string, model: CostModel, sizes: string[]): string {
  const header = `| Koko | ${SCENARIO_DISTANCES.map((km) => `${km} km`).join(' | ')} |`;
  const sep = `|---|${SCENARIO_DISTANCES.map(() => '---').join('|')}|`;
  const rows = sizes.map((size) => {
    const cells = SCENARIO_DISTANCES.map((km) => {
      const pick = (day: string) => scenarios.find((s) => s.group === group && s.id.includes(`|${size}|${km}|${day}|easy`));
      const normal = pick('normal');
      const discounted = pick('discounted');
      if (!normal || !discounted) return '–';
      return `${wage(analyzeScenario(normal.data, model).breakEvenWage)} / ${wage(analyzeScenario(discounted.data, model).breakEvenWage)}`;
    });
    return `| ${size} | ${cells.join(' | ')} |`;
  });
  return [header, sep, ...rows].join('\n');
}

/** Kannattavuusraportti markdownina (suomeksi). Ajetaan komennolla `pnpm profit-report` → docs/kannattavuus.md. */
export function buildProfitabilityReport(now = new Date()): string {
  const scenarios = standardScenarios();
  const models = [COST_PRESETS.conservative, COST_PRESETS.lean];
  const out: string[] = [];

  out.push('# Kannattavuusanalyysi', '');
  out.push(`_Luotu ${now.toISOString().slice(0, 10)} laskurin nykyisellä hinnoittelulla (\`pricing.ts\`). ${scenarios.length} vakioskenaariota._`, '');
  out.push('> **Luvut ovat kustannusoletuksia, eivät todellisia kuluja.** Päivitä `COST_PRESETS` tiedostossa `profitability.ts` oikeilla luvuilla (palkat, auton kulut, ALV-tila) ja aja `pnpm profit-report` uudelleen. Luotettavin tulos on **break-even-palkka**: se ei riipu palkkaoletuksesta.', '');

  out.push('## Miten tulos luetaan', '');
  out.push('- **Break-even-palkka** = suurin työntekijän tuntikustannus (€/h/henkilö), jolla skenaario on vielä voitollinen. Jos todellinen kustannus on pienempi, jäädään voitolle.');
  out.push(`- **Kate** = voitto / tuotto. Tavoitekate on ${pct(TARGET_MARGIN)}; alle sen skenaario on "ohut".`);
  out.push('- Kustannukset lasketaan **todellisesta työajasta**: varsinainen työ + todellinen ajo + **tyhjä paluumatka** + laskuttamaton lisäaika. Hinnoittelukaavan oma ajoaika-arvio ei vaikuta kustannuksiin.');
  out.push('- Tuotto on ALV-velvolliselle hinta / 1,255, koska hinnan sisältämä ALV tilitetään valtiolle.', '');

  out.push('## Oletukset', '', assumptionsTable(models), '');

  out.push('## Yhteenveto', '');
  for (const model of models) {
    out.push(`### ${model.name} (${model.moverCostPerHour} €/h per työntekijä)`, '');
    out.push('| Palvelu | Skenaarioita | Tappiollisia | Kate < tavoite | Mediaanikate | Pienin break-even €/h |', '|---|---|---|---|---|---|');
    for (const g of summarizeByGroup(scenarios, model)) {
      out.push(`| ${g.group} | ${g.scenarios} | ${g.lossMaking} | ${g.belowTarget} | ${pct(g.medianMargin)} | ${wage(g.minBreakEvenWage)} |`);
    }
    out.push('');
  }

  out.push('## Break-even-palkka €/h (helppo pääsy; normaali päivä / -15 % päivä)', '');
  out.push('_Ei-työkustannukset (auto, admin, markkinointi) konservatiivisella mallilla, eli varovainen arvio._', '');
  const sizes = ['1h', '2h', '3h', '4h+'];
  for (const group of ['Täysi palvelu', 'Kuljettaja + auto', 'Kantoapu']) {
    out.push(`### ${group}`, '', breakEvenTable(scenarios, group, COST_PRESETS.conservative, sizes), '');
  }

  for (const model of models) {
    out.push(`## Heikoimmat skenaariot — ${model.name}`, '');
    out.push('| Skenaario | Hinta | Voitto | Kate | Break-even €/h |', '|---|---|---|---|---|');
    const rows = scenarios.map((s) => ({ s, r: analyzeScenario(s.data, model) })).sort((a, b) => a.r.margin - b.r.margin);
    for (const { s, r } of rows.slice(0, 10)) out.push(`| ${s.label} | ${eur(r.price)} | ${eur(r.profit)} | ${pct(r.margin)} | ${wage(r.breakEvenWage)} |`);
    out.push('');
  }

  out.push('## Huomioita', '');
  out.push('- Päiväalennus (-15 %) ei muuta kustannuksia, joten se syö katteen suoraan; pitkillä matkoilla alennuspäivä on ohuin tilanne.');
  out.push('- Pitkillä matkoilla tyhjä paluumatka on kustannus, jota hinta ei erikseen kata. Kantoavussa (2 henkilöä, ei autoa) sama paluuaika kasvattaa kustannusta ilman auton kuluja.');
  out.push('- Vanhat laskelmat (`pricing_optimization.py`, `business_analytics.py`, `FINANCIAL_DATA.csv`) perustuvat vanhaan hinnoitteluun (120/140 €/h, 0,59 €/km) eivätkä enää vastaa laskuria.', '');
  return out.join('\n');
}
