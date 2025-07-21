/**
 * Line Chart Component
 * 
 * A component for displaying line charts.
 */

import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface LineChartProps {
  /**
   * Data for the chart
   */
  data?: Array<Record<string, any>>;
  
  /**
   * Key for the x-axis
   */
  xKey: string;
  
  /**
   * Keys for the y-axis (lines)
   */
  yKeys: string[];
  
  /**
   * Colors for the lines
   */
  colors?: string[];
  
  /**
   * Unit for the y-axis
   */
  unit?: string;
  
  /**
   * Height of the chart
   */
  height?: number;
}

/**
 * Line Chart Component
 */
export function LineChart({ data = [], xKey, yKeys, colors, unit, height = 300 }: LineChartProps) {
  // Default colors if not provided
  const defaultColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
  const lineColors = colors || defaultColors;
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis unit={unit} />
        <Tooltip formatter={(value) => [`${value}${unit || ""}`, ""]} />
        <Legend />
        {yKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={lineColors[index % lineColors.length]}
            activeDot={{ r: 8 }}
            name={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
