'use client';

import contactData from '@/features/contact/contactData';
import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/i18n/useT';
import { contactDictionary } from '@/i18n/homeDictionary';
import { Instagram } from 'lucide-react';
import { SOCIAL_PROFILES } from '@/components/SEO/organization';

const socialLinkClass =
  'group flex h-10 w-10 items-center justify-center rounded-full bg-gray-2 text-primary duration-300 hover:bg-primary hover:text-white dark:bg-black';

export default function ContactInfoCard() {
  const t = useT(contactDictionary);
  // Kuvitukset: public/icons/yhteystiedot/
  const icons: Record<string, string> = {
    Sähköposti: '/icons/yhteystiedot/sahkoposti.png',
    Puhelinnumero: '/icons/yhteystiedot/puhelin.png',
    Aukioloajat: '/icons/yhteystiedot/aukiolo.png',
  };

  return (
    <div className="animate_top w-full rounded-2xl bg-white p-7.5 shadow-solid-8 md:w-[38%] lg:w-[32%] xl:p-12.5 dark:bg-blacksection dark:border dark:border-strokedark">
      <div className="mb-12">
        <h3 className="mb-8 text-2xl font-semibold text-black dark:text-white">
          {t('Yhteystiedot')}
        </h3>
        
        <div className="flex flex-col gap-8">
          {contactData.map((item, index) => (
            <div className="flex items-start gap-4" key={index}>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
                {icons[item.title] && <Image src={icons[item.title]} alt="" width={80} height={80} className="h-10 w-10 object-contain" />}
              </div>
              <div>
                <h4 className="mb-1 text-lg font-medium text-black dark:text-white">
                  {t(item.title)}
                </h4>
                <p className="text-body-color dark:text-body-color-dark">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="block h-px w-full bg-stroke dark:bg-strokedark mb-10"></span>

      <div>
        <h4 className="mb-6 text-lg font-medium text-black dark:text-white">
          {t('Sosiaalinen media')}
        </h4>
        <ul className="flex items-center gap-4">
          <li>
            <Link
              aria-label="Contact Link for Facebook"
              href={SOCIAL_PROFILES.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-gray-2 text-primary duration-300 hover:bg-primary hover:text-white dark:bg-black"
            >
              <svg
                className="fill-current"
                width="11"
                height="20"
                viewBox="0 0 11 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.83366 11.3752H9.12533L10.042 7.7085H6.83366V5.87516C6.83366 4.931 6.83366 4.04183 8.667 4.04183H10.042V0.96183C9.74316 0.922413 8.61475 0.833496 7.42308 0.833496C4.93433 0.833496 3.16699 2.35241 3.16699 5.14183V7.7085H0.416992V11.3752H3.16699V19.1668H6.83366V11.3752Z"
                  fill=""
                />
              </svg>
            </Link>
          </li>
          <li>
            <Link aria-label="Muuttokone Instagramissa" href={SOCIAL_PROFILES.instagram} target="_blank" rel="noopener noreferrer" className={socialLinkClass}>
              <Instagram className="h-5 w-5" aria-hidden />
            </Link>
          </li>
          <li>
            <Link aria-label="Muuttokone TikTokissa" href={SOCIAL_PROFILES.tiktok} target="_blank" rel="noopener noreferrer" className={socialLinkClass}>
              <svg className="h-[22px] w-[22px] fill-current" viewBox="0 0 24 24" aria-hidden>
                <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
              </svg>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
