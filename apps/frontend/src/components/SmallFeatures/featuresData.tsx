import { Feature } from "@/types/feature";

// Use Muuttokone brand icons for a consistent look
// All images live under public/images/muuttokone/webp
const featuresData: Feature[] = [
  {
    icon: "/images/muuttokone/webp/turva.webp",
    title: "Vakuutettu ja turvallinen",
    description:
      "Täysi vastuuvakuutus ja SMPY-jäsenyys takaavat huolettoman muuton.",
    bgClass: "bg-primary/10",
  },
  {
    icon: "/images/muuttokone/webp/kello.webp",
    title: "Täsmällinen ja nopea",
    description:
      "Saavumme silloin kun on sovittu ja hoidamme työn tehokkaasti.",
    bgClass: "bg-secondary/20",
  },
  {
    icon: "/images/muuttokone/webp/tape.webp",
    title: "Ei piilokuluja",
    description:
      "Rehellinen hinnoittelu – näet kulut etukäteen ilman yllätyksiä.",
    bgClass: "bg-primary/10",
  },
];

export default featuresData;
