import { siteConfig } from '@/config/site';

interface ContactData {
  title: string;
  subtitle: string;
}

const contactData: ContactData[] = [
  {
    title: 'Sähköposti',
    subtitle: siteConfig.contact.email,
  },
  {
    title: 'Puhelinnumero',
    subtitle: siteConfig.contact.phone.display,
  },
  {
    title: 'Aukioloajat',
    subtitle: siteConfig.contact.openingHours,
  },
];

export default contactData;
