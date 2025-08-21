import { Service } from '@/types/service';
import Image from 'next/image';

interface ServiceItemProps {
  service: Service;
  index?: number;
}

export default function ServiceItem({ service, index = 0 }: ServiceItemProps) {
  // Fallback to available local icons if service.icon is missing
  const fallbackIcons = [
    '/images/muuttokone/webp/boxguy.webp',
    '/images/muuttokone/webp/truck.webp',
    '/images/muuttokone/webp/turva.webp',
    '/images/muuttokone/webp/kello.webp',
    '/images/muuttokone/webp/tape.webp',
    '/images/muuttokone/webp/logo3.webp',
  ];
  const iconSrc = service.icon || fallbackIcons[index % fallbackIcons.length];

  return (
    <div
      className={`group border-stroke/10 dark:border-stroke/10 relative overflow-hidden rounded-2xl border bg-white p-8 text-center shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:bg-[#0f1115] dark:ring-white/5 ${
        service.bgClass || ''
      }`}
    >
      <div className="relative z-10 flex flex-col items-center">
        <div className="bg-primary/10 mb-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl lg:h-20 lg:w-20">
          <Image
            src={iconSrc}
            alt={service.title}
            width={56}
            height={56}
            className="h-12 w-12 object-contain lg:h-16 lg:w-16"
          />
        </div>

        <h3 className="mb-3 text-xl font-semibold text-black dark:text-white">{service.title}</h3>

        <p className="text-body leading-relaxed">{service.description}</p>
      </div>

      {/* Subtle background accents */}
      <div
        aria-hidden
        className="bg-primary/5 group-hover:bg-primary/10 absolute -top-6 -right-4 h-24 w-24 rounded-full blur-md transition-all duration-300"
      />
      <div
        aria-hidden
        className="absolute bottom-[-30px] left-[-30px] h-24 w-24 rounded-full bg-blue-500/5 blur-md transition-all duration-300 group-hover:bg-blue-500/10"
      />
    </div>
  );
}
