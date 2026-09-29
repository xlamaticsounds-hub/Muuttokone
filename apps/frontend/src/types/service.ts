export type Service = {
  icon: string;
  title: string;
  description: string;
  bgClass: string;
  href?: string;
  // Korostettu palvelu: näytetään leveänä korttina muiden korttien yläpuolella (features/services).
  featured?: boolean;
  // Korostetun kortin esimerkkipalvelut pieninä tageina.
  highlights?: string[];
};
