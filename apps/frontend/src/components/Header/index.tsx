'use client';

import React, { useEffect, useState } from 'react';
import { onScroll } from '@/lib/utils';
// ...existing code...
import Link from 'next/link';
import Image from 'next/image';
import { useSiteConfig } from '@/app/context/SiteConfigContext';
import menuData from '@/components/Header/menuData';

const Header = () => {
  const siteConfig = useSiteConfig();
  useEffect(() => {
    if (window.location.pathname === '/') {
      window.addEventListener('scroll', onScroll);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Navbar toggle
  const [navbarOpen, setNavbarOpen] = useState(false);
  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  // const [searchModalOpen, setSearchModalOpen] = useState(false);

  const closeMenu = () => {
    setNavbarOpen(false);
  };

  const [updatedMenuData, setUpdatedMenuData] = useState(menuData);

  useEffect(() => {
    // No dynamic menu rewrites needed now that Blog is removed
    setUpdatedMenuData(menuData);
  }, []);

  return (
    <>
      <header
        className={`navbar fixed top-0 left-0 z-999 w-full bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur md:backdrop-blur-sm dark:bg-black/90`}
      >
        <div className="relative mx-auto max-w-1390 px-4 md:px-8 xl:px-21">
          <div className="flex items-center justify-between">
            <div className="block py-4 lg:py-0">
              <Link href="/" className="block h-[44px] w-[130px] max-w-[145px] sm:max-w-[180px]">
                {/* Use webp (likely has transparent background) for light mode to avoid mismatched image bg */}
                <Image
                  width={130}
                  height={44}
                  src={'/images/logo/logo.webp'}
                  alt="Logo"
                  className="block dark:hidden"
                  priority
                  sizes="130px"
                />
                {/* Keep white logo for dark mode (SVG or PNG) */}
                <Image
                  width={130}
                  height={44}
                  src={'/images/logo/logo-white.png'}
                  alt="Logo"
                  className="hidden dark:block"
                  priority
                  sizes="130px"
                />
              </Link>
            </div>

            <div className="absolute top-1/2 right-4 z-50 flex -translate-y-1/2 items-center gap-2 lg:hidden">
              <a
                href={`tel:${siteConfig.contact.phone.tel}`}
                className="border-primary text-primary flex h-9 items-center justify-center rounded-full border px-3.5 text-sm font-semibold sm:hidden"
              >
                Soita
              </a>
              <button
                onClick={navbarToggleHandler}
                className="navbarOpen flex h-10 w-10 flex-col items-center justify-center space-y-[6px] font-bold"
                aria-label="navbarOpen"
                name="navbarOpen"
              >
                <span className="block h-[2px] w-7 bg-black dark:bg-white"></span>
                <span className="block h-[2px] w-7 bg-black dark:bg-white"></span>
                <span className="block h-[2px] w-7 bg-black dark:bg-white"></span>
              </button>
            </div>

            <div
              className={`${navbarOpen ? '' : 'hidden'} menu-wrapper relative justify-between lg:flex`}
            >
              <button
                onClick={() => setNavbarOpen(false)}
                className="navbarClose fixed top-10 right-10 z-9999 flex h-10 w-10 flex-col items-center justify-center font-bold lg:hidden"
                name="navbarClose"
                aria-label="navbarClose"
              >
                <span className="block h-[2px] w-7 rotate-45 bg-black dark:bg-white"></span>
                <span className="-mt-[2px] block h-[2px] w-7 -rotate-45 bg-black dark:bg-white"></span>
              </button>

              <nav className="fixed top-0 left-0 z-999 flex h-screen w-full items-center justify-center bg-white/95 text-center backdrop-blur-xs lg:static lg:h-auto lg:w-max lg:bg-transparent lg:backdrop-blur-none dark:bg-black/95 lg:dark:bg-transparent">
                <ul className="items-center space-y-3 lg:flex lg:space-y-0 lg:space-x-8 xl:space-x-10">
                  {updatedMenuData.map((item, index) => (
                    <li key={index} className="menu-item">
                      <Link
                        href={item.route}
                        onClick={closeMenu}
                        className={`ud-menu-scroll hover:text-primary inline-flex items-center font-medium text-black/90 lg:py-[21px] dark:text-white`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  {/* Mobile CTA */}
                  <li className="mt-8 block lg:hidden">
                    <Link
                      href="/muuttolaskuri"
                      onClick={closeMenu}
                      className="bg-primary mb-3 block w-full rounded-full px-7.5 py-3 text-center text-white transition-all duration-300 hover:bg-primary/90 hover:shadow-lg font-bold font-outfit"
                    >
                      Muuttolaskuri
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>

            <div className="mr-[60px] flex items-center justify-end lg:mr-0">
              {/* Dark mode switch removed by request */}

              <div className="hidden items-center sm:flex">
                <a
                  href={`tel:${siteConfig.contact.phone.tel}`}
                  className="hover:text-primary mr-4 font-semibold text-black/80 dark:text-white whitespace-nowrap"
                >
                  📞 {siteConfig.contact.phone.display}
                </a>

                <Link
                  href="/muuttolaskuri"
                  className="bg-primary hover:shadow-1 flex items-center justify-center rounded-full px-7.5 py-3 text-base font-bold text-white whitespace-nowrap font-outfit"
                >
                  Muuttolaskuri
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
