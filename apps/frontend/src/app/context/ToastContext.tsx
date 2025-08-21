'use client';
import dynamic from 'next/dynamic';

// Dynamically import Toaster to avoid SSR rendering issues in App Router
const ToasterNoSSR = dynamic(() => import('react-hot-toast').then((m) => m.Toaster), {
  ssr: false,
});

const ToasterContext = () => {
  return <ToasterNoSSR position="top-center" reverseOrder={false} containerClassName="z-[99999]" />;
};

export default ToasterContext;
