"use client";

import React, { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { onScroll } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
// import GlobalSearchModal from "@/components/GlobalSearch";
import { useSiteConfig } from "@/app/context/SiteConfigContext";
import menuData from "@/components/Header/menuData";

const Header = () => {
  const siteConfig = useSiteConfig();
  useEffect(() => {
    if (window.location.pathname === "/") {
      window.addEventListener("scroll", onScroll);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const { data: session } = useSession();

  const pathUrl = usePathname();
  // Navbar toggle
  const [navbarOpen, setNavbarOpen] = useState(false);
  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  // Sticky Navbar (always sticky across site)
  const [sticky] = useState(true);

  // submenu handler
  const [openIndex, setOpenIndex] = useState(-1);
  const handleSubmenu = (index: number) => {
    if (openIndex === index) {
      setOpenIndex(-1);
    } else {
      setOpenIndex(index);
    }
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
              <Link href="/" className="block max-w-[145px] sm:max-w-[180px]">
                <Image
                  width={130}
                  height={44}
                  src={"/images/logo/logo.png"}
                  alt="Logo"
                  className="block dark:hidden"
                />
                <Image
                  width={130}
                  height={44}
                  src={"/images/logo/logo-white.svg"}
                  alt="Logo"
                  className="hidden dark:block"
                />
              </Link>
            </div>

            <button
              onClick={navbarToggleHandler}
              className="navbarOpen absolute top-1/2 right-4 z-50 flex h-10 w-10 -translate-y-1/2 flex-col items-center justify-center space-y-[6px] font-bold lg:hidden"
              aria-label="navbarOpen"
              name="navbarOpen"
            >
              <span className="block h-[2px] w-7 bg-black dark:bg-white"></span>
              <span className="block h-[2px] w-7 bg-black dark:bg-white"></span>
              <span className="block h-[2px] w-7 bg-black dark:bg-white"></span>
            </button>


            <div
              className={`${navbarOpen ? "" : "hidden"} menu-wrapper relative justify-between lg:flex`}
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
                  {updatedMenuData.map((item, index) =>
                    item.children ? (
                      <li
                        key={index}
                        className="submenu-item menu-item group relative"
                      >
                        <Link
                          onClick={() => handleSubmenu(index)}
                          href={item.route}
                          className={`lg:py-[21px] ${item.children.some((child) => pathUrl === child.route) ? "text-primary" : "text-black/90 dark:text-white"} hover:text-primary group-hover:text-primary inline-flex items-center font-medium`}
                        >
                          {item.label}
                          <span className="pl-3">
                            <svg
                              className={`h-3 w-3 fill-current ${openIndex === index ? "rotate-180 lg:rotate-0" : ""}`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 512 512"
                            >
                              <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
                            </svg>
                          </span>
                        </Link>

                        <ul
                          className={`${openIndex === index ? "" : "hidden"} submenu lg:dark:shadow-card-dark space-y-5 pt-5 duration-300 lg:invisible lg:absolute lg:top-[120%] lg:block lg:w-[250px] lg:rounded-lg lg:bg-white lg:px-8 lg:pb-5 lg:text-left lg:opacity-0 lg:shadow-lg lg:group-hover:visible lg:group-hover:top-full lg:group-hover:opacity-100 dark:lg:border-transparent dark:lg:bg-blacksection`}
                        >
                          {item.children.map((childItem, childIndex) => (
                            <li key={childIndex}>
                              <Link
                                href={childItem.route}
                                onClick={closeMenu}
                                className={`${pathUrl === childItem.route && "text-primary"} hover:text-primary inline-flex items-center justify-center text-center`}
                              >
                                {childItem.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ) : (
            <li key={index} className="menu-item">
                        <Link
                          href={item.route}
                          onClick={closeMenu}
              className={`lg:py-[21px] ud-menu-scroll inline-flex items-center font-medium text-black/90 hover:text-primary dark:text-white`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ),
                  )}
                  {/* Mobile CTAs */}
                  <li className="block lg:hidden mt-8">
                    <Link
                      href="/tarjouspyynto"
                      onClick={closeMenu}
                      className="block w-full rounded-full bg-primary px-7.5 py-3 text-white text-center mb-3"
                    >
                      Pyydä tarjous
                    </Link>
                    <a
                      href={`tel:${siteConfig.contact.phone.tel}`}
                      className="block w-full rounded-full border border-primary px-7.5 py-3 text-primary text-center"
                    >
                      Soita
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            <div className="mr-[60px] flex items-center justify-end lg:mr-0">

              {/* Dark mode switch removed by request */}

              {session ? (
                <div className="hidden items-center sm:flex">
                  <p className="mx-3 text-black dark:text-white">
                    {session?.user?.name}
                  </p>
                  <button
                    aria-label="SignOut"
                    onClick={() => signOut()}
                    className="bg-primary hover:shadow-1 flex items-center justify-center rounded-full px-7.5 py-3 text-base text-white"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="hidden items-center sm:flex">
                  <a
                    href={`tel:${siteConfig.contact.phone.tel}`}
                    className="mr-4 font-semibold text-black/80 hover:text-primary dark:text-white"
                  >
                    📞 {siteConfig.contact.phone.display}
                  </a>

                  <Link
                    href="/tarjouspyynto"
                    className="bg-primary hover:shadow-1 flex items-center justify-center rounded-full px-7.5 py-3 text-base text-white"
                  >
                    Pyydä tarjous
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* <GlobalSearchModal
        searchModalOpen={searchModalOpen}
        setSearchModalOpen={setSearchModalOpen}
      /> */}
    </>
  );
};

export default Header;
