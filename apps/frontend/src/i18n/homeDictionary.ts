// Flat Finnish -> English dictionaries for Header, Footer, and the homepage marketing
// sections, keyed by the Finnish source text (see useT.ts).

export const headerDictionary: Record<string, string> = {
  'Soita': 'Call',
  'Etusivu': 'Home',
  'Muuttolaskuri': 'Moving Calculator',
  'Palvelut': 'Services',
  'Blogi': 'Blog',
  'Yhteystiedot': 'Contact',
};

export const footerDictionary: Record<string, string> = {
  'Luotettava muuttopalveluyritys Helsingissä ja Uudellamaalla. Tarjoamme ammattitaitoisia koti- ja yritysmuuttoja, pakkausta, kuljetuksia ja kuolinpesätyhjennyksiä.':
    'A trusted moving company in Helsinki and Uusimaa. We offer professional home and business moves, packing, transport, and estate clearances.',
  'Yhteystiedot': 'Contact details',
  'Asiakaspalvelu': 'Customer service',
  'Ota yhteyttä': 'Contact us',
  'Tietosuojaseloste': 'Privacy policy',
  'Käyttöehdot': 'Terms of service',
  'Kaikki oikeudet pidätetään.': 'All rights reserved.',
};

export const heroDictionary: Record<string, string> = {
  'Aloita tästä – saat hinta-arvion nopeasti': 'Start here – get a price estimate fast',
  'Laske tarkka hinta-arvio muutollesi suoraan tästä. Tämä ei sido sinua mihinkään.':
    'Calculate an accurate price estimate for your move right here. This does not commit you to anything.',
  'Luotettava apusi': 'Your Reliable Helper',
  'Nopea, turvallinen ja läpinäkyvä muutto Helsingissä ja Uudellamaalla. Ammattitaitoiset ja tehokkaat muuttopalvelut yksityis- ja yritysasiakkaille. Ei piilokuluja, vain rehellinen hinnoittelu.':
    'A fast, safe, and transparent move in Helsinki and Uusimaa. Professional, efficient moving services for private and business customers. No hidden fees, just honest pricing.',
  'Laske muuttolaskurilla ja saat kiinteän hinnan jo 3 minuutissa – ei arvailua, ei piilokuluja, vain tarkka hinta etukäteen.':
    'Use the moving calculator and get a fixed price in just 3 minutes – no guessing, no hidden fees, just an accurate price upfront.',
  'Maksuton kartoitus ja neuvonta': 'Free assessment and advice',
  'Vakuutettu ja rekisteröity': 'Insured and registered',
  'Nopea vastaus': 'Fast response',
  'kotimuutossa': 'home moving',
  'yritysmuutossa': 'business moving',
  'pakkauspalveluissa': 'packing services',
  'varastoinnissa': 'storage',
  'muuttosiivouksessa': 'move-out cleaning',
  'erikoiskuljetuksissa': 'special transports',
};

export const statsDictionary: Record<string, string> = {
  '4.9/5 asiakastyytyväisyys': '4.9/5 customer satisfaction',
  'Keskiarvo viimeisen 12 kk aikana': 'Average over the last 12 months',
  '3 200+ muuttoa': '3,200+ moves',
  'Kotitaloudet ja yritykset': 'Households and businesses',
  '98 % aikataulussa': '98% on schedule',
  'Toimitukset sovitussa ajassa': 'Deliveries within the agreed time',
};

export const pricingPreviewDictionary: Record<string, string> = {
  '🔥 Muutot alk. 200€': '🔥 Moves from €200',
  '5 km sisältyy hintaan': '5 km included in the price',
  'Yksiö (25-35m²)': 'Studio (25–35 m²)',
  'Suosittu': 'Popular',
  'Sopii opiskelijoille ja sinkuille. Nopea ja ketterä muutto.': 'Suited for students and singles. A quick, agile move.',
  'Alkaen': 'Starting at',
  '2 muuttomiestä': '2 movers',
  'Kuorma-auto (20m³)': 'Truck (20m³)',
  'Noin 2-3 tuntia': 'About 2–3 hours',
  'Laske tarkka hinta': 'Calculate the exact price',
  'Kaksio (40-60m²)': '2-room (40–60 m²)',
  'Pariskunnille ja pienille perheille. Tehokas palvelu.': 'For couples and small families. An efficient service.',
  '2-3 muuttomiestä': '2–3 movers',
  'Iso kuorma-auto': 'Large truck',
  'Noin 3-5 tuntia': 'About 3–5 hours',
  'Kolmio+ (70m²+)': '3-room+ (70 m²+)',
  'Perheasunnot ja omakotitalot. Täyden palvelun muutto.': 'Family homes and houses. A full-service move.',
  '3-4 muuttomiestä': '3–4 movers',
  'Koko päivä': 'Full day',
};

export const processStepsDictionary: Record<string, string> = {
  'Muutto selkokielellä': 'Moving, made simple',
  'Näin etenemme': 'Here is how it works',
  'Selkeä ja nopea prosessi alusta loppuun – tiedät aina hinnan ja seuraavan askeleen etukäteen. Ei piilokuluja, ei yllätyksiä.':
    'A clear, fast process from start to finish – you always know the price and the next step in advance. No hidden fees, no surprises.',
  'Laske tarkka hinta muuttolaskurilla': 'Calculate an exact price with the moving calculator',
  'Täytä tietosi vain 3 minuutissa ja saat tarkan, sitoumuksettoman hinnan heti – ei arvailua, ei piilokuluja, ei odottelua.':
    'Fill in your details in just 3 minutes and get an exact, no-obligation price right away – no guessing, no hidden fees, no waiting.',
  'Sovitaan sinulle sopiva ajankohta': "We'll agree on a time that suits you",
  'Käymme yhdessä läpi muuton yksityiskohdat ja varmistamme aikataulun, joka sopii juuri sinulle.':
    "We'll go through the details of your move together and confirm a schedule that works for you.",
  'Ammattilaiset hoitavat muuton puolestasi': 'Our professionals handle the move for you',
  'Kokenut ja vakuutettu tiimimme pakkaa, kantaa ja kuljettaa tavarasi turvallisesti ja huolellisesti uuteen kotiin.':
    'Our experienced, insured team packs, carries, and transports your belongings safely and carefully to your new home.',
  'Rentoudu – muutto on hoidettu': 'Relax – the move is handled',
  'Varmistamme, että kaikki on kunnossa viimeistä laatikkoa myöten. Maksat vasta kun työ on tehty sovitusti.':
    "We make sure everything is in order down to the last box. You only pay once the job is done as agreed.",
  'Aloita tästä': 'Start here',
};

export const muuttolaskuriPageDictionary: Record<string, string> = {
  'Muuttolaskuri': 'Moving Calculator',
  'Laske ja saa hinta heti – tarkka hinta-arvio sekunneissa, ei piilokuluja. Suomen tarkin muuttolaskuri perustuu oikeaan tavaramäärään.':
    'Calculate and get a price instantly – an accurate estimate in seconds, no hidden fees. Finland’s most accurate moving calculator is based on your actual inventory.',
  'Syötä tiedot': 'Enter your details',
  'Kerro meille mistä mihin muutat ja asunnon koko.': 'Tell us where you are moving from and to, and your home size.',
  'Saat hinnan': 'Get your price',
  'Algoritmimme laskee reilun hinnan perustuen kilometri- ja tuntiveloitukseen.': 'Our algorithm calculates a fair price based on distance and hourly billing.',
  'Varaa heti': 'Book instantly',
  'Valitse sopiva päivä ja vahvista varaus. Helppoa!': 'Choose a suitable date and confirm your booking. Easy!',
};

export const faqDictionary: Record<string, string> = {
  'Usein kysytyt kysymykset': 'Frequently asked questions',
  'Vastauksia yleisimpiin kysymyksiin muutostamme ja palveluistamme.': 'Answers to the most common questions about our moves and services.',

  'Miksi valita meidät?': 'Why choose us?',
  'Olemme vakuutettu ja rekisteröity muuttopalvelu, joka tarjoaa rehellisen, kiinteän hinnan ilman piilokuluja ja nopean vastauksen tarjouspyyntöihin. Asiakkaamme arvostavat ammattitaitoista, joustavaa palveluamme ja selkeää hinnoittelua.':
    'We are an insured and registered moving company offering an honest, fixed price with no hidden fees and a fast response to quote requests. Our customers value our professional, flexible service and clear pricing.',

  'Mitä tapahtuu, jos muutto kestää pidempään kuin tarjouksessa – kenelle maksu menee?':
    'What happens if the move takes longer than quoted — who does the payment go to?',
  'Ei mitään ylimääräistä – jos tarjouksessa ilmoitetut tavarat ja tiedot vastaavat todellisuutta, sinulle ei tule lisäkuluja, vaikka muutto kestäisi arvioitua pidempään. Maksu suoritetaan suoraan meille, Muuttokone.fi:lle, muuton valmistuttua.':
    'Nothing extra — if the items and details given in the quote match reality, you will not incur any additional costs even if the move takes longer than estimated. Payment is made directly to us, Muuttokone.fi, once the move is complete.',

  'Mitä hyötyä muuttolaskurista on?': 'What is the benefit of the moving calculator?',
  'Muuttolaskuri antaa sinulle tarkan, kiinteän hinta-arvion vain 3 minuutissa antamiesi tietojen perusteella – ei tarvitse odottaa puhelinsoittoa tai sähköpostia. Näet suoraan arvioidun työajan, tarvittavan kaluston ja hinnan haarukan, ja voit verrata eri palvelupaketteja ennen päätöksentekoa.':
    'The moving calculator gives you an exact, fixed price estimate in just 3 minutes based on the details you provide — no need to wait for a phone call or email. You see the estimated labor time, the equipment needed, and the price range right away, and you can compare different service packages before deciding.',

  'Sisältyykö muuttooni vakuutus?': 'Is insurance included in my move?',
  'Kyllä, kaikkiin täyspalvelumuuttoihimme sisältyy muuttovakuutus, joka kattaa tavaroidesi kuljetuksen aikana sattuvat vahingot. Vakuutus on automaattisesti mukana hinnassa, eikä siitä tarvitse maksaa erikseen.':
    'Yes, all our full-service moves include moving insurance that covers damage to your items during transport. The insurance is automatically included in the price at no extra cost.',

  'Mitä tapahtuu, jos tavarani vaurioituu muutossa?': 'What happens if my items are damaged during the move?',
  'Ilmoita havaitsemastasi vahingosta meille kirjallisesti 7 vuorokauden kuluessa muutosta. Lakisääteinen tiekuljetus- ja vastuuvakuutuksemme korvaa vakuutusehtojen mukaisesti vahingot, jotka aiheutuvat huolimattomuudestamme kuljetuksen aikana. Vakuutus ei kata vahinkoja, jotka johtuvat asiakkaan itse pakkaamien tavaroiden puutteellisesta pakkauksesta.':
    'Report any damage you notice to us in writing within 7 days of the move. Our statutory road transport and liability insurance compensates, per its terms, for damage caused by our negligence during transport. The insurance does not cover damage resulting from inadequate packing of items packed by the customer.',

  'Kuinka pitkälle etukäteen muutto kannattaa varata?': 'How far in advance should I book my move?',
  'Suosittelemme varaamaan vähintään 1–2 viikkoa etukäteen, erityisesti kuun vaihteen ja kesäkuukausien aikana kysynnän ollessa suurimmillaan. Tarvittaessa autamme myös kiireellisissä, lyhyellä varoitusajalla tehtävissä muutoissa.':
    'We recommend booking at least 1–2 weeks in advance, especially around the turn of the month and during the summer months when demand is highest. If needed, we can also help with urgent moves on short notice.',
};

export const servicesDictionary: Record<string, string> = {
  'Palvelut': 'Services',
  'Palvelumme': 'Our services',
  'Tarjoamme kattavat muuttopalvelut kotitalouksille ja yrityksille Helsingissä ja Uudellamaalla.':
    'We offer comprehensive moving services for households and businesses in Helsinki and Uusimaa.',
  'Tarvitsetko yhdistelmäpalvelun tai räätälöidyn ratkaisun? Soita tai täytä lomake.':
    'Need a combined service or a tailored solution? Call us or fill in the form.',
};

export const servicesDataDictionary: Record<string, string> = {
  'Kotimuutto': 'Home moving',
  'Ovelta ovelle -palvelu, jossa huolehdimme kaikesta kantamisesta ja kuljetuksesta. Selkeä hinnoittelu ilman piilokuluja – tiedät etukäteen mitä maksat.':
    'A door-to-door service where we take care of all the carrying and transport. Clear pricing with no hidden fees – you know upfront what you pay.',
  'Yritysmuutto': 'Business moving',
  'Minimoi liiketoiminnan keskeytykset: IT-laitteet, kalusteet ja arkistot siirtyvät aikataulun mukaan. Iltaisin ja viikonloppuisin tarvittaessa.':
    'Minimize business disruption: IT equipment, furniture, and archives move on schedule. Evenings and weekends available if needed.',
  'Pakkauspalvelu': 'Packing service',
  'Säästä tunteja ja vältä vahingot: ammattilaiset pakkaavat keittiöt, lasit ja hauraat esineet huolella. Materiaali ja merkinnät sisältyvät.':
    'Save hours and avoid damage: professionals carefully pack kitchens, glassware, and fragile items. Materials and labeling included.',
  'Kuolinpesätyhjennnykset': 'Estate clearances',
  'Hoidamme kuolinpesän tyhjennyksen ammattitaidolla ja hienovaraisesti. Kierrätetään, lahjoitetaan tai viedään kierrätyskeskukseen – kaikki sovitun mukaan. Helpotamme läheisen taakkaa vaikeana hetkenä.':
    'We handle estate clearances professionally and with sensitivity. Items are recycled, donated, or taken to a recycling center — all as agreed. We ease the burden on loved ones during a difficult time.',
  'Muuttosiivous': 'Move-out cleaning',
  'Asunnon luovutussiivous takuulla: vanhan kodin jättäminen putipuhtaaksi vuokranantajalle tai ostajalle. Yksi paketti, valmis kerralla.':
    'Guaranteed handover cleaning: leaving your old home spotless for the landlord or buyer. One package, done in one go.',
  'Kuljetukset': 'Transport',
  'Kuljetus A:sta B:hen ilman stressiä – kaatopaikka-ajot, vanhan tavaran haku, huonekalujen siirrot tai muut yksittäiset kuljetustarpeet. Nopea, edullinen ja luotettava. Soita ja sovitaan.':
    'Stress-free transport from A to B – dump runs, old item pickup, furniture moves, or other one-off transport needs. Fast, affordable, and reliable. Call us and we’ll arrange it.',
};

export const aboutDictionary: Record<string, string> = {
  'Miksi Muuttokone?': 'Why Muuttokone?',
  'Me hoidamme muuton – sinä voit keskittyä olennaiseen': 'We handle the move – you can focus on what matters',
  'Kokeneet muuttajamme, selkeä hinnoittelu ilman piilokuluja sekä kattava vakuutusturva takaavat sujuvan ja turvallisen muuton niin yksityisille kuin yrityksille.':
    'Our experienced movers, clear pricing with no hidden fees, and comprehensive insurance ensure a smooth and safe move for private customers and businesses alike.',
  'Ennen muuttoa käymme asiakkaan kanssa läpi kohteen, aikataulun ja erityistarpeet. Suunnittelemme työn tehokkaaksi ja ennakoitavaksi, jotta muutto toteutuu täsmällisesti ja ilman yllätyksiä.':
    'Before the move, we go through the destination, schedule, and any special needs with the customer. We plan the work to be efficient and predictable, so the move happens on time and without surprises.',
};

export const ctaDictionary: Record<string, string> = {
  'Valmis muuttoon? Aloita tänään!': 'Ready to move? Start today!',
  'Saat meiltä maksuttoman kartoituksen ja tarjouksen 24 tunnin sisällä. Liity satojen tyytyväisten asiakkaiden joukkoon ja koe stressitön muutto.':
    'Get a free assessment and quote from us within 24 hours. Join hundreds of satisfied customers and experience a stress-free move.',
  'Pyydä tarjous': 'Request a quote',
};

export const contactDictionary: Record<string, string> = {
  'Ota yhteyttä': 'Contact us',
  'Saat meiltä maksuttoman kartoituksen ja tarjouksen nopeasti. Kerro meille muuttosi yksityiskohdat, niin autamme sinua parhaalla mahdollisella tavalla.':
    "You'll get a free assessment and quote from us quickly. Tell us the details of your move, and we'll help you in the best possible way.",
  'Sähköposti': 'Email',
  'Puhelinnumero': 'Phone number',
  'Aukioloajat': 'Opening hours',
  'Yhteystiedot': 'Contact details',
  'Sosiaalinen media': 'Social media',
  'Nimi': 'Name',
  'Nimesi': 'Your name',
  'sahkoposti@esimerkki.fi': 'email@example.fi',
  '+358 40 123 4567': '+358 40 123 4567',
  'Viesti': 'Message',
  'Kerro meille kuinka voimme auttaa...': 'Tell us how we can help...',
  'Lähetetään...': 'Sending...',
  'Lähetä viesti': 'Send message',
  'Nimi ja viesti ovat pakollisia': 'Name and message are required',
  'Hyväksy tietojen käsittely jatkaaksesi': 'Please accept the data processing terms to continue',
  'Viesti lähetetty onnistuneesti!': 'Message sent successfully!',
  'Lähetys epäonnistui': 'Sending failed',
  'Viestin lähetys epäonnistui. Yritä uudelleen.': 'Sending the message failed. Please try again.',
};

export const serviceAreaDictionary: Record<string, string> = {
  'Toimimmeko alueellasi?': 'Do we operate in your area?',
  'Päätoiminta-alueemme on Helsinki ja Uusimaa, mutta autamme muutoissa laajemminkin. Tarkista postinumerolla ja pyydä tarjous saman tien.':
    'Our main service area is Helsinki and Uusimaa, but we help with moves more widely too. Check with your postal code and request a quote right away.',
  'Postinumero, esim. 00100': 'Postal code, e.g. 00100',
  'Tarkista': 'Check',
  'Tarkista postinumero – sen tulee olla 5 numeroa.': 'Please check the postal code – it should be 5 digits.',
  'Pyydä tarjous tähän alueeseen': 'Request a quote for this area',
};
