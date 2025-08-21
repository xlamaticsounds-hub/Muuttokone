const formData = [
  {
    label: 'Nimi',
    type: 'text',
    name: 'name',
    placeholder: 'Nimesi',
    autocomplete: 'name',
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
