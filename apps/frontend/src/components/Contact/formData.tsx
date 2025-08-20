import { siteConfig } from "@/config/site";

const formData = [
  {
    label: "Koko nimi",
    type: "text",
    name: "name",
    placeholder: "Matti Virtanen",
  },
  {
    label: "Sähköpostiosoite",
    type: "email",
    name: "email",
    placeholder: siteConfig.contact.email,
  },
  {
    label: "Puhelinnumero",
    type: "text",
    name: "phone",
    placeholder: siteConfig.contact.phone.display,
  },
  {
    label: "Aihe",
    type: "email",
    name: "subject",
    placeholder: "Tarjouspyyntö kotimuuttoon",
  },
  {
    label: "Viesti",
    type: "message",
    name: "message",
    placeholder: "Kerro meille muuttosi yksityiskohdista...",
  },
];

export default formData;
