import Graphics from '@/components/HeroArea/Graphics';
import HeroContent from '@/components/HeroArea/HeroContent';

export default function HeroArea() {
  return (
    <>
      <section id="home" className="relative overflow-visible py-10 md:overflow-hidden md:py-25">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="grid items-center gap-8 md:grid-cols-12 md:gap-12 lg:gap-16">
            <div className="md:col-span-7">
              <HeroContent />
            </div>
            <div className="md:col-span-5">
              <Graphics />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
