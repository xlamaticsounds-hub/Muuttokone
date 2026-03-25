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
    title: 'Varastointi',
    description:
      'Lämmin, valvottu varastotila muuton tai remontin ajaksi. Lyhyt- ja pitkäaikainen varastointi – maksa vain käyttämäsi aika.',
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
    title: 'Erikoiskuljetukset',
    description:
      'Pianot, taideteokset, antiikit ja raskaat esineet vaativat erityisosaamista. Meillä on välineet ja kokemus haastaviin siirtoihin.',
    bgClass: 'hover:bg-primary/5',
  },
];

export default serviceData;
