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
        label: 'Yrityksille',
        route: '/yrityksille',
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
