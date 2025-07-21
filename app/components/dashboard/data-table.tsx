/**
 * Data Table Component
 * 
 * A component for displaying tabular data.
 */

import React from "react";

export interface DataTableColumn {
  /**
   * Key for the column (property name in data objects)
   */
  key: string;
  
  /**
   * Header text for the column
   */
  header: string;
  
  /**
   * Optional render function for custom cell rendering
   */
  render?: (value: any, row: any) => React.ReactNode;
}

export interface DataTableProps {
  /**
   * Data for the table
   */
  data?: Array<Record<string, any>>;
  
  /**
   * Column definitions
   */
  columns: DataTableColumn[];
}

/**
 * Data Table Component
 */
export function DataTable({ data = [], columns }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
