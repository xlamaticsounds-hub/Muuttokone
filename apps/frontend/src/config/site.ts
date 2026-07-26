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
} as const;

export type SiteConfig = typeof siteConfig;
