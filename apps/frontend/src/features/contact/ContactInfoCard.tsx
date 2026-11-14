'use client';

import contactData from '@/features/contact/contactData';
import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/i18n/useT';
import { contactDictionary } from '@/i18n/homeDictionary';

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
              href="https://www.facebook.com/profile.php?id=61590814036560"
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
        </ul>
      </div>
    </div>
  );
}
