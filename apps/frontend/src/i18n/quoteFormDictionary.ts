// Finnish -> English for the shared quote form (features/business/BusinessQuoteForm.tsx), used on the
// Yrityksille page and the Yhteystiedot page. Keyed by the Finnish source text (see useT.ts).
export const quoteFormDictionary: Record<string, string> = {
  // Topic groups and topics
  'Muutot': 'Moves',
  'Muut palvelut': 'Other services',
  'Toimistomuutto': 'Office move',
  'Liiketilan tai myymälän muutto': 'Commercial premises or store move',
  'Sisäiset kalustesiirrot': 'Internal furniture moves',
  'Tavaroiden poisvienti ja kierrätys': 'Removal and recycling of items',
  'Kiinteistön tai varaston tyhjennys': 'Property or storage clearance',
  'Tapahtumat ja messut': 'Events and trade fairs',
  'Noudot ja toimitukset': 'Pickups and deliveries',
  'Kausisiirrot, kuten terassikalusteet': 'Seasonal moves, such as terrace furniture',
  'Säännölliset kuljetukset': 'Regular transports',
  'Varastointi': 'Storage',
  'Kotimuutto': 'Home move',
  'Yritysmuutto': 'Business move',
  'Pakkauspalvelu': 'Packing service',
  'Muuttosiivous': 'Move-out cleaning',
  'Kuolinpesän tyhjennys': 'Estate clearance',
  'Kuljetukset': 'Transport',
  'Muuttolaatikot': 'Moving boxes',
  'Työapu ja asennukset': 'Handyman help and installations',
  'Muu': 'Other',

  // Description placeholders
  'Esim. mitä siirretään ja mihin aikaan vuodesta': 'E.g. what needs to be moved and at what time of year',
  'Esim. mistä mihin ja kuinka usein': 'E.g. from where to where and how often',
  'Esim. tavaramäärä ja kuinka pitkäksi aikaa': 'E.g. the amount of items and for how long',
  'Esim. mitä pitää tehdä, missä ja milloin': 'E.g. what needs to be done, where and when',
  'Esim. montako laatikkoa ja kuinka pitkäksi aikaa': 'E.g. how many boxes and for how long',
  'Esim. tavaramäärä, erikoiskuljetukset tai toiveet aikataulusta':
    'E.g. the amount of items, special transports or schedule preferences',

  // Steps and fields
  'Pakolliset kentät on merkitty tähdellä': 'Required fields are marked with an asterisk',
  'Mitä tarvitsette?': 'What do you need?',
  'Mitä asia koskee?': 'What is it about?',
  'Valitse aihe': 'Choose a topic',
  'Jättäkää yhteystietonne, niin otamme teihin yhteyttä ja käymme tarpeenne läpi.':
    'Leave your contact details and we will get in touch to go through your needs.',
  'Kertokaa lyhyesti, mitä tarvitsette': 'Briefly tell us what you need',
  'Kertokaa lyhyesti tarpeestanne': 'Briefly describe your needs',
  'Kohde ja aikataulu': 'Location and schedule',
  'Mistä': 'From',
  'Minne': 'To',
  'Lähtöosoite': 'Pick-up address',
  'Kohdeosoite': 'Destination address',
  'Osoite': 'Address',
  'Kohteen osoite': 'Address of the site',
  'Toivottu ajankohta': 'Preferred date',
  'Voit jättää tyhjäksi, jos päivä ei ole vielä tiedossa.': 'You can leave this empty if the date is not known yet.',
  'Yhteystiedot': 'Contact details',
  'Yrityksen nimi': 'Company name',
  'Yritys (valinnainen)': 'Company (optional)',
  'Yritys Oy': 'Company Ltd',
  'Yhteyshenkilö': 'Contact person',
  'Nimi': 'Name',
  'Etunimi Sukunimi': 'First name Last name',
  'Puhelin': 'Phone',
  'Sähköposti': 'Email',
  'posti@yritys.fi': 'email@company.com',
  'posti@esimerkki.fi': 'email@example.com',

  // Errors
  'Valitse, mitä asia koskee.': 'Choose what it is about.',
  'Kertokaa lyhyesti, mitä tarvitsette.': 'Briefly tell us what you need.',
  'Kirjoita yrityksen nimi.': 'Enter the company name.',
  'Kirjoita yhteyshenkilön nimi.': "Enter the contact person's name.",
  'Kirjoita nimesi.': 'Enter your name.',
  'Kirjoita puhelinnumero.': 'Enter a phone number.',
  'Tarkista sähköpostiosoite.': 'Check the email address.',
  'Hyväksy tietojen käsittely, jotta voimme vastata yhteydenottoonne.':
    'Please accept the data processing so that we can reply to you.',

  // Submit and result
  'Lähetetään...': 'Sending...',
  'Lähetä yhteydenottopyyntö': 'Send contact request',
  'Lähetä tarjouspyyntö': 'Send quote request',
  'Tai soita suoraan:': 'Or call us directly:',
  'Kiitos yhteydenotosta!': 'Thank you for contacting us!',
  'Soitamme teille mahdollisimman pian ja käymme tarpeenne läpi.':
    'We will call you as soon as possible to go through your needs.',
  'Olemme sinuun yhteydessä mahdollisimman pian ja sovitaan maksuttomasta kartoituksesta.':
    'We will contact you as soon as possible to arrange a free assessment.',
  'Olemme sinuun yhteydessä mahdollisimman pian.': 'We will contact you as soon as possible.',
  'Kiireellisessä asiassa voit myös soittaa suoraan:': 'For urgent matters you can also call us directly:',
  'Kiitos! Olemme sinuun yhteydessä pian.': 'Thank you! We will be in touch soon.',
  'Jotain meni pieleen. Yritä uudelleen tai soita meille.': 'Something went wrong. Please try again or call us.',
};
