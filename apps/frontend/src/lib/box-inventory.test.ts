import { describe, expect, it } from 'vitest';
import {
  availabilityByDay,
  checkOverbooking,
  extractBoxRentalRequest,
  lostOnReturn,
  overbookingMessage,
  rentalCommitment,
  summarizeInventory,
  type InventoryRental,
} from './box-inventory';

const TODAY = '2026-11-10';

const rental = (over: Partial<InventoryRental>): InventoryRental => ({
  id: over.id ?? 'r1',
  leadId: 'l1',
  customer: 'Asiakas',
  quantity: 20,
  deliveryKey: '2026-11-12',
  pickupKey: '2026-11-20',
  datesEstimated: false,
  status: 'RESERVED',
  commitment: 'confirmed',
  returnedQty: null,
  lostQty: 0,
  notes: null,
  ...over,
});

describe('extractBoxRentalRequest', () => {
  it('Muuttolaatikot-sivun tilaus: toimituspäivä ja noutoarvio lomakkeelta', () => {
    const formData = {
      kind: 'api-lead',
      payload: {
        service_type: 'vuokraus',
        moving_date: '2026-11-14',
        box_count: 50,
        rental: { items: [{ id: 'muuttolaatikot', qty: 50, days: 14 }], pickupEstimate: '2026-11-28' },
      },
    };
    expect(extractBoxRentalRequest(formData, null)).toEqual({
      quantity: 50,
      deliveryKey: '2026-11-14',
      pickupKey: '2026-11-28',
      source: 'vuokraus',
    });
  });

  it('vuokraustilaus ilman laatikoita ei ole laatikkovuokraus', () => {
    const formData = { kind: 'api-lead', payload: { service_type: 'vuokraus', moving_date: '2026-11-14', rental: { items: [{ id: 'muu', qty: 1, days: 2 }] } } };
    expect(extractBoxRentalRequest(formData, null)).toBeNull();
  });

  it('laskurin laatikkovuokra: toimitus viikko ennen muuttoa, nouto vuokrapäivien päästä', () => {
    const formData = { serviceType: 'moving', needsBoxRental: true, boxRentalCount: 40, boxRentalDays: 14 };
    expect(extractBoxRentalRequest(formData, new Date('2026-11-20T00:00:00Z'))).toEqual({
      quantity: 40,
      deliveryKey: '2026-11-13',
      pickupKey: '2026-11-27',
      source: 'muutto',
    });
  });

  it('lyhyt vuokra: toimitus enintään puolet vuokra-ajasta ennen muuttoa', () => {
    const formData = { needsBoxRental: true, boxRentalCount: 25, boxRentalDays: 6 };
    expect(extractBoxRentalRequest(formData, new Date('2026-11-20T00:00:00Z'))).toMatchObject({ deliveryKey: '2026-11-17', pickupKey: '2026-11-23' });
  });

  it('ei laatikkovuokraa tai ei muuttopäivää → null', () => {
    expect(extractBoxRentalRequest({ serviceType: 'moving', needsBoxRental: false, boxRentalCount: 40 }, new Date())).toBeNull();
    expect(extractBoxRentalRequest({ needsBoxRental: true, boxRentalCount: 40 }, null)).toBeNull();
    expect(extractBoxRentalRequest({ serviceType: 'transport', needsBoxRental: true, boxRentalCount: 40 }, new Date())).toBeNull();
  });
});

describe('rentalCommitment', () => {
  it('kalenterissa olevat ovat vahvistettuja, uudet ja tarjotut alustavia', () => {
    expect(rentalCommitment('SCHEDULED')).toBe('confirmed');
    expect(rentalCommitment('WON')).toBe('confirmed');
    expect(rentalCommitment('PAID')).toBe('confirmed');
    expect(rentalCommitment('NEW')).toBe('tentative');
    expect(rentalCommitment('PROPOSAL_SENT')).toBe('tentative');
    expect(rentalCommitment('LOST')).toBe('inactive');
    expect(rentalCommitment('CANCELLED')).toBe('inactive');
  });
});

describe('summarizeInventory', () => {
  const rentals = [
    rental({ id: 'out', status: 'DELIVERED', quantity: 30, deliveryKey: '2026-11-01', pickupKey: '2026-11-15' }),
    rental({ id: 'late', status: 'DELIVERED', quantity: 10, deliveryKey: '2026-10-20', pickupKey: '2026-11-05' }),
    rental({ id: 'far', status: 'DELIVERED', quantity: 5, deliveryKey: '2026-11-05', pickupKey: '2026-12-01' }),
    rental({ id: 'next', quantity: 20, deliveryKey: '2026-11-12', pickupKey: '2026-11-20' }),
    rental({ id: 'maybe', quantity: 25, commitment: 'tentative' }),
    rental({ id: 'lost-lead', quantity: 50, commitment: 'inactive' }),
    rental({ id: 'done', status: 'RETURNED', quantity: 40, deliveryKey: '2026-10-01', pickupKey: '2026-10-15' }),
  ];
  const s = summarizeInventory(88, rentals, TODAY);

  it('varastossa = kaikki − toimitetut', () => {
    expect(s.out).toBe(45);
    expect(s.inStock).toBe(43);
  });
  it('palaamassa 7 päivän sisällä sisältää myöhässä olevat', () => {
    expect(s.returningSoon).toBe(40);
    expect(s.overduePickups.map((r) => r.id)).toEqual(['late']);
  });
  it('vahvistetut ja alustavat erikseen, hävityt eivät näy', () => {
    expect(s.reserved).toBe(20);
    expect(s.tentative).toBe(25);
    expect(s.upcoming.map((r) => r.id)).toEqual(['next']);
  });
  it('pienin vapaa määrä 30 päivän aikana', () => {
    // 12.–15.11. ovat ruuhkaisimmat: 30 + 5 + 20 (myöhässä oleva varaa laatikot vain tähän päivään asti)
    expect(s.minFreeNext30).toBe(88 - (30 + 5 + 20));
  });
});

describe('availabilityByDay', () => {
  it('myöhässä oleva nouto varaa laatikot vain tähän päivään asti', () => {
    const late = rental({ id: 'late', status: 'DELIVERED', quantity: 10, deliveryKey: '2026-10-20', pickupKey: '2026-11-05' });
    const days = availabilityByDay(88, [late], TODAY, 2, TODAY);
    expect(days.map((d) => d.free)).toEqual([78, 88]);
  });
  it('alustavat näytetään erikseen eivätkä vähennä vapaita', () => {
    const days = availabilityByDay(88, [rental({ commitment: 'tentative', quantity: 25 })], '2026-11-12', 1, TODAY);
    expect(days[0]).toEqual({ key: '2026-11-12', booked: 0, tentative: 25, free: 88 });
  });
});

describe('checkOverbooking', () => {
  const others = [rental({ id: 'a', quantity: 60, deliveryKey: '2026-11-12', pickupKey: '2026-11-20' })];
  it('varoittaa kun päällekkäiset vahvistetut ylittävät varaston', () => {
    const check = checkOverbooking(88, others, { quantity: 40, deliveryKey: '2026-11-18', pickupKey: '2026-11-25' }, TODAY);
    expect(check).toEqual({ freeAtPeak: 28, shortBy: 12 });
    expect(overbookingMessage(check, 40)).toContain('puuttuu 12');
  });
  it('ei varoitusta, kun vuokra-ajat eivät mene päällekkäin', () => {
    const check = checkOverbooking(88, others, { quantity: 40, deliveryKey: '2026-11-21', pickupKey: '2026-11-30' }, TODAY);
    expect(check.shortBy).toBe(0);
    expect(overbookingMessage(check, 40)).toBeNull();
  });
  it('oma rivi ei kilpaile itsensä kanssa', () => {
    const check = checkOverbooking(88, others, { id: 'a', quantity: 60, deliveryKey: '2026-11-12', pickupKey: '2026-11-20' }, TODAY);
    expect(check.shortBy).toBe(0);
  });
});

describe('lostOnReturn', () => {
  it('puuttuvat laatikot', () => {
    expect(lostOnReturn(50, 47)).toBe(3);
    expect(lostOnReturn(50, 50)).toBe(0);
    expect(lostOnReturn(50, 55)).toBe(0);
  });
});
