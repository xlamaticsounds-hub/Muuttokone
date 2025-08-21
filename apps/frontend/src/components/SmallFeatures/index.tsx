import featuresData from '@/components/SmallFeatures/featuresData';
import FeaturesItem from '@/components/SmallFeatures/FeaturesItem';
import { Feature } from '@/types/feature';

export default function SmallFeatures() {
  return (
    <>
      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="relative rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur md:p-8 dark:border-white/10 dark:bg-white/5 dark:ring-white/5">
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-white/60 to-white/30 dark:from-white/[0.06] dark:to-white/[0.03]" />
            <div className="flex flex-wrap items-stretch justify-center gap-7.5 lg:flex-nowrap lg:justify-between lg:gap-10 xl:gap-16">
              {featuresData.map((feature: Feature, index) => (
                <FeaturesItem feature={feature} key={index} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
