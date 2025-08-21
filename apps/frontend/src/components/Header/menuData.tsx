import { Menu } from '@/types/menu';

const menuData: Menu[] = [
  {
    label: 'Etusivu',
    route: '/',
  },
  {
    label: 'Palvelut',
    route: '/palvelut',
  },
  // Removed Yritys, Blogi per request
  {
    label: "Kotimuutto",
    route: "/kotimuutto",
  },
  {
    label: "Yritysmuutto",
    route: "/yritysmuutto",
  },
  {
    label: 'Yhteystiedot',
    route: '/yhteystiedot',
  },
];

export default menuData;
