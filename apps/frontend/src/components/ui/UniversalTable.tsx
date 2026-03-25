"use client";

import React from "react";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface UniversalTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
}

export function UniversalTable<T extends { id: string | number }>({
  data,
  columns,
  onRowClick,
  isLoading,
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

  return (
    <div className="w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
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
                  Ei tietoja saatavilla.
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
      {/* Footer / Pagination Placeholder */}
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
        <div>Yhteensä {data.length} riviä</div>
        <div className="flex gap-2">
          {/* Pagination controls can be added here */}
          <button className="disabled:opacity-50" disabled>
            Edellinen
          </button>
          <button className="disabled:opacity-50" disabled>
            Seuraava
          </button>
        </div>
      </div>
    </div>
  );
}
