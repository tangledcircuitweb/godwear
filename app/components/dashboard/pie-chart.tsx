/**
 * Pie Chart Component
 * 
 * A component for displaying pie charts.
 */

import React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface PieChartProps {
  /**
   * Data for the chart
   */
  data?: Array<{ name: string; value: number }>;
  
  /**
   * Colors for the pie slices
   */
  colors?: string[];
  
  /**
   * Height of the chart
   */
  height?: number;
}

/**
 * Pie Chart Component
 */
export function PieChart({ data = [], colors, height = 300 }: PieChartProps) {
  // Default colors if not provided
  const defaultColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
  const pieColors = colors || defaultColors;
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value}`, ""]} />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
