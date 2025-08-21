import React from 'react';
import Header from '@/components/Header';
import ToasterContext from '@/app/context/ToastContext';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';

const DefaultLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <>
      <Header />
      <ToasterContext />
      <main>{children}</main>
      <Footer />
      <ScrollToTop />
    </>
  );
};

export default DefaultLayout;
