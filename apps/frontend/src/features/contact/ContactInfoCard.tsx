'use client';

import contactData from '@/features/contact/contactData';
import Link from 'next/link';
import { useT } from '@/i18n/useT';
import { contactDictionary } from '@/i18n/homeDictionary';

export default function ContactInfoCard() {
  const t = useT(contactDictionary);
  const getIcon = (title: string) => {
    switch (title) {
      case 'Sähköposti':
        return (
          <svg
            className="fill-current"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19.5 3H4.5C3.107 3 2 4.107 2 5.5V18.5C2 19.893 3.107 21 4.5 21H19.5C20.893 21 22 19.893 22 18.5V5.5C22 4.107 20.893 3 19.5 3ZM19.5 19.5H4.5C3.949 19.5 3.5 19.051 3.5 18.5V5.5C3.5 4.949 3.949 4.5 4.5 4.5H19.5C20.051 4.5 20.5 4.949 20.5 5.5V18.5C20.5 19.051 20.051 19.5 19.5 19.5Z"
              fill=""
            />
            <path
              d="M12 13.5L4.5 6L5.5 5L12 11.5L18.5 5L19.5 6L12 13.5Z"
              fill=""
            />
          </svg>
        );
      case 'Puhelinnumero':
        return (
          <svg
            className="fill-current"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1.5 4.50002C1.50003 3.39545 2.39546 2.50002 3.5 2.50002H6.50002C6.96349 2.50035 7.4116 2.66858 7.76634 2.9754C8.12108 3.28221 8.35999 3.70823 8.44169 4.17918L9.20002 8.34585C9.28292 8.80492 9.17647 9.27833 8.90483 9.65863C8.6332 10.0389 8.22014 10.2925 7.75836 10.3609L5.65169 10.6692C6.54452 13.6263 8.86591 15.9477 11.8234 16.8409L12.1317 14.7342C12.2001 14.2724 12.4536 13.8593 12.8339 13.5877C13.2142 13.3161 13.6876 13.2096 14.1467 13.2925L18.3134 14.0509C18.7843 14.1326 19.2103 14.3715 19.5172 14.7262C19.824 15.0809 19.9922 15.529 19.9925 15.9925V18.9925C19.9925 20.0971 19.0971 20.9925 17.9925 20.9925C8.88372 20.9925 1.5 13.6088 1.5 4.50002Z"
              fill=""
            />
          </svg>
        );
      case 'Aukioloajat':
        return (
          <svg
            className="fill-current"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 6V12L16 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      default:
        return null;
    }
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-stroke bg-gray-2 text-primary dark:border-strokedark dark:bg-black">
                {getIcon(item.title)}
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
