import { Service } from '@/types/service';

const serviceData: Service[] = [
  {
    icon: '/icons/truck.webp',
    title: 'Kotimuutto',
    description:
      'Ovelta ovelle -palvelu, jossa huolehdimme kaikesta kantamisesta ja kuljetuksesta. Selkeä hinnoittelu ilman piilokuluja – tiedät etukäteen mitä maksat.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/boxguy.webp',
    title: 'Yritysmuutto',
    description:
      'Minimoi liiketoiminnan keskeytykset: IT-laitteet, kalusteet ja arkistot siirtyvät aikataulun mukaan. Iltaisin ja viikonloppuisin tarvittaessa.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/tape.webp',
    title: 'Pakkauspalvelu',
    description:
      'Säästä tunteja ja vältä vahingot: ammattilaiset pakkaavat keittiöt, lasit ja hauraat esineet huolella. Materiaali ja merkinnät sisältyvät.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/logo3.webp',
    title: 'Kuolinpesätyhjennnykset',
    description:
      'Hoidamme kuolinpesän tyhjennyksen ammattitaidolla ja hienovaraisesti. Kierrätetään, lahjoitetaan tai viedään kierrätyskeskukseen – kaikki sovitun mukaan. Helpotamme läheisen taakkaa vaikeana hetkenä.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/kello.webp',
    title: 'Muuttosiivous',
    description:
      'Asunnon luovutussiivous takuulla: vanhan kodin jättäminen putipuhtaaksi vuokranantajalle tai ostajalle. Yksi paketti, valmis kerralla.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/turva.webp',
    title: 'Kuljetukset',
    description:
      'Kuljetus A:sta B:hen ilman stressiä – kaatopaikka-ajot, vanhan tavaran haku, huonekalujen siirrot tai muut yksittäiset kuljetustarpeet. Nopea, edullinen ja luotettava. Soita ja sovitaan.',
    bgClass: 'hover:bg-primary/5',
  },
];

export default serviceData;
