'use client';

import { useSiteConfig } from '@/app/context/SiteConfigContext';
import Link from 'next/link';

export default function FooterBottom() {
  const siteConfig = useSiteConfig();
  return (
    <>
      <div className="border-strokedark dark:border-stroke flex items-center justify-center border-t py-4">
        <div className="animate_top">
          <p>
            &copy; {new Date().getFullYear()}{' '}
            <Link
              href="https://muuttokone.fi"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Muuttokone.fi
            </Link>
            . Kaikki oikeudet pidätetään.
          </p>
        </div>
      </div>
    </>
  );
}
