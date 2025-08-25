export const siteConfig = {
  brand: {
    name: 'Muuttokone.fi',
  },
  contact: {
    phone: {
      display: '+358 40 819 5982',
      tel: '+358408195982',
    },
    email: 'info@muuttokone.fi',
    openingHours:
      'Ma-Pe 8:00-18:00, La-Su 9:00-15:00. Kiireellisissä asioissa voit tavoittaa meidät kellon ympäri.',
    social: {
      facebook: '#',
      twitter: '#',
      linkedin: '#',
      behance: '#',
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;
