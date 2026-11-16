// Kevyt lista kaupunkisivujen linkeistä asiakaskomponentteihin (etusivun hero), jotta niiden ei
// tarvitse tuoda koko cityData.ts:ää. Testi (cityPages.test.ts) varmistaa, että lista vastaa CITY_PAGES-taulukkoa.
export const CITY_LINKS = [
  { name: 'Helsinki', path: '/muuttopalvelu-helsinki' },
  { name: 'Espoo', path: '/muuttopalvelu-espoo' },
  { name: 'Vantaa', path: '/muuttopalvelu-vantaa' },
  { name: 'Tampere', path: '/muuttopalvelu-tampere' },
  { name: 'Turku', path: '/muuttopalvelu-turku' },
  { name: 'Pirkanmaa', path: '/muuttopalvelu-pirkanmaa' },
] as const;
