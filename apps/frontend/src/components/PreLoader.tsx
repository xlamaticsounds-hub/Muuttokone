'use client';
import { useEffect, useState } from 'react';

const PreLoader = () => {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <>
      {loading && (
        <div className="dark:bg-dark fixed top-0 left-0 z-9999999 flex h-screen w-full items-center justify-center bg-white">
          <div className="border-primary h-16 w-16 animate-spin rounded-full border-4 border-solid border-t-transparent"></div>
        </div>
      )}
    </>
  );
};

export default PreLoader;
