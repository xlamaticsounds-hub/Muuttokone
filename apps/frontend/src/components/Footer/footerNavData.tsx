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
        label: 'Muuttolaatikot',
        route: '/muuttolaatikot',
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
      {
        label: 'Muuttolaatikot Helsingissä',
        route: '/muuttolaatikot/helsinki',
      },
      {
        label: 'Muuttolaatikot Espoossa',
        route: '/muuttolaatikot/espoo',
      },
      {
        label: 'Muuttolaatikot Vantaalla',
        route: '/muuttolaatikot/vantaa',
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
