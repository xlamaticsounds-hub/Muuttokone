// Laskut lähetetään ukko.fi:n kautta, joten hallinnan oma laskutus on piilotettu: Laskutus-valikko,
// liidin "Tee lasku" ja laskut haussa. Vanhat laskut ovat yhä osoitteessa /hallinta/laskutus.
// Laskutuksen saa takaisin näkyviin vaihtamalla tämän true:ksi.
export const INVOICING_ENABLED = false;

// Hallinnan osiot, joita ei näytetä valikossa (eikä haussa). Sivut aukeavat yhä suoralla osoitteella.
// Osion saa takaisin poistamalla sen listalta.
export const HIDDEN_ADMIN_SECTIONS: readonly string[] = [
  '/hallinta/asiakkaat',
  '/hallinta/galleria',
  '/hallinta/analytiikka',
  '/hallinta/lokit',
  ...(INVOICING_ENABLED ? [] : ['/hallinta/laskutus']),
];

export const isAdminSectionHidden = (href: string) => HIDDEN_ADMIN_SECTIONS.includes(href);
