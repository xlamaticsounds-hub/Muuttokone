import { describe, expect, it } from 'vitest';
import { describeLastRun } from './mail-status';

const now = new Date('2026-10-20T09:30:00Z'); // 12.30 Suomen aikaa

describe('describeLastRun', () => {
  it('tuore lukukerta ei ole vanhentunut', () => {
    expect(describeLastRun('2026-10-20T09:20:00Z', now)).toEqual({ label: 'tänään 12.20', stale: false });
  });
  it('yli 45 min vanha merkitään vanhentuneeksi', () => {
    expect(describeLastRun('2026-10-20T08:00:00Z', now)).toEqual({ label: 'tänään 11.00', stale: true });
  });
  it('eilen ja aiemmin', () => {
    expect(describeLastRun('2026-10-19T15:05:00Z', now).label).toBe('eilen 18.05');
    expect(describeLastRun('2026-10-14T06:00:00Z', now).label).toBe('14.10. 09.00');
  });
  it('ei koskaan luettu', () => {
    expect(describeLastRun(null, now)).toEqual({ label: 'ei vielä luettu', stale: true });
  });
});
