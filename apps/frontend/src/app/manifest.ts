import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Muuttokone.fi - Luotettava muuttopalvelu',
    short_name: 'Muuttokone',
    description: 'Nopea, turvallinen ja läpinäkyvä muutto Helsingissä ja Uudellamaalla.',
    start_url: '/',
    background_color: '#ffffff',
    theme_color: '#006BFF',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity'],
    lang: 'fi',
  };
}
