import Graphics from "@/components/Contact/Graphics";
import SectionTitle from "@/components/SectionTitle";
import ContactInfoCard from "@/components/Contact/ContactInfoCard";
import ContactFormBox from "@/components/Contact/ContactFormBox";

const Contact = ({ sectionClasses }: any) => {
  return (
    <>
      <section
        id="support"
        className="relative overflow-hidden bg-whiter py-20 dark:bg-blacksection lg:py-25 xl:py-30"
      >
        <Graphics />

         <SectionTitle
          title="Ota yhteyttä"
          subtitle="Saat meiltä maksuttoman kartoituksen ja tarjouksen nopeasti. Kerro meille muuttosi yksityiskohdat, niin autamme sinua parhaalla mahdollisella tavalla."
        />

  <div className="relative z-10 mx-auto mt-12.5 max-w-1390 px-4 md:px-8 xl:px-21 lg:mt-20">
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
