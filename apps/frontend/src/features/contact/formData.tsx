const formData = [
  {
    label: 'Nimi',
    type: 'text',
    name: 'name',
    placeholder: 'Nimesi',
    autocomplete: 'name',
  },
  {
    label: 'Sähköposti',
    type: 'email',
    name: 'email',
    placeholder: 'sähköposti@esimerkki.fi',
    autocomplete: 'email',
  },
  {
    label: 'Puhelinnumero',
    type: 'tel',
    name: 'phone',
    placeholder: '+358 40 123 4567',
    autocomplete: 'tel',
  },
  {
    label: 'Viesti',
    type: 'message',
    name: 'message',
    placeholder: 'Kerro meille kuinka voimme auttaa...',
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
