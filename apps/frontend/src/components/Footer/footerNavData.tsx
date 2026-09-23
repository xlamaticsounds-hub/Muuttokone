import { FooterMenu } from '@/types/footerMenu';

const footerNavData: FooterMenu[] = [
  // {
  //   title: "Palvelut",
  //   navItems: [
  //     {
  //       label: "Kotimuutto",
  //       route: "/kotimuutto",
  //     },
  // // Yritysmuutto page removed
  // // Future: Pakkauspalvelu, Varastointi
  //   ],
  // },
  // {
  //   title: "Tietoa meistä",
  //   navItems: [
  // // Yritys and Hinnoittelu pages removed
  //   ],
  // },
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
