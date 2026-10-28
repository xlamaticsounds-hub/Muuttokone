"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import GlobalSearch from "./GlobalSearch";
import { BookUser, ChartLine, DollarSign, Gauge, Mail, Settings, Zap, User, LogOut, Search, X, Send, FileText, ImageIcon, Truck, Users, Receipt, History, FileSpreadsheet, Timer, StickyNote, TrendingUp } from 'lucide-react';

interface AdminLayoutShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
  /** Käynnissä olevien työaikaleimojen määrä (näytetään valikossa ja otsikkorivillä) */
  runningTimers?: number;
}

export default function AdminLayoutShell({ children, userEmail, runningTimers = 0 }: AdminLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const links = [
    { name: "Hallintapaneeli", href: "/hallinta/dashboard" },
    { name: "Liidit", href: "/hallinta/liidit" },
    { name: "Keikat", href: "/hallinta/keikat" },
    { name: "Ennuste", href: "/hallinta/ennuste" },
    { name: "Työajat", href: "/hallinta/tyoajat" },
    { name: "Asiakkaat", href: "/hallinta/asiakkaat" },
    { name: "Pipeline", href: "/hallinta/diilit" },
    { name: "Laskutus", href: "/hallinta/laskutus" },
    { name: "Raportit", href: "/hallinta/raportit" },
    { name: "Postilaatikko", href: "/hallinta/postilaatikko" },
    { name: "Muistiinpanot", href: "/hallinta/muistiinpanot" },
    { name: "Blogi", href: "/hallinta/blogi" },
    { name: "Galleria", href: "/hallinta/galleria" },
    { name: "Analytiikka", href: "/hallinta/analytiikka" },
    { name: "Lokit", href: "/hallinta/lokit" },
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

  // Älä jätä taustaa scrollauslukkoon jos ikkuna suurenee työpöytäkokoon
  // mobiilivetolaatikon ollessa auki (hampurilaisnappi piilotetaan lg:-rajalta ylöspäin,
  // jolloin käyttäjä ei enää näkisi tapaa sulkea sitä).
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sivua vaihdettaessa puhelimen hakurivi sulkeutuu
  useEffect(() => {
    setMobileSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const getPageTitle = (path: string) => {
    const allLinks = [...links, settingsLink];
    const link = allLinks.find(l => l.href === path);
    if (link) return link.name;
    if (path === "/hallinta/liidit/uusi") return "Keikka muualta";
    if (/^\/hallinta\/liidit\/[^/]+\/tarjous$/.test(path)) return "Tarjous / vahvistus";
    if (path.startsWith("/hallinta/")) {
      // Fallback for subpages or unlisted routes, capitalize first letter
      const part = path.split("/").pop();
      return part ? part.charAt(0).toUpperCase() + part.slice(1) : "Hallinta";
    }
    return "Hallintapaneeli";
  };


  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[45] bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`absolute left-0 top-0 z-50 flex h-screen w-64 flex-col overflow-y-hidden bg-blue-500 shadow-xl duration-300 ease-linear dark:bg-slate-800 lg:static lg:w-[84px] lg:translate-x-0 lg:shadow-none ${
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
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex h-12 w-full flex-row items-center justify-start gap-3 rounded-md px-3 py-2 text-sm font-semibold leading-tight text-white/90 duration-200 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:h-16 lg:flex-col lg:items-center lg:justify-center lg:gap-1 lg:px-1.5 lg:py-2 lg:text-[11px] ${
                      pathname === link.href ? "bg-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.22)]" : ""
                    }`}
                  >
                    {link.name === "Hallintapaneeli" && <Gauge color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Liidit" && <BookUser color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Keikat" && <Truck color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Ennuste" && <TrendingUp color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Työajat" && (
                      <span className="relative">
                        <Timer color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />
                        {runningTimers > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-3 w-3" title="Työ käynnissä">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                            <span className="relative inline-flex h-3 w-3 rounded-full border border-white bg-emerald-400" />
                          </span>
                        )}
                      </span>
                    )}
                    {link.name === "Muistiinpanot" && <StickyNote color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Asiakkaat" && <Users color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Pipeline" && <DollarSign color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Laskutus" && <Receipt color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Raportit" && <FileSpreadsheet color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Postilaatikko" && <Send color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Blogi" && <FileText color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Galleria" && <ImageIcon color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Analytiikka" && <ChartLine color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    {link.name === "Lokit" && <History color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />}
                    <span className="text-left text-sm tracking-tight lg:text-center lg:text-[10px]">{link.name}</span>
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
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex h-12 w-full flex-row items-center justify-start gap-3 rounded-md px-3 py-2 text-sm font-semibold leading-tight text-white/90 duration-200 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:h-16 lg:flex-col lg:items-center lg:justify-center lg:gap-1 lg:px-1.5 lg:py-2 lg:text-[11px] ${
                      pathname === settingsLink.href ? "bg-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.22)]" : ""
                    }`}
                  >
                    <Settings color="white" className="[filter:brightness(1.2)_saturate(1.2)_drop-shadow(0_0_3px_rgba(255,255,255,0.4))]" />
                    <span className="text-left text-sm tracking-tight lg:text-center lg:text-[10px]">{settingsLink.name}</span>
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
        <header className="sticky top-0 z-40 flex w-full flex-col bg-white shadow dark:bg-slate-800 drop-shadow-1 dark:drop-shadow-none">
          <div className="flex flex-grow items-center justify-between px-4 py-3 shadow-2 sm:py-4 md:px-6 2xl:px-11">
            <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
              {/* Hamburger Toggle BTN */}
              <button
                aria-controls="sidebar"
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(!sidebarOpen);
                }}
                className="z-99999 block rounded-md border border-stroke bg-white p-2.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
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
            <div className="ml-3 min-w-0 flex-1 sm:ml-0 sm:flex-none">
              <h1 className="truncate text-lg font-semibold text-gray-800 dark:text-white sm:text-xl">
                {getPageTitle(pathname)}
              </h1>
            </div>

            {runningTimers > 0 && pathname !== "/hallinta/tyoajat" && (
              <Link
                href="/hallinta/tyoajat"
                className="ml-2 flex shrink-0 items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="hidden min-[400px]:inline">Työ käynnissä</span>
                <span className="min-[400px]:hidden">Työ</span>
              </Link>
            )}

            {/* Middle: Search Bar */}
            <GlobalSearch className="mx-4 hidden w-full max-w-md sm:block" />

            {/* Right: User Menu */}
            <div className="flex items-center gap-2 sm:gap-3 2xsm:gap-7">
              <button
                type="button"
                onClick={() => setMobileSearchOpen((open) => !open)}
                aria-label={mobileSearchOpen ? "Sulje haku" : "Avaa haku"}
                aria-expanded={mobileSearchOpen}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-600 active:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 sm:hidden"
              >
                {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-4"
                >
                  <span className="h-11 w-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:h-10 sm:w-10">
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
          {mobileSearchOpen && (
            <div className="px-4 pb-3 sm:hidden">
              <GlobalSearch autoFocus onNavigate={() => setMobileSearchOpen(false)} />
            </div>
          )}
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