"use client";
import { useEffect, useState } from "react";

const PreLoader = () => {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <>
      {loading && (
        <div className="dark:bg-dark fixed left-0 top-0 z-9999999 flex h-screen w-full items-center justify-center bg-white">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      )}
    </>
  );
};

export default PreLoader;
