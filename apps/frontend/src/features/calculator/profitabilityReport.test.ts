import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildProfitabilityReport } from './profitabilityReport';

describe('buildProfitabilityReport', () => {
  const report = buildProfitabilityReport(new Date('2026-10-20T12:00:00Z'));

  it('sisältää pääosiot ja päivämäärän', () => {
    for (const heading of ['# Kannattavuusanalyysi', '## Oletukset', '## Yhteenveto', '## Break-even-palkka', '## Heikoimmat skenaariot — Konservatiivinen', '## Heikoimmat skenaariot — Kevyt']) {
      expect(report).toContain(heading);
    }
    expect(report).toContain('Luotu 2026-10-20');
  });

  it('kattaa kaikki palvelut eikä sisällä virheellisiä lukuja', () => {
    for (const group of ['Täysi palvelu', 'Kuljettaja + auto', 'Kantoapu', 'Kuljetus']) expect(report).toContain(`| ${group} |`);
    expect(report).not.toMatch(/NaN|Infinity|undefined/);
  });

  // Tiedoston kirjoitus vain pyydettäessä: `pnpm profit-report` (PROFIT_REPORT=1)
  it.skipIf(process.env.PROFIT_REPORT !== '1')('kirjoittaa docs/kannattavuus.md', () => {
    const target = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../docs/kannattavuus.md');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buildProfitabilityReport(), 'utf8');
    expect(fs.existsSync(target)).toBe(true);
  });
});
