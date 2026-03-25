import { siteConfig } from '@/config/site';

export default function MobileStickyCTA() {
  return (
    <div className="fixed bottom-0 left-0 z-999 w-full bg-white px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:hidden dark:bg-blacksection border-t border-gray-100 dark:border-gray-800">
      <div className="flex gap-4">
        <a 
          href={`tel:${siteConfig.contact.phone.tel}`}
          className="flex flex-1 items-center justify-center rounded-full border border-primary bg-white py-3 font-semibold text-primary transition-colors hover:bg-gray-50 dark:bg-transparent dark:hover:bg-white/5"
        >
          Soita
        </a>
        <a 
          href="/muuttolaskuri"
          className="flex flex-1 items-center justify-center rounded-full bg-primary py-3 font-semibold text-white shadow-1 transition-colors hover:bg-primary/90"
        >
          Pyydä tarjous
        </a>
      </div>
    </div>
  );
}
