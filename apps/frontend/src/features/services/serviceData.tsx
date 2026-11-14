import { Service } from '@/types/service';

const serviceData: Service[] = [
  {
    icon: '/icons/palvelut/kotimuutto.png',
    title: 'Kotimuutto',
    description:
      'Ovelta ovelle -palvelu, jossa huolehdimme kaikesta kantamisesta ja kuljetuksesta. Selkeä hinnoittelu ilman piilokuluja – tiedät etukäteen mitä maksat.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/palvelut/yritysmuutto.png',
    title: 'Yritysmuutto',
    description:
      'Minimoi liiketoiminnan keskeytykset: IT-laitteet, kalusteet ja arkistot siirtyvät aikataulun mukaan. Iltaisin ja viikonloppuisin tarvittaessa.',
    bgClass: 'hover:bg-primary/5',
    href: '/yrityksille',
  },
  {
    icon: '/icons/palvelut/pakkauspalvelu.png',
    title: 'Pakkauspalvelu',
    description:
      'Säästä tunteja ja vältä vahingot: ammattilaiset pakkaavat keittiöt, lasit ja hauraat esineet huolella. Materiaali ja merkinnät sisältyvät.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/palvelut/kuolinpesa.png',
    title: 'Kuolinpesätyhjennnykset',
    description:
      'Hoidamme kuolinpesän tyhjennyksen ammattitaidolla ja hienovaraisesti. Kierrätetään, lahjoitetaan tai viedään kierrätyskeskukseen – kaikki sovitun mukaan. Helpotamme läheisen taakkaa vaikeana hetkenä.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/palvelut/muuttosiivous.png',
    title: 'Muuttosiivous',
    description:
      'Asunnon luovutussiivous takuulla: vanhan kodin jättäminen putipuhtaaksi vuokranantajalle tai ostajalle. Yksi paketti, valmis kerralla.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/palvelut/tyoapu.png',
    title: 'Työapu ja asennukset',
    description:
      'TV seinälle, pesukone paikalleen, kalusteet koottuna, IT-apu, pihatyöt ja kantoapu. Kiinteä hinta tai tuntiveloitus – kotiin, mökille ja yritykseen.',
    bgClass: 'hover:bg-primary/5',
    href: '/tyoapu',
    featured: true,
    highlights: ['TV:n asennus', 'Pesukoneen asennus', 'Kalusteiden kokoaminen', 'IT-apu', 'Pihatyöt', 'Kantoapu'],
  },
  {
    icon: '/icons/palvelut/kuljetukset.png',
    title: 'Kuljetukset',
    description:
      'Kuljetus A:sta B:hen ilman stressiä – kaatopaikka-ajot, vanhan tavaran haku, huonekalujen siirrot tai muut yksittäiset kuljetustarpeet. Nopea, edullinen ja luotettava. Soita ja sovitaan.',
    bgClass: 'hover:bg-primary/5',
  },
];

export default serviceData;
