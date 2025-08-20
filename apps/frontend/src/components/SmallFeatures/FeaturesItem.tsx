import Image from "next/image";
import { Feature } from "@/types/feature";
import SlideOnReveal from "@/components/SlideOnReveal";

export default function FeaturesItem({ feature }: { feature: Feature }) {
  return (
    <>
      <SlideOnReveal
        delay={0.3}
        className="group flex gap-5 md:w-[45%] lg:w-1/3 xl:gap-7.5"
      >
        <div
          className={`flex h-21 w-21 shrink-0 items-center justify-center rounded-full transition-colors duration-300 group-hover:bg-primary/20 ${feature.bgClass}`}
        >
          <Image src={feature.icon} alt={"Icon"} width={36} height={36} className="transition-transform duration-300 group-hover:scale-105" />
        </div>
        <div>
          <h4 className="mb-2.5 text-xl font-medium text-black transition-colors duration-300 group-hover:text-primary dark:text-white md:text-title-sm">
            {feature.title}
          </h4>
          <p>{feature.description}</p>
        </div>
      </SlideOnReveal>
    </>
  );
}
