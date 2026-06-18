export const siteConfig = {
  brand: {
    name: 'Muuttokone.fi',
  },
  contact: {
    phone: {
      display: '+358 45 346 0072',
      tel: '+358453460072',
    },
    email: 'info@muuttokone.fi',
    openingHours: 'Joka päivä 8:00-22:00.',
    social: {
      facebook: '#',
      twitter: '#',
      linkedin: '#',
      instagram: '#',},
  },
} as const;

export type SiteConfig = typeof siteConfig;
