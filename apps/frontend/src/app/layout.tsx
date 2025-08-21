import type { Metadata, Viewport } from 'next';
import React from 'react';

const siteUrl = process.env.SITE_URL ?? 'https://muuttokone.fi';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s | Muuttokone.fi',
    default: 'Muuttokone.fi - Luotettava muuttopalvelu koko Suomessa',
  },
  description:
    'Nopea, turvallinen ja läpinäkyvä muutto. Koti- ja yritysmuutot, pakkaus, varastointi ja siivous. Vakuutettu SMPY-jäsen. Pyydä maksuton tarjous!',
  keywords: [
    'muutto',
    'muuttofirma',
    'muuttopalvelu',
    'kotimuutto',
    'yritysmuutto',
    'pakkaus',
    'varastointi',
    'siivous',
    'Helsinki',
    'Tampere',
    'Turku',
    'Suomi',
    'SMPY',
  ],
  authors: [{ name: 'Muuttokone.fi' }],
  creator: 'Muuttokone.fi',
  publisher: 'Muuttokone.fi',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fi_FI',
    url: siteUrl,
    siteName: 'Muuttokone.fi',
    title: 'Muuttokone.fi - Luotettava muuttopalvelu koko Suomessa',
    description:
      'Nopea, turvallinen ja läpinäkyvä muutto. Koti- ja yritysmuutot, pakkaus, varastointi ja siivous. Vakuutettu SMPY-jäsen.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Muuttokone.fi - Luotettava muuttopalvelu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Muuttokone.fi - Luotettava muuttopalvelu',
    description:
      'Nopea, turvallinen ja läpinäkyvä muutto. Koti- ja yritysmuutot, pakkaus, varastointi ja siivous.',
    images: ['/images/twitter-image.jpg'],
    creator: '@muuttokone',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  category: 'business',
  classification: 'Moving Services',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Muuttokone.fi',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
