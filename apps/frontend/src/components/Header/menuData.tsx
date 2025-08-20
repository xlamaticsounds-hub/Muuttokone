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
  // Removed Yritys, Blogi per request
  {
    label: "Yhteystiedot",
    route: "/yhteystiedot",
  },
  // --- Maybe ---
  // {
  //   label: "Kotimuutto",
  //   route: "/kotimuutto",
  // },
  // {
  //   label: "Yritysmuutto",
  //   route: "/yritysmuutto",
  // },
];

export default menuData;
