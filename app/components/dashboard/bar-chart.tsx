/**
 * Bar Chart Component
 * 
 * A component for displaying bar charts.
 */

import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface BarChartProps {
  /**
   * Data for the chart
   */
  data?: Array<Record<string, any>>;
  
  /**
   * Key for the x-axis
   */
  xKey: string;
  
  /**
   * Keys for the y-axis (bars)
   */
  yKeys: string[];
  
  /**
   * Colors for the bars
   */
  colors?: string[];
  
  /**
   * Unit for the y-axis
   */
  unit?: string;
  
  /**
   * Whether to stack the bars
   */
  stacked?: boolean;
  
  /**
   * Height of the chart
   */
  height?: number;
}

/**
 * Bar Chart Component
 */
export function BarChart({ data = [], xKey, yKeys, colors, unit, stacked = false, height = 300 }: BarChartProps) {
  // Default colors if not provided
  const defaultColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
  const barColors = colors || defaultColors;
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis unit={unit} />
        <Tooltip formatter={(value) => [`${value}${unit || ""}`, ""]} />
        <Legend />
        {yKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={barColors[index % barColors.length]}
            name={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
            stackId={stacked ? "stack" : undefined}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
