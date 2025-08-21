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
    title: 'Asiakaspalvelu',
    navItems: [
      {
        label: 'Yhteystiedot',
        route: '/yhteystiedot',
      },
      // UKK and Blogi pages removed
      {
        label: 'Ota yhteyttä',
        route: '/yhteystiedot',
      },
    ],
  },
];

export default footerNavData;
