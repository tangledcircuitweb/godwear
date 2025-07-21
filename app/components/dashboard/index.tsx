/**
 * Dashboard Components
 * 
 * This file exports components for building dashboards.
 */

import React from "react";

// Re-export all dashboard components
export * from "./metric-card";
export * from "./line-chart";
export * from "./bar-chart";
export * from "./pie-chart";
export * from "./data-table";
export * from "./alert";

// Export default dashboard layout
export default function Dashboard({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">
      {children}
    </div>
  );
}
