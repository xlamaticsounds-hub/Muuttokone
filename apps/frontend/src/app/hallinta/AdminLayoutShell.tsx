"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookUser, ChartLine, DollarSign, Gauge, Mail, Settings, Zap, User, Search, LogOut, Send, FileText, ImageIcon, Truck, Users } from 'lucide-react';

interface AdminLayoutShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
}

export default function AdminLayoutShell({ children, userEmail }: AdminLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const links = [
    { name: "Hallintapaneeli", href: "/hallinta/dashboard" },
    { name: "Liidit", href: "/hallinta/liidit" },
    { name: "Keikat", href: "/hallinta/keikat" },
    { name: "Asiakkaat", href: "/hallinta/asiakkaat" },
    { name: "Diilit", href: "/hallinta/diilit" },
    { name: "Postilaatikko", href: "/hallinta/postilaatikko" },
    { name: "Blogi", href: "/hallinta/blogi" },
    { name: "Galleria", href: "/hallinta/galleria" },
    { name: "Analytiikka", href: "/hallinta/analytiikka" },
  ];

  const settingsLink = { name: "Asetukset", href: "/hallinta/asetukset" };

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuRef]);

  const getPageTitle = (path: string) => {
    const allLinks = [...links, settingsLink];
    const link = allLinks.find(l => l.href === path);
    if (link) return link.name;
    if (path.startsWith("/hallinta/")) {
      // Fallback for subpages or unlisted routes, capitalize first letter
      const part = path.split("/").pop();
      return part ? part.charAt(0).toUpperCase() + part.slice(1) : "Hallinta";
    }
    return "Hallintapaneeli";
  };


  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900">
      <aside
        className={`absolute left-0 top-0 z-50 flex h-screen w-[76px] flex-col overflow-y-hidden bg-blue-500 duration-300 ease-linear dark:bg-slate-800 lg:static lg:w-[84px] lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative flex h-[73px] items-center justify-center px-2">
          <Link href="/hallinta/dashboard">
            <Zap 
              fill="white" 
              color="white" 
              width={38} 
              className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_5px_rgba(255,255,255,0.6))]" 
            />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-2 top-2 block text-white lg:hidden"
            aria-label="Close sidebar"
          >
             <svg
              className="fill-current"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
                fill=""
              />
            </svg>
          </button>
        </div>

        <div className="h-px bg-white/25" />

        <div className="flex flex-col overflow-y-auto duration-300 ease-linear">
          <nav className="mt-2 px-1 py-3 lg:mt-3">
            <ul className="flex flex-col items-center gap-1.5">
              {links.map((link) => (
                <li key={link.name} className="w-full">
                  <Link
                    href={link.href}
                    className={`group flex h-16 flex-col items-center justify-center gap-1 rounded-md px-1.5 py-2 text-[11px] font-semibold leading-tight text-white/90 duration-200 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      pathname === link.href ? "bg-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.22)]" : ""
                    }`}
                  >
                    {link.name === "Hallintapaneeli" && <Gauge color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Liidit" && <BookUser color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Keikat" && <Truck color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Asiakkaat" && <Users color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Diilit" && <DollarSign color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Postilaatikko" && <Send color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Blogi" && <FileText color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Galleria" && <ImageIcon color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Analytiikka" && <ChartLine color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    <span className="text-center text-[10px] tracking-tight">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Settings at bottom with separator */}
            <div className="mt-auto pt-6">
              <div className="mb-3 h-px bg-white/25" />
              <ul className="flex flex-col items-center">
                <li className="w-full">
                  <Link
                    href={settingsLink.href}
                    className={`group flex h-16 flex-col items-center justify-center gap-1 rounded-md px-1.5 py-2 text-[11px] font-semibold leading-tight text-white/90 duration-200 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      pathname === settingsLink.href ? "bg-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.22)]" : ""
                    }`}
                  >
                    <Settings color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />
                    <span className="text-center text-[10px] tracking-tight">{settingsLink.name}</span>
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </aside>
      {/* Content Area */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 flex w-full bg-white shadow dark:bg-slate-800 drop-shadow-1 dark:drop-shadow-none">
          <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
            <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
              {/* Hamburger Toggle BTN */}
              <button
                aria-controls="sidebar"
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(!sidebarOpen);
                }}
                className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
              >
                <span className="relative block h-5.5 w-5.5 cursor-pointer">
                  <span className="du-block absolute right-0 h-full w-full">
                    <span
                      className={`relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white ${
                        !sidebarOpen && "!w-full delay-300"
                      }`}
                    ></span>
                    <span
                      className={`relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white ${
                        !sidebarOpen && "delay-400 !w-full"
                      }`}
                    ></span>
                    <span
                      className={`relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white ${
                        !sidebarOpen && "!w-full delay-500"
                      }`}
                    ></span>
                  </span>
                </span>
              </button>
            </div>

            {/* Left: Page Title */}
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                {getPageTitle(pathname)}
              </h1>
            </div>

            {/* Middle: Search Bar */}
            <div className="hidden sm:block w-full max-w-md mx-4">
              <div className="relative">
                <button className="absolute left-0 top-1/2 -translate-y-1/2 pl-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </button>
                <input
                  type="text"
                  placeholder="Hae..."
                  className="w-full rounded-full border border-gray-300 bg-transparent py-2.5 pl-10 pr-4 text-sm text-gray-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:text-gray-300"
                />
              </div>
            </div>

            {/* Right: User Menu */}
            <div className="flex items-center gap-3 2xsm:gap-7" ref={userMenuRef}>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-4"
                >
                  <span className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                     <User className="h-6 w-6" />
                  </span>
                </button>

                {/* Dropdown Modal */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-4 flex w-62.5 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark z-50">
                    <div className="px-6 py-4 border-b border-stroke dark:border-strokedark">
                       <p className="text-sm text-gray-600 dark:text-gray-400">Kirjautunut käyttäjänä</p>
                       <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userEmail}</p>
                    </div>
                    <ul className="flex flex-col gap-1 border-b border-stroke p-2 dark:border-strokedark">
                      <li>
                        <Link
                          href="/hallinta/asetukset"
                           onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3.5 px-4 py-2 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base"
                        >
                          <Settings className="h-5 w-5" />
                          Asetukset
                        </Link>
                      </li>
                    </ul>
                    <div className="p-2">
                       <a
                        href="/api/auth/signout"
                        className="flex items-center gap-3.5 px-4 py-2 text-sm font-medium duration-300 ease-in-out text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 lg:text-base"
                      >
                        <LogOut className="h-5 w-5" />
                        Kirjaudu ulos
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}