import { FooterMenu } from '@/types/footerMenu';

const footerNavData: FooterMenu[] = [
  {
    title: 'Palvelut',
    navItems: [
      {
        label: 'Palvelut',
        route: '/palvelut',
      },
      {
        label: 'Työapu',
        route: '/tyoapu',
      },
      {
        label: 'Yrityksille',
        route: '/yrityksille',
      },
    ],
  },
  {
    title: 'Palvelualueet',
    navItems: [
      {
        label: 'Muuttopalvelu Espoossa',
        route: '/muuttopalvelu-espoo',
      },
      {
        label: 'Muuttopalvelu Vantaalla',
        route: '/muuttopalvelu-vantaa',
      },
      {
        label: 'Muuttopalvelu Tampereella',
        route: '/muuttopalvelu-tampere',
      },
    ],
  },
  {
    title: 'Asiakaspalvelu',
    navItems: [
      {
        label: 'Ota yhteyttä',
        route: '/yhteystiedot',
      },
      {
        label: 'Tietosuojaseloste',
        route: '/tietosuoja',
      },
      {
        label: 'Käyttöehdot',
        route: '/kayttoehdot',
      },
    ],
  },
];

export default footerNavData;
