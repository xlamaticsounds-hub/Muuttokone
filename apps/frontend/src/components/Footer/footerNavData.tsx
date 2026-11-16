import { FooterMenu } from '@/types/footerMenu';

const footerNavData: FooterMenu[] = [
  {
    title: 'Palvelut',
    navItems: [
      { label: 'Muuttopalvelut', route: '/palvelut' },
      { label: 'Muuttoapu', route: '/muuttoapu' },
      { label: 'Muuttosiivous', route: '/muuttosiivous' },
      { label: 'Kuljetuspalvelu', route: '/kuljetuspalvelu' },
      { label: 'Kierrätys ja poisvienti', route: '/kierratys-ja-poisvienti' },
      { label: 'Muuttolaatikot', route: '/muuttolaatikot' },
      { label: 'Työapu', route: '/tyoapu' },
      { label: 'Yrityksille', route: '/yrityksille' },
    ],
  },
  {
    title: 'Palvelualueet',
    navItems: [
      { label: 'Muuttopalvelu Helsinki', route: '/muuttopalvelu-helsinki' },
      { label: 'Muuttopalvelu Espoo', route: '/muuttopalvelu-espoo' },
      { label: 'Muuttopalvelu Vantaa', route: '/muuttopalvelu-vantaa' },
      { label: 'Muuttopalvelu Tampere', route: '/muuttopalvelu-tampere' },
      { label: 'Muuttopalvelu Turku', route: '/muuttopalvelu-turku' },
      { label: 'Muuttopalvelu Pirkanmaa', route: '/muuttopalvelu-pirkanmaa' },
      { label: 'Muuttolaatikot Helsinki', route: '/muuttolaatikot/helsinki' },
      { label: 'Muuttolaatikot Espoo', route: '/muuttolaatikot/espoo' },
      { label: 'Muuttolaatikot Vantaa', route: '/muuttolaatikot/vantaa' },
      { label: 'Muuttolaatikot Tampere', route: '/muuttolaatikot/tampere' },
    ],
  },
  {
    title: 'Ohjeet ja yhteys',
    navItems: [
      { label: 'Muuttolaskuri', route: '/muuttolaskuri' },
      { label: 'Muuton muistilista', route: '/muuton-muistilista' },
      { label: 'Yritysmuuton muistilista', route: '/yritysmuuton-muistilista' },
      { label: 'Blogi', route: '/blogi' },
      { label: 'Ota yhteyttä', route: '/yhteystiedot' },
      { label: 'Tietosuojaseloste', route: '/tietosuoja' },
      { label: 'Käyttöehdot', route: '/kayttoehdot' },
    ],
  },
];

export default footerNavData;
