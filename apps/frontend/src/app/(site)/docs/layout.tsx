'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const sidebarItems = [
    { label: 'Johdanto', href: '/docs' },
    { label: 'Käyttöönotto (CI/CD)', href: '/docs/deployment' },
    { label: 'Tietoturva', href: '/docs/security' },
    { label: 'CMS & Dynaaminen sisältö', href: '/docs/cms' },
    { label: 'Galleria & Kuvankäsittely', href: '/docs/galleria' },
    { label: 'AI & Automaatio', href: '/docs/ai' },
  ];

  return (
    <div className="mx-auto max-w-1390 px-4 md:px-8 xl:px-21 pt-32 pb-20">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <nav className="sticky top-24 space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 px-3">Dokumentaatio</h3>
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-black/70 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-primary'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-3xl prose prose-slate dark:prose-invert prose-headings:font-outfit prose-a:text-primary prose-img:rounded-xl">
          {children}
        </main>
      </div>
    </div>
  );
}