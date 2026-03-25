import { Feature } from '@/types/feature';

const featuresData: Feature[] = [
  {
    icon: '/icons/turva.webp',
    title: 'Luotettava ja turvallinen',
    description: 'Käsittelemme tavaroitasi huolellisesti ja vakuutuksemme kattavat mahdolliset vahingot.',
    bgClass: 'bg-primary/10',
  },
  {
    icon: '/icons/kello.webp',
    title: 'Täsmällinen ja nopea',
    description: 'Pysymme sovitussa aikataulussa ja työskentelemme tehokkaasti ilman turhaa odottelua.',
    bgClass: 'bg-secondary/20',
  },
  {
    icon: '/icons/tape.webp',
    title: 'Ei piilokuluja',
    description: 'Kiinteä hinnoittelu tai selkeä tuntiveloitus. Tiedät kustannukset etukäteen.',
    bgClass: 'bg-primary/10',
  },
];

export default featuresData;
