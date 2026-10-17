import { describe, expect, it } from 'vitest';
import { amountsMatch, canAutoTransition, canSuggestTransition, htmlToText, isAutomatedSender, isUkkoSender, namesMatch, parseUkkoPayment, pickLeadForEmail } from './mail-rules';

describe('canAutoTransition', () => {
  it('sallii eteenpäin menevät siirtymät', () => {
    expect(canAutoTransition('NEW', 'PROPOSAL_SENT')).toBe(true);
    expect(canAutoTransition('PROPOSAL_SENT', 'WON')).toBe(true);
    expect(canAutoTransition('PROPOSAL_SENT', 'LOST')).toBe(true);
    expect(canAutoTransition('COMPLETED', 'PAID')).toBe(true);
    expect(canAutoTransition('INVOICED', 'PAID')).toBe(true);
  });
  it('ei vie taaksepäin, ei peru eikä merkitse Tehdyksi', () => {
    expect(canAutoTransition('WON', 'PROPOSAL_SENT')).toBe(false);
    expect(canAutoTransition('WON', 'CANCELLED')).toBe(false);
    expect(canAutoTransition('WON', 'COMPLETED')).toBe(false);
    expect(canAutoTransition('WON', 'PAID')).toBe(false); // ensin Tehty + lopullinen hinta
    expect(canAutoTransition('LOST', 'WON')).toBe(false);
    expect(canAutoTransition('PAID', 'INVOICED')).toBe(false);
    expect(canAutoTransition('ARCHIVED', 'WON')).toBe(false);
  });
});

describe('canSuggestTransition', () => {
  it('ehdottaa eteenpäin ja perumista', () => {
    expect(canSuggestTransition('PROPOSAL_SENT', 'WON')).toBe(true);
    expect(canSuggestTransition('WON', 'CANCELLED')).toBe(true);
    expect(canSuggestTransition('PROPOSAL_SENT', 'CANCELLED')).toBe(true);
  });
  it('ei ehdota taaksepäin eikä elvytystä', () => {
    expect(canSuggestTransition('WON', 'PROPOSAL_SENT')).toBe(false);
    expect(canSuggestTransition('LOST', 'WON')).toBe(false);
    expect(canSuggestTransition('COMPLETED', 'CANCELLED')).toBe(false);
    expect(canSuggestTransition('PAID', 'WON')).toBe(false);
  });
});

describe('pickLeadForEmail', () => {
  const d = (s: string) => new Date(s);
  it('suosii uusinta avointa liidiä', () => {
    const picked = pickLeadForEmail([
      { id: 'vanha-valmis', status: 'COMPLETED' as const, createdAt: d('2026-01-01') },
      { id: 'avoin', status: 'PROPOSAL_SENT' as const, createdAt: d('2026-05-01') },
      { id: 'uusin-havitty', status: 'LOST' as const, createdAt: d('2026-09-01') },
    ]);
    expect(picked?.id).toBe('avoin');
  });
  it('palauttaa null kun liidejä ei ole', () => {
    expect(pickLeadForEmail([])).toBeNull();
  });
});

describe('ukko ja nimet', () => {
  it('tunnistaa ukko.fi-lähettäjän', () => {
    expect(isUkkoSender('ilmoitus@ukko.fi')).toBe(true);
    expect(isUkkoSender('x@mail.ukko.fi')).toBe(true);
    expect(isUkkoSender('x@notukko.fi')).toBe(false);
    expect(isUkkoSender(null)).toBe(false);
  });
  it('vertaa nimiä järjestyksestä ja ääkkösistä riippumatta', () => {
    expect(namesMatch('Matti Meikäläinen', 'meikalainen matti')).toBe(true);
    expect(namesMatch('Matti Meikäläinen', 'Matti Meikäläinen Oy')).toBe(true);
    expect(namesMatch('Matti Meikäläinen', 'Maija Meikäläinen')).toBe(false);
    expect(namesMatch('', 'Matti')).toBe(false);
  });
  it('summat 1 euron tarkkuudella', () => {
    expect(amountsMatch(648, 648.4)).toBe(true);
    expect(amountsMatch(648, 660)).toBe(false);
    expect(amountsMatch(null, 648)).toBe(false);
  });
  it('tunnistaa automaattilähettäjät', () => {
    expect(isAutomatedSender('noreply@google.com')).toBe(true);
    expect(isAutomatedSender('no-reply@x.fi')).toBe(true);
    expect(isAutomatedSender('matti@gmail.com')).toBe(false);
  });
});

describe('parseUkkoPayment', () => {
  const body = 'Hei! Myyntilaskullesi 123 on tullut maksu. Laskun vastaanottaja: Laura Pihlajakangas Maksettu summa: 169.00 Ystävällisin terveisin UKKO.fi';
  it('poimii numeron, nimen ja summan', () => {
    expect(parseUkkoPayment('Laskullesi 123 on tullut maksu | UKKO Yrittäjä', body)).toEqual({
      invoiceNumber: '123',
      customerName: 'Laura Pihlajakangas',
      amount: 169,
    });
  });
  it('osaa suomalaisen summan ja puuttuvan nimen', () => {
    expect(parseUkkoPayment('Laskullesi 9 on tullut maksu', 'Maksettu summa: 1 234,50')).toEqual({ invoiceNumber: '9', customerName: null, amount: 1234.5 });
  });
  it('ei tulkitse muuta ukko-postia maksuksi', () => {
    expect(parseUkkoPayment('UUTTA! Löydä keikkoja UKKO.fi Työtorilta', 'Mainos')).toBeNull();
  });
  it('muuttaa HTML:n tekstiksi', () => {
    expect(htmlToText('<style>p{}</style><p>Yst&auml;v&auml;llisin</p> <b>terveisin</b>')).toBe('Ystävällisin terveisin');
  });
});
