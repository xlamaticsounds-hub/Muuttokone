export const siteConfig = {
  brand: {
    name: 'Muuttokone.fi',
  },
  contact: {
    phone: {
      display: '+358 45 847 0755',
      tel: '+358458470755',
    },
    email: 'info@muuttokone.fi',
    openingHours: 'Joka päivä 8:00-22:00.',
  },
  businessId: '3624534-1',
  bankAccount: 'FI18 7997 7994 3877 98',
  // Laskun maksun saaja — virallinen yhtiönimi, eri kuin verkkosivun/asiakasviestinnän brändi "Muuttokone.fi"
  invoicePayee: 'Muuttokone Oy',
  // Laskulla näytettävä myyjän osoite
  invoiceAddress: 'c/o Cristofer Kokkonen, Kivipyykintie 9 D 105, 00710 Helsinki',
  // Näytetään automaattisesti laskulla aina kun jonkin rivin ALV on 0 %
  vatExemptionNotice: 'ALV 0 % – myyjä ei ole arvonlisäverovelvollinen vähäisen liiketoiminnan vuoksi (AVL 3 §)',
} as const;

export type SiteConfig = typeof siteConfig;
