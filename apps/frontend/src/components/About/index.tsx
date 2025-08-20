import Graphics from "@/components/About/Graphics";
import AboutContent from "@/components/About/AboutContent";

export default function About() {
  return (
    <>
      <section
        id="about"
        className="overflow-hidden py-16 lg:py-24 xl:py-28 2xl:py-32"
      >
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="flex flex-col items-center gap-10 md:flex-row md:items-start xl:gap-24">
            <Graphics />
            <AboutContent />
          </div>
        </div>
      </section>
    </>
  );
}
