import Graphics from '@/features/contact/Graphics';
import SectionTitle from '@/components/SectionTitle';
import ContactInfoCard from '@/features/contact/ContactInfoCard';
import ContactFormBox from '@/features/contact/ContactFormBox';

const Contact = () => {
  return (
    <>
      <section
        id="support"
        className="bg-whiter dark:bg-blacksection relative overflow-hidden py-20 lg:py-25 xl:py-30"
      >
        <Graphics />

        <SectionTitle
          title="Ota yhteyttä"
          subtitle="Saat meiltä maksuttoman kartoituksen ja tarjouksen nopeasti. Kerro meille muuttosi yksityiskohdat, niin autamme sinua parhaalla mahdollisella tavalla."
        />

        <div className="relative z-10 mx-auto mt-12.5 max-w-1390 px-4 md:px-8 lg:mt-20 xl:px-21">
          <div className="flex flex-col-reverse flex-wrap gap-7.5 md:flex-row md:flex-nowrap md:justify-between xl:gap-10">
            <ContactInfoCard />
            <ContactFormBox />
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
