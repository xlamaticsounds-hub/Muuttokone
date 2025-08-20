import type { Metadata } from "next";
import Contact from "@/components/Contact";

export const metadata: Metadata = {
  title: "Yhteystiedot – Muuttokone.fi",
  description: "Ota yhteyttä – autamme mielellämme. Soita, lähetä sähköpostia tai täytä lomake.",
};

export default function Page() {
  return <Contact />;
}
