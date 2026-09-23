import type { ProcessStep } from '@/components/ProcessSteps';

const businessProcessSteps: ProcessStep[] = [
  {
    title: 'Kartoitus',
    desc: 'Käymme tilat läpi ja arvioimme muuton laajuuden veloituksetta.',
    icon: 'ClipboardList',
    highlight: true,
    href: '#tarjous',
  },
  {
    title: 'Suunnitelma',
    desc: 'Sovimme aikataulun, joka minimoi vaikutuksen liiketoimintaanne — tarvittaessa iltaisin tai viikonloppuisin.',
    icon: 'CalendarRange',
  },
  {
    title: 'Toteutus',
    desc: 'Tiimimme hoitaa pakkauksen, kuljetuksen ja kalusteiden/IT-laitteiden asennuksen sovitusti.',
    icon: 'Truck',
  },
  {
    title: 'Käyttöönotto',
    desc: 'Uudet tilat ovat valmiit sovittuna päivänä — työpisteet paikoillaan, valmiina töihin.',
    icon: 'CheckCircle2',
  },
];

export default businessProcessSteps;
