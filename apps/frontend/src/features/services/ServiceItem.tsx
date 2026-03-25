import { Service } from '@/types/service';
import Image from 'next/image';

interface ServiceItemProps {
  service: Service;
  index?: number;
}

export default function ServiceItem({ service, index = 0 }: ServiceItemProps) {
  // Fallback to available local icons if service.icon is missing
  const fallbackIcons = [
    '/icons/boxguy.webp',
    '/icons/truck.webp',
    '/icons/turva.webp',
    '/icons/kello.webp',
    '/icons/tape.webp',
    '/icons/logo3.webp',
  ];
  const iconSrc = service.icon || fallbackIcons[index % fallbackIcons.length];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-black/5 bg-white/90 p-7 shadow-sm ring-1 ring-black/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-primary/30 dark:border-white/10 dark:bg-slate-900/80 dark:ring-white/5 ${
        service.bgClass || ''
      }`}
    >
      <div className="relative z-10">
        <div className="mb-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
          <Image
            src={iconSrc}
            alt={service.title}
            width={48}
            height={48}
            className="h-11 w-11 object-contain"
          />
        </div>

        <h3 className="mb-3 text-xl font-bold text-black/90 dark:text-white">{service.title}</h3>

        <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">{service.description}</p>
      </div>

      {/* Gradient accent */}
      <div
        aria-hidden
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-all duration-300 group-hover:bg-primary/10"
      />
    </div>
  );
}
