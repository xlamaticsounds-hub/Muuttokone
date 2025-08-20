import Graphics from "@/components/Pricing/Graphics";
import SectionTitle from "@/components/SectionTitle";
import PricingContainer from "@/components/Pricing/PricingContainer";

export default function Pricing() {
  return (
    <>
      <section id="pricing" className="relative overflow-hidden bg-whiter py-20 dark:bg-blacksection lg:py-25 xl:py-30">
        <Graphics />

        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <SectionTitle
            title="Selkeät ja edulliset hinnat"
            subtitle="Tarjoamme läpinäkyvän hinnoittelun ilman piilokustannuksia. Saat aina etukäteen selkeän tarjouksen, joka sisältää kaikki kustannukset."
          />

          <PricingContainer />
        </div>
      </section>
    </>
  );
}
