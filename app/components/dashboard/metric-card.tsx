/**
 * Metric Card Component
 * 
 * A card for displaying a metric with a title, value, and optional subtitle.
 */

import React from "react";

export interface MetricCardProps {
  /**
   * Title of the metric
   */
  title: string;
  
  /**
   * Value of the metric
   */
  value: string | number;
  
  /**
   * Optional subtitle or description
   */
  subtitle?: string;
  
  /**
   * Status of the metric (affects color)
   */
  status?: "success" | "warning" | "error" | "info";
  
  /**
   * Size of the card
   */
  size?: "small" | "medium" | "large";
}

/**
 * Metric Card Component
 */
export function MetricCard({ title, value, subtitle, status, size = "medium" }: MetricCardProps) {
  // Determine status color
  const statusColor = {
    success: "text-green-600",
    warning: "text-amber-600",
    error: "text-red-600",
    info: "text-blue-600",
  }[status || "info"];
  
  // Determine size classes
  const sizeClasses = {
    small: "p-3",
    medium: "p-4",
    large: "p-6",
  }[size];
  
  const titleClasses = {
    small: "text-sm font-medium text-gray-500",
    medium: "text-sm font-medium text-gray-500",
    large: "text-base font-medium text-gray-500",
  }[size];
  
  const valueClasses = {
    small: "text-xl font-semibold mt-1",
    medium: "text-2xl font-semibold mt-1",
    large: "text-3xl font-semibold mt-2",
  }[size];
  
  const subtitleClasses = {
    small: "text-xs text-gray-500 mt-1",
    medium: "text-sm text-gray-500 mt-1",
    large: "text-base text-gray-500 mt-2",
  }[size];
  
  return (
    <div className={`bg-white rounded-lg shadow ${sizeClasses}`}>
      <h3 className={titleClasses}>{title}</h3>
      <p className={`${valueClasses} ${status ? statusColor : ""}`}>{value}</p>
      {subtitle && <p className={subtitleClasses}>{subtitle}</p>}
    </div>
  );
}
