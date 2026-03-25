import contactData from '@/features/contact/contactData';
import Link from 'next/link';

export default function ContactInfoCard() {
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
          Yhteystiedot
        </h3>
        
        <div className="flex flex-col gap-8">
          {contactData.map((item, index) => (
            <div className="flex items-start gap-4" key={index}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-stroke bg-gray-2 text-primary dark:border-strokedark dark:bg-black">
                {getIcon(item.title)}
              </div>
              <div>
                <h4 className="mb-1 text-lg font-medium text-black dark:text-white">
                  {item.title}
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
          Sosiaalinen media
        </h4>
        <ul className="flex items-center gap-4">
          <li>
            <Link
              aria-label="Contact Link for Facebook"
              href="https://facebook.com/muuttokone"
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
            <Link
              aria-label="Contact Link for Twitter"
              href="https://twitter.com/muuttokone"
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-gray-2 text-primary duration-300 hover:bg-primary hover:text-white dark:bg-black"
            >
              <svg
                className="fill-current"
                width="20"
                height="16"
                viewBox="0 0 20 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.3153 2.18484C18.6155 2.4944 17.8733 2.6977 17.1134 2.78801C17.9144 2.30899 18.5138 1.55511 18.8001 0.666844C18.0484 1.11418 17.2244 1.42768 16.3654 1.59726C15.7885 0.979958 15.0238 0.57056 14.1901 0.432713C13.3565 0.294866 12.5007 0.436294 11.7558 0.835009C11.0108 1.23372 10.4185 1.86739 10.0708 2.63749C9.72313 3.40759 9.63963 4.27098 9.83327 5.09343C8.30896 5.01703 6.81775 4.62091 5.45645 3.93079C4.09516 3.24067 2.89423 2.27197 1.93161 1.08759C1.59088 1.67284 1.41182 2.33814 1.41278 3.01534C1.41278 4.34451 2.08928 5.51876 3.11778 6.20626C2.50912 6.1871 1.91386 6.02273 1.38161 5.72685V5.77451C1.38179 6.65974 1.68811 7.51766 2.24864 8.20282C2.80916 8.88797 3.58938 9.3582 4.45703 9.53376C3.89201 9.68688 3.29956 9.70945 2.72453 9.59976C2.96915 10.3617 3.44595 11.0281 4.08815 11.5056C4.73035 11.9831 5.50581 12.2478 6.30594 12.2627C5.51072 12.8872 4.60019 13.3489 3.62642 13.6213C2.65264 13.8938 1.63473 13.9716 0.630859 13.8503C2.38325 14.9773 4.4232 15.5756 6.50669 15.5737C13.5586 15.5737 17.415 9.73176 17.415 4.66535C17.415 4.50035 17.4104 4.33351 17.4031 4.17035C18.1537 3.62783 18.8016 2.95578 19.3162 2.18576L19.3153 2.18484Z"
                  fill=""
                />
              </svg>
            </Link>
          </li>
          <li>
            <Link
              aria-label="Contact Link for Linkedin"
              href="https://linkedin.com/company/muuttokone"
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-gray-2 text-primary duration-300 hover:bg-primary hover:text-white dark:bg-black"
            >
              <svg
                className="fill-current"
                width="19"
                height="18"
                viewBox="0 0 19 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.36198 2.58327C4.36174 3.0695 4.16835 3.53572 3.82436 3.87937C3.48037 4.22301 3.01396 4.41593 2.52773 4.41569C2.0415 4.41545 1.57528 4.22206 1.23164 3.87807C0.887991 3.53408 0.69507 3.06767 0.695313 2.58144C0.695556 2.09521 0.888943 1.62899 1.23293 1.28535C1.57692 0.941701 2.04333 0.748781 2.52956 0.749024C3.01579 0.749267 3.48201 0.942654 3.82566 1.28664C4.1693 1.63063 4.36222 2.09704 4.36198 2.58327ZM4.41698 5.77327H0.750313V17.2499H4.41698V5.77327ZM10.2103 5.77327H6.56198V17.2499H10.1736V11.2274C10.1736 7.87244 14.5461 7.56077 14.5461 11.2274V17.2499H18.167V9.98077C18.167 4.32494 11.6953 4.53577 10.1736 7.31327L10.2103 5.77327Z"
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
