'use client';

import React, { useEffect, useState } from 'react';

interface PaginationProps {
  totalPages: number;
}

const Pagination: React.FC<PaginationProps> = ({ totalPages }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const MAX_VISIBLE_PAGES = 5;

  useEffect(() => {
    const updatePages = () => {
      if (currentPage < 1) {
        setCurrentPage(1);
      } else if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    };

    const startPage = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
    const endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);

    setVisiblePages(Array.from({ length: endPage - startPage + 1 }, (_, i) => i + startPage));

    updatePages();
  }, [currentPage, totalPages]);

  const navigatePage = (direction: number) => {
    setCurrentPage((prevPage) => prevPage + direction);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const showEllipsisBeforeLastPage =
    totalPages > MAX_VISIBLE_PAGES && currentPage <= totalPages - MAX_VISIBLE_PAGES + 2;

  return (
    <>
      <div className="relative z-1 mt-10 lg:mt-15 xl:mt-20">
        <nav>
          <ul className="flex items-center justify-center gap-3">
            <li>
              <button
                onClick={() => navigatePage(-1)}
                className="group shadow-6 hover:bg-primary dark:bg-blacksection dark:hover:bg-primary flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white text-xs duration-300 ease-in-out hover:text-white md:h-10 md:w-10 md:text-base dark:shadow-none dark:hover:text-white"
              >
                <svg
                  className="fill-body duration-300 ease-in-out group-hover:fill-white"
                  width="8"
                  height="14"
                  viewBox="0 0 8 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2.93884 6.99999L7.88884 11.95L6.47484 13.364L0.11084 6.99999L6.47484 0.635986L7.88884 2.04999L2.93884 6.99999Z" />
                </svg>
              </button>
            </li>

            {visiblePages.map((page) => (
              <li key={page}>
                <button
                  onClick={() => goToPage(page)}
                  className="shadow-6 hover:bg-primary dark:bg-blacksection dark:hover:bg-primary flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white text-xs duration-300 ease-in-out hover:text-white md:h-10 md:w-10 md:text-base dark:shadow-none dark:hover:text-white"
                >
                  {page}
                </button>
              </li>
            ))}

            {showEllipsisBeforeLastPage && (
              <li>
                <span
                  className="shadow-6 hover:bg-primary dark:bg-blacksection dark:hover:bg-primary flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white text-xs duration-300 ease-in-out hover:text-white md:h-10 md:w-10 md:text-base dark:shadow-none dark:hover:text-white"
                >
                  ...
                </span>
              </li>
            )}

            <li>
              <button
                onClick={() => goToPage(totalPages)}
                className="shadow-6 hover:bg-primary dark:bg-blacksection dark:hover:bg-primary flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white text-xs duration-300 ease-in-out hover:text-white md:h-10 md:w-10 md:text-base dark:shadow-none dark:hover:text-white"
              >
                {totalPages}
              </button>
            </li>

            <li>
              <button
                onClick={() => navigatePage(1)}
                className="group shadow-6 hover:bg-primary dark:bg-blacksection dark:hover:bg-primary flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white text-xs duration-300 ease-in-out hover:text-white md:h-10 md:w-10 md:text-base dark:shadow-none dark:hover:text-white"
              >
                <svg
                  className="fill-body duration-300 ease-in-out group-hover:fill-white"
                  width="8"
                  height="14"
                  viewBox="0 0 8 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M5.06067 7.00001L0.110671 2.05001L1.52467 0.636014L7.88867 7.00001L1.52467 13.364L0.110672 11.95L5.06067 7.00001Z" />
                </svg>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Pagination;
