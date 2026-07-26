// Flat Finnish -> English map for every static string in src/features/calculator/Calculator.tsx.
// Keyed by the Finnish text itself (see useT.ts) rather than abstract keys.
export const calculatorDictionary: Record<string, string> = {
  // Step titles
  'Palvelu': 'Service',
  'Paketti': 'Package',
  'Sijainti': 'Location',
  'Asunnon tiedot': 'Home details',
  'Tavarat': 'Items',
  'Hinta-arvio': 'Price estimate',
  'Varaus': 'Booking',

  // Difficulty badges
  'Helppo muutto': 'Easy move',
  'Keskivaikea muutto': 'Medium-difficulty move',
  'Vaativa muutto': 'Challenging move',

  // Date discount labels (from pricing.ts WEEKDAY_DISCOUNTS, computed server-side)
  'Edullinen päivä': 'Low-cost day',
  'Normaali päivä': 'Normal day',
  'Suosittu päivä': 'Popular day',

  // Carry distance options
  'Alle 10 m': 'Under 10 m',
  'Yli 50 m': 'Over 50 m',

  // Inventory step label by service type
  'Poistettavat tavarat': 'Items to remove',
  'Kuljetettavat tavarat': 'Items to transport',
  'Muutettava tavara': 'Items to move',

  // Included services
  'Kuljetusvakuutus': 'Transport insurance',
  'ALV sisältyy hintaan': 'VAT included',
  'Kuljettaja + kuorma-auto': 'Driver + truck',
  'Muuttovakuutus': 'Moving insurance',
  '2 kantajaa': '2 movers',
  '2 muuttajaa': '2 movers',
  'Muuttoauto': 'Moving truck',
  'Suojamateriaalit': 'Protective materials',

  // Toast validations
  'Valitse palvelu': 'Please select a service',
  'Valitse muuttopaketti': 'Please choose a moving package',
  'Täytä molemmat osoitteet': 'Please fill in both addresses',

  // Booking submit
  'Hyväksy tietojen käsittely jatkaaksesi': 'Please accept the data processing terms to continue',
  'Tarkista puhelinnumeron muoto (esim. 040 123 4567)': 'Please check the phone number format (e.g. 040 123 4567)',
  'Varaus vastaanotettu! Olemme sinuun yhteydessä pian.': 'Booking received! We will contact you soon.',
  'Varaus epäonnistui': 'Booking failed',
  'Jotain meni pieleen. Yritä uudelleen tai soita meille.': 'Something went wrong. Please try again or call us.',

  // Booked confirmation screen
  'Kiitos varauksestasi!': 'Thank you for your booking!',
  'Olemme vastaanottaneet muuttovarauksesi.': 'We have received your moving booking.',
  'Saat tarjouksen sähköpostiisi pian, ja olemme tarvittaessa yhteydessä myös puhelimitse.':
    "You'll receive your quote by email soon, and we'll also be in touch by phone if needed.",
  'Palaa etusivulle': 'Back to homepage',

  // Step 0: service selection
  'Mitä palvelua tarvitset?': 'What service do you need?',
  'Muutto': 'Moving',
  'Kodin tai toimiston muutto uuteen osoitteeseen.': 'Moving your home or office to a new address.',
  'Kuljetus': 'Transport',
  'Yksittäisten tavaroiden, huonekalujen tai ostosten kuljetus.': 'Transport of individual items, furniture, or purchases.',
  'Kierrätys': 'Recycling',
  'Vanhojen huonekalujen, roskien ja ylimääräisten tavaroiden poisvienti.': 'Removal of old furniture, junk, and extra items.',

  // Step 1: package
  'Olet valinnut muuttopalvelun': "You've selected the moving service",
  'Täyspalvelu': 'Full service',
  'Suositeltu': 'Recommended',
  'Kantajat, sopiva kuljetusauto ja vähintään herkimpien tavaroiden suojaus.':
    'Movers, a suitable vehicle, and protection for at least the most fragile items.',
  'Vain kuljettaja ajoneuvolla': 'Driver with vehicle only',
  'Pääsen itse auttamaan kantamisessa.': "I'll help with the carrying myself.",
  'Vain kantoapu': 'Carrying help only',
  'Tarvitsen vain kantajat.': 'I only need movers.',
  '89,90 €/h, min. 180 €': '€89.90/h, min. €180',

  // Step 2: locations
  'Mistä ja mihin kuljetetaan?': 'Where are you transporting from and to?',
  'Mistä ja mihin muutetaan?': 'Where are you moving from and to?',
  'Anna kohteiden osoitteet hinnan laskemiseksi.': 'Enter the addresses to calculate the price.',
  '⚠️ Google Maps API avain puuttuu. Osoitteiden automaattinen täyttö ei ole käytössä.':
    '⚠️ Google Maps API key missing. Address autocomplete is not available.',
  'Lähtöosoite': 'Pickup address',
  'Esim. Mannerheimintie 1, Helsinki': 'E.g. Mannerheimintie 1, Helsinki',
  'Määränpää': 'Destination',
  'Esim. Hämeentie 10, Helsinki': 'E.g. Hämeentie 10, Helsinki',
  'Välipysähdykset (valinnainen)': 'Additional stops (optional)',
  '+ Lisää välipysähdys': '+ Add a stop',
  'Muista huomioida välipysähdysten lisäämä matka alla olevassa etäisyysarviossa.':
    'Remember to account for the extra distance from stops in the estimate below.',
  'Arvioitu etäisyys (km)': 'Estimated distance (km)',

  // Step 3: apartment / driver details
  'Kuljettajat ja kohteet': 'Drivers and destinations',
  'Asunnon koko ja kerrokset': 'Home size and floors',
  'Nämä vaikuttavat tarvittavaan aikaan ja miehitykseen.': 'These affect the time and crew needed.',
  'Kuljettajien määrä': 'Number of drivers',
  'Lähtökohde': 'Origin',
  'Kerros': 'Floor',
  'Katutaso': 'Ground floor',
  'Hissi käytössä': 'Elevator available',
  'Kantomatka ovelta autoon': 'Carry distance from door to vehicle',
  'Matka ulko-ovelta muuttoauton luokse': 'Distance from the front door to the moving vehicle',
  'Toimitusosoite': 'Delivery address',
  'Uusi koti': 'New home',
  'Kantomatka autolta ovelle': 'Carry distance from vehicle to door',
  'Matka muuttoauton luota kohteen ulko-ovelle': 'Distance from the moving vehicle to the destination front door',

  // Step 4: inventory
  'Tavaralista on tärkein tekijä hinta-arviossa — mitä tarkempi lista, sitä tarkempi hinta.':
    'The item list is the most important factor in the price estimate — the more accurate the list, the more accurate the price.',
  'Pikavalinnat': 'Quick picks',
  'Tyhjä / muutama asia': 'Empty / a few things',
  'Tyypillinen 1h': 'Typical 1-bedroom',
  'Tyypillinen 2h': 'Typical 2-bedroom',
  'Tyypillinen 3h': 'Typical 3-bedroom',
  'Pikavalinta täyttää tyypillisen tavaralistan — muokkaa vapaasti alta.':
    'The quick pick fills in a typical item list — feel free to adjust it below.',
  'Jätteen laji': 'Type of waste',
  'Valitse kaikki jätetyypit — kierrätysmaksu lisätään automaattisesti hintaan.':
    'Select all waste types — the disposal fee is added to the price automatically.',
  'Ilmainen': 'Free',
  'Huonekalut ja laatikot': 'Furniture and boxes',
  'Tavaraa ei löydy listalta?': "Can't find your item on the list?",
  'Kirjoita tavaran nimi ja määrä, ja lisäämme sen arvioon.': "Write the item's name and quantity, and we'll add it to the estimate.",
  'Esim. Akvaario, soutuvene, jääkellari...': 'E.g. Aquarium, rowing boat, wine cellar...',
  'Lisää': 'Add',
  'Purkupalvelu': 'Assembly service',
  'Huonekalujen purku ja kasaus': 'Furniture disassembly and assembly',
  'Kierrätys & jäte': 'Recycling & waste',
  'Poistettavien tavaroiden kierrätys': 'Recycling of items being removed',
  'Pakkauspalvelu': 'Packing service',
  'Me pakkaamme tavarat puolestasi': 'We pack your items for you',
  'Muuttosiivous': 'Move-out cleaning',
  'Vanhan asunnon loppusiivous': 'Final cleaning of the old home',

  // Step 5: quote
  'Kuljetuksen hinta-arvio': 'Transport price estimate',
  'Hinta-arviosi': 'Your price estimate',
  'Laskettu annettujen tietojen perusteella.': 'Calculated based on the information provided.',
  '🛡️ Vakuutus sisältyy': '🛡️ Insurance included',
  '✅ Ei piilokuluja': '✅ No hidden costs',
  '📋 Hinta-arvio ei sido sinua': '📋 The estimate is not binding',
  'Muuttopäivä (vaikuttaa hintaan)': 'Moving date (affects price)',
  'Valitse päivä nähdäksesi voiko ajankohta tuoda alennusta.': 'Select a date to see if it could bring a discount.',
  'Arvioitu muuttosi': 'Your estimated move',
  'sis. ALV': 'incl. VAT',
  'Arvioitu kesto': 'Estimated duration',
  'tuntia': 'hours',
  'Tiimi': 'Team',
  'Kuorma-auto + 2 miestä': 'Truck + 2 movers',
  'Kuljettaja + Kuorma-auto': 'Driver + Truck',
  'Muuttoauto (kuorma-auto)': 'Moving truck',
  'Sopiva kuorma-auto': 'Suitable truck',
  'Vakuutus': 'Insurance',
  'Sisältyy': 'Included',
  'Välipysähdykset': 'Additional stops',
  'Normaalihinta': 'Regular price',
  'Lopullinen arvio': 'Final estimate',
  'Sisältää': 'Includes',
  'Mistä hinta muodostuu': 'How the price is calculated',
  'Tavaramäärän vaikutus': 'Impact of item quantity',
  'Kerrosten ja hissin vaikutus': 'Impact of floors and elevator',
  'Kantomatkan vaikutus': 'Impact of carry distance',
  'Kuljetusmatkan vaikutus': 'Impact of transport distance',
  'Muuttomatkan vaikutus': 'Impact of moving distance',
  'Välipysähdysten vaikutus': 'Impact of additional stops',
  'Lisäpalveluiden vaikutus': 'Impact of extra services',
  'Koordinointiaika (kiinteä, auton valmistelu ja paperityöt)': 'Coordination time (fixed, vehicle setup and paperwork)',
  'Yhteensä (ennen muuttopäivän alennusta)': 'Total (before moving-day discount)',
  'tavaraa yhteensä': 'items total',
  'm³ arvioitu tilavuus': 'm³ estimated volume',
  'h arvioitu työaika': 'h estimated labor time',
  'Tämä on automaattinen arvio. Lopullinen hinta vahvistetaan kun asiantuntijamme on käynyt tiedot läpi.':
    'This is an automatic estimate. The final price will be confirmed once our expert has reviewed the details.',
  'Lisätyt tavarat': 'Items added',

  // Step 6: booking form
  'Viimeistele varaus': 'Complete your booking',
  'Valitse kuljetuspäivä': 'Choose a transport date',
  'Valitse muuttopäivä': 'Choose a moving date',
  'ja jätä yhteystietosi.': 'and leave your contact details.',
  'Toivottu muuttopäivä': 'Preferred moving date',
  'Nimi': 'Name',
  'Etunimi Sukunimi': 'First name Last name',
  'Sähköposti': 'Email',
  'posti@esimerkki.fi': 'email@example.com',
  'Puhelinnumero': 'Phone number',
  'Lähetämme sinulle lopullisen tarjouksen sähköpostiin — ei sitovia lupauksia vielä. Emme veloita mitään ennen kuin olet hyväksynyt tarjouksen.':
    "We'll send you the final quote by email — no binding commitment yet. We won't charge anything until you've accepted the quote.",
  'Lähetetään pyyntöä...': 'Sending request...',
  'Lähetä tarjouspyyntö': 'Send quote request',

  // Nav buttons
  'Takaisin': 'Back',
  'Siirry varaukseen': 'Continue to booking',
  'Seuraava': 'Next',
};
