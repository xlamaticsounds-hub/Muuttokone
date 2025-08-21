import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Muuttokone.fi - Luotettava muuttopalvelu',
    short_name: 'Muuttokone',
    description: 'Nopea, turvallinen ja läpinäkyvä muutto koko Suomessa.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#006BFF',
    orientation: 'portrait-primary',
    categories: ['business', 'productivity'],
    lang: 'fi',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      }
    ],
  };
}
