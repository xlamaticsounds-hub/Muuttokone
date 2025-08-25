'use client';

import Link from 'next/link';
import { useSiteConfig } from '@/app/context/SiteConfigContext';

export default function FooterBottom() {
  const siteConfig = useSiteConfig();
  return (
    <>
      <div className="border-strokedark dark:border-stroke flex flex-col flex-wrap items-center justify-center gap-5 border-t py-7.5 lg:flex-row lg:justify-between lg:gap-0">
        <div className="animate_top">
          <ul className="flex items-center gap-8">
            <li>
              <button type="button" className="hover:text-primary bg-transparent border-none p-0 m-0 cursor-pointer underline">
                English
              </button>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-primary">
                Privacy Policy
              </Link>
            </li>
            <li>
              <a href="mailto:info@muuttokone.fi" className="hover:text-primary">
                Support
              </a>
            </li>
          </ul>
        </div>

        <div className="animate_top">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.brand.name}. All rights reserved
          </p>
        </div>
      </div>
    </>
  );
}
