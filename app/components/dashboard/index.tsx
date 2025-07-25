/**
 * Dashboard Components
 * 
 * This file exports components for building dashboards.
 */

// Re-export all dashboard components
export * from "./metric-card";
export * from "./line-chart";
export * from "./bar-chart";
export * from "./pie-chart";
export * from "./data-table";
export * from "./alert";

// Dashboard layout component for HonoX
export function Dashboard({ children }: { children: any }) {
  return (
    <div class="p-6">
      {children}
    </div>
  );
}
