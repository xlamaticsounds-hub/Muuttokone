export type Menu = {
  label: string;
  route?: any;
  children?: Menu[];
  // Näytetään vain mobiilivalikossa (alle lg-leveyden), ei tietokoneen yläpalkissa.
  mobileOnly?: boolean;
};
