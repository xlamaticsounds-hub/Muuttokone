import SectionTitle from '@/components/SectionTitle';
import TestimonialSlider from '@/components/Testimonials/TestimonialSlider';

export default function Testimonials() {
  return (
    <>
      <section className="overflow-hidden pb-20 lg:pb-25 xl:pb-30">
        <SectionTitle
          title="Asiakkaiden kokemuksia"
          subtitle="Tuhannet tyytyväiset asiakkaat ovat luottaneet meihin muutossaan. Lue, mitä asiakkaamme sanovat palveluistamme ja ammattitaidostamme."
        />

        <div className="mx-auto mt-12.5 mb-20 max-w-1390 px-4 md:px-8 xl:mt-17.5 xl:px-21">
          <TestimonialSlider />
        </div>
      </section>
    </>
  );
}
