import { siteConfig } from '@/config/site';

const formData = [
  {
    label: 'Koko nimi',
    type: 'text',
    name: 'name',
    placeholder: 'Matti Virtanen',
    autocomplete: 'name',
  },
  {
    label: 'Sähköpostiosoite',
    type: 'email',
    name: 'email',
    placeholder: siteConfig.contact.email,
    autocomplete: 'email',
  },
  {
    label: 'Puhelinnumero',
    type: 'tel',
    name: 'phone',
    placeholder: siteConfig.contact.phone.display,
    autocomplete: 'tel',
  },
  {
    label: 'Aihe',
    type: 'text',
    name: 'subject',
    placeholder: 'Tarjouspyyntö kotimuuttoon',
    autocomplete: 'off', // Subject is form-specific
  },
  {
    label: 'Viesti',
    type: 'message',
    name: 'message',
    placeholder: 'Kerro meille muuttosi yksityiskohdista...',
    autocomplete: 'off', // Message is form-specific
  },
];

// Type for form field data
export type ContactFormField = {
  label: string;
  type: string;
  name: string;
  placeholder: string;
  autocomplete?: string;
};

export default formData;
