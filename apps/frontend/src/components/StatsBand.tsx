import React from 'react';

const stats = [
  { label: '4.9/5 asiakastyytyväisyys', value: 'stars', detail: 'Keskiarvo viimeisen 12 kk aikana' },
  { label: '3 200+ muuttoa', value: '3200+', detail: 'Kotitaloudet ja yritykset' },
  { label: '98 % aikataulussa', value: '98 %', detail: 'Toimitukset sovitussa ajassa' },
];

export default function StatsBand() {
  return (
    <section className="relative z-20 -mt-[50px] px-4 md:-mt-[66px] lg:-mt-[82px]">
      <div className="mx-auto max-w-1390">
        <div className="grid min-h-[180px] gap-4 rounded-3xl bg-white/80 p-6 shadow-lg ring-1 ring-black/5 backdrop-blur dark:bg-slate-900/80 dark:ring-white/5 sm:grid-cols-3 md:p-8">
          {stats.map((item) => (
            <div key={item.label} className="text-center">
              <div className="min-h-[40px] text-3xl font-bold text-primary sm:text-4xl">
                {item.value === 'stars' ? (
                  <div className="flex items-center justify-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                ) : (
                  item.value
                )}
              </div>
              <div className="mt-2 text-xl font-bold text-black/90 dark:text-white/95">{item.label}</div>
              <div className="mt-0.5 text-sm font-medium text-black/65 dark:text-white/65">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
