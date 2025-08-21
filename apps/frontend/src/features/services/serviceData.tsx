import { Service } from '@/types/service';

const serviceData: Service[] = [
  {
    icon: '/icons/truck.webp',
    title: 'Kotimuutto',
    description:
      'Ammattitaitoinen ja luotettava kotimuuttopalvelu. Hoidamme kaiken pakkauksesta purkuun ja huonekalujen asennukseen. Stressitön muutto kotoa kotiin.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/boxguy.webp',
    title: 'Yritysmuutto',
    description:
      'Sujuva toimistomuutto minimaalisella häiriöllä liiketoimintaasi. Erikoisosaamista IT-laitteista, arkistoista ja toimistokalusteista.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/tape.webp',
    title: 'Pakkauspalvelut',
    description:
      'Huolellinen ja turvallinen pakkaus ammattilaismateriaalein. Huonekalujen purku ja kokoaminen sekä kuljetus uuteen kotiin.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/logo3.webp',
    title: 'Varastointipalvelut',
    description:
      'Turvallisia ja kuivia varastotiloja lyhyt- ja pitkäaikaiseen säilytykseen. Joustavia ratkaisuja väliaikaistoimistolle.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/kello.webp',
    title: 'Muuttosiivous',
    description:
      'Perusteellinen loppu- ja alkusiivous ammattilaisilta. Säästä aikaa ja vaivaa - keskity muuttoon, me hoidamme siivouksen.',
    bgClass: 'hover:bg-primary/5',
  },
  {
    icon: '/icons/turva.webp',
    title: 'Erikoiskuljetukset',
    description:
      'Pianot, taideteokset, antiikkia ja muut arvokkaat esineet ammattitaitoisesti. Kokeneet kuljetusasiantuntijat ja erikoisvälineet.',
    bgClass: 'hover:bg-primary/5',
  },
];

export default serviceData;
