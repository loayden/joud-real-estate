import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyState,
  className,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  emptyState: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border",
        className,
      )}
    >
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-muted/60 text-xs font-bold text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th
                className={cn("px-4 py-3 text-start", column.className)}
                key={column.key}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {data.length > 0 ? (
            data.map((row) => (
              <tr className="align-top" key={getRowKey(row)}>
                {columns.map((column) => (
                  <td
                    className={cn("px-4 py-4", column.className)}
                    key={column.key}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="px-4 py-10 text-center text-muted-foreground"
                colSpan={columns.length}
              >
                {emptyState}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
