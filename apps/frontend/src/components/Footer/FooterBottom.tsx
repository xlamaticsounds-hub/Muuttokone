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
              <Link href="/language" className="hover:text-primary">
                English
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="hover:text-primary">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-primary">
                Support
              </Link>
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
