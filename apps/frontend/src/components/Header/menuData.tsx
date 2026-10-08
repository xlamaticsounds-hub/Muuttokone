import { Menu } from '@/types/menu';

// Etusivu ja Muuttolaskuri näkyvät vain mobiilivalikossa: tietokoneen yläpalkissa etusivulle vie
// logo ja muuttolaskuriin sininen painike.
const menuData: Menu[] = [
  {
    label: 'Etusivu',
    route: '/',
    mobileOnly: true,
  },
  {
    label: 'Muuttolaskuri',
    route: '/muuttolaskuri',
    mobileOnly: true,
  },
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
  {
    label: 'Blogi',
    route: '/blogi',
  },
  {
    label: 'Yhteystiedot',
    route: '/yhteystiedot',
  },
];

export default menuData;