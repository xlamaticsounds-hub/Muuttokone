"use client";

import React from "react";
import Link from "next/link";
import { ChevronsUpDown } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  /** Skip this column in the stacked mobile card view, e.g. a trailing icon-only action column. */
  hideOnMobile?: boolean;
}

export interface TablePagination {
  /** 1-based current page. */
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  /** Prev/Next links are built as `${basePath}?page=N`. */
  basePath: string;
}

interface UniversalTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  pagination?: TablePagination;
  emptyMessage?: string;
}

export function UniversalTable<T extends { id: string | number }>({
  data,
  columns,
  onRowClick,
  isLoading,
  pagination,
  emptyMessage = "Ei tietoja saatavilla.",
}: UniversalTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full animate-pulse space-y-4 p-4">
        <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
    );
  }

  const mobileColumns = columns.filter((col) => !col.hideOnMobile);

  return (
    <div className="w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {/* Mobile: stacked cards, no horizontal scrolling */}
      <div className="divide-y divide-gray-100 sm:hidden dark:divide-gray-800">
        {data.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          data.map((row) => (
            <div
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={`space-y-2 px-4 py-3 ${
                onRowClick ? "cursor-pointer active:bg-gray-50 dark:active:bg-gray-800/60" : ""
              }`}
            >
              {mobileColumns.map((col, idx) => (
                <div key={idx}>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {col.header}
                  </div>
                  <div className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                    {col.cell
                      ? col.cell(row)
                      : col.accessorKey
                      ? (row[col.accessorKey] as React.ReactNode)
                      : null}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Tablet and up: regular table */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-medium uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-4 py-3 font-medium select-none ${col.className || ""}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        <ChevronsUpDown className="h-3 w-3 text-gray-400 opacity-50" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    className={`group transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/50 ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                  >
                    {columns.map((col, idx) => (
                      <td
                        key={idx}
                        className={`px-4 py-3 align-middle text-gray-700 dark:text-gray-300 ${
                          col.className || ""
                        }`}
                      >
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                          ? (row[col.accessorKey] as React.ReactNode)
                          : null}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer / Pagination */}
      {pagination ? (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-xs text-gray-500 sm:flex-row dark:border-gray-800 dark:text-gray-400">
          <div>
            Yhteensä {pagination.total} riviä · Sivu {pagination.page}/{pagination.totalPages}
          </div>
          <div className="flex gap-2">
            {pagination.page > 1 ? (
              <Link
                href={`${pagination.basePath}?page=${pagination.page - 1}`}
                className="rounded border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Edellinen
              </Link>
            ) : (
              <span className="rounded border border-gray-200 px-3 py-1.5 font-medium text-gray-300 dark:border-gray-800 dark:text-gray-600">
                Edellinen
              </span>
            )}
            {pagination.page < pagination.totalPages ? (
              <Link
                href={`${pagination.basePath}?page=${pagination.page + 1}`}
                className="rounded border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Seuraava
              </Link>
            ) : (
              <span className="rounded border border-gray-200 px-3 py-1.5 font-medium text-gray-300 dark:border-gray-800 dark:text-gray-600">
                Seuraava
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          <div>Yhteensä {data.length} riviä</div>
        </div>
      )}
    </div>
  );
}
