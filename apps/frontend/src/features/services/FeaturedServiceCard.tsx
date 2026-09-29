import Link from 'next/link';
import { Wrench, ArrowRight } from 'lucide-react';
import type { Service } from '@/types/service';

// Leveä korostuskortti palvelulistan yläpuolelle (Service.featured) — nostaa uuden tai
// tärkeän palvelun esiin niin, ettei se huku samannäköisten korttien joukkoon.
export default function FeaturedServiceCard({
  service,
  badgeLabel,
  readMoreLabel,
}: {
  service: Service;
  badgeLabel: string;
  readMoreLabel: string;
}) {
  const content = (
    <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="bg-primary flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg sm:h-24 sm:w-24">
        <Wrench className="h-10 w-10 sm:h-12 sm:w-12" />
      </div>

      <div className="flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h3 className="text-2xl font-bold text-black/90 dark:text-white">{service.title}</h3>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {badgeLabel}
          </span>
        </div>
        <p className="mb-4 max-w-3xl leading-relaxed text-black/70 dark:text-white/70">{service.description}</p>
        {service.highlights && service.highlights.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {service.highlights.map((highlight) => (
              <li
                key={highlight}
                className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70 dark:border-white/10 dark:bg-slate-800 dark:text-white/70"
              >
                {highlight}
              </li>
            ))}
          </ul>
        )}
      </div>

      {service.href && (
        <span className="bg-primary group-hover:bg-secondary inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full px-6 py-3 font-semibold text-white transition-colors sm:self-center">
          {readMoreLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      )}
    </div>
  );

  const className =
    'group relative mb-6 block overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-white to-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl sm:p-8 dark:from-primary/20 dark:via-slate-900 dark:to-slate-900';

  return service.href ? (
    <Link href={service.href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
