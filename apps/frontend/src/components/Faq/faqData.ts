export type FaqItem = { q: string; a: string };

// Yleiset muuttokysymykset (Faq-komponentin oletuslista). Omassa moduulissaan ilman 'use client'
// -määritystä, jotta myös palvelinkomponentit (etusivu, UKK-sivu) voivat käyttää samaa listaa.
export const generalFaqData: FaqItem[] = [
  {
    q: 'Miksi valita meidät?',
    a: 'Olemme vakuutettu ja rekisteröity muuttopalvelu, joka tarjoaa rehellisen, kiinteän hinnan ilman piilokuluja ja nopean vastauksen tarjouspyyntöihin. Asiakkaamme arvostavat ammattitaitoista, joustavaa palveluamme ja selkeää hinnoittelua.',
  },
  {
    q: 'Mitä tapahtuu, jos muutto kestää pidempään kuin tarjouksessa – kenelle maksu menee?',
    a: 'Ei mitään ylimääräistä – jos tarjouksessa ilmoitetut tavarat ja tiedot vastaavat todellisuutta, sinulle ei tule lisäkuluja, vaikka muutto kestäisi arvioitua pidempään. Maksu suoritetaan suoraan meille, Muuttokone.fi:lle, muuton valmistuttua.',
  },
  {
    q: 'Mitä hyötyä muuttolaskurista on?',
    a: 'Muuttolaskuri antaa sinulle tarkan, kiinteän hinta-arvion vain muutamassa sekunnissa antamiesi tietojen perusteella – ei tarvitse odottaa puhelinsoittoa tai sähköpostia. Näet suoraan arvioidun työajan, tarvittavan kaluston ja hinnan haarukan, ja voit verrata eri palvelupaketteja ennen päätöksentekoa.',
  },
  {
    q: 'Sisältyykö muuttooni vakuutus?',
    a: 'Kyllä, kaikkiin täyspalvelumuuttoihimme sisältyy muuttovakuutus, joka kattaa tavaroidesi kuljetuksen aikana sattuvat vahingot. Vakuutus on automaattisesti mukana hinnassa, eikä siitä tarvitse maksaa erikseen.',
  },
  {
    q: 'Mitä tapahtuu, jos tavarani vaurioituu muutossa?',
    a: 'Ilmoita havaitsemastasi vahingosta meille kirjallisesti 7 vuorokauden kuluessa muutosta. Lakisääteinen tiekuljetus- ja vastuuvakuutuksemme korvaa vakuutusehtojen mukaisesti vahingot, jotka aiheutuvat huolimattomuudestamme kuljetuksen aikana. Vakuutus ei kata vahinkoja, jotka johtuvat asiakkaan itse pakkaamien tavaroiden puutteellisesta pakkauksesta.',
  },
  {
    q: 'Kuinka pitkälle etukäteen muutto kannattaa varata?',
    a: 'Suosittelemme varaamaan vähintään 1–2 viikkoa etukäteen, erityisesti kuun vaihteen ja kesäkuukausien aikana kysynnän ollessa suurimmillaan. Tarvittaessa autamme myös kiireellisissä, lyhyellä varoitusajalla tehtävissä muutoissa.',
  },
  {
    q: 'Voinko vuokrata muuttolaatikot teiltä?',
    a: 'Kyllä. Vuokraamme kestäviä, pinottavia muuttolaatikoita 0,19 €/laatikko/vuorokausi (sis. ALV). Toimitus kotiovelle ja nouto ovat ilmaiset, kun vuokraat laatikot muuton yhteydessä. Ilman muuttoa ne ovat ilmaiset, kun vuokran arvo on vähintään 100 € (esim. 38 laatikkoa 14 vuorokaudeksi), muuten toimitus ja nouto maksavat yhteensä 39 € pääkaupunkiseudulla. Lisää laatikot muuttolaskurin lisäpalveluista tai vuokraa pelkät laatikot Muuttolaatikot-sivulta.',
  },
  {
    q: 'Kuinka monta muuttolaatikkoa tarvitsen?',
    a: 'Nyrkkisääntönä noin yksi laatikko asuinneliötä kohti: yksiö 25–30, kaksio 45–55, kolmio 65–75 ja neliö tai suurempi noin 90 laatikkoa. Muuttolaskuri ehdottaa määrän tavaralistasi tai asunnon koon mukaan, ja voit muokata sitä vapaasti.',
  },
];

// Etusivulla näytetään vain tärkeimmät; koko lista on UKK-sivulla (/usein-kysytyt-kysymykset).
const HOME_QUESTIONS = new Set([
  'Mitä tapahtuu, jos muutto kestää pidempään kuin tarjouksessa – kenelle maksu menee?',
  'Sisältyykö muuttooni vakuutus?',
  'Mitä tapahtuu, jos tavarani vaurioituu muutossa?',
  'Kuinka pitkälle etukäteen muutto kannattaa varata?',
  'Voinko vuokrata muuttolaatikot teiltä?',
]);

export const homeFaqData: FaqItem[] = generalFaqData.filter((item) => HOME_QUESTIONS.has(item.q));
