import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    label: "Etusivu",
    route: "/",
  },
  {
    label: "Palvelut",
    route: "/palvelut",
  },
  // Removed Yritys, Hinnat, Blogi per request
  {
    label: "Yhteystiedot",
    route: "/yhteystiedot",
  },
];

export default menuData;
