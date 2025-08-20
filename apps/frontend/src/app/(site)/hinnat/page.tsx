import type { Metadata } from "next";
import Pricing from "@/components/Pricing";

export const metadata: Metadata = {
  title: "Hinnat – Muuttokone.fi",
  description: "Läpinäkyvä hinnoittelu. Katso hinnat ja pyydä maksuton tarjous.",
};

export default function Page() {
  return (
    <section>
      <Pricing />
    </section>
  );
}
