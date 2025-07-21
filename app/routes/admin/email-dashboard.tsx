import { useState, useEffect } from "react";
import { useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { requireAdmin } from "../../lib/auth";
import { getServiceRegistry } from "../../lib/services";
import { formatNumber, formatPercent, formatDate } from "../../lib/format-utils";
import { LineChart, BarChart, PieChart, DataTable, MetricCard, Alert } from "../../components/dashboard";
import { Tabs, TabPanel } from "../../components/ui/tabs";
import { DateRangePicker } from "../../components/ui/date-range-picker";
import { Select } from "../../components/ui/select";

/**
 * Loader function for the email dashboard
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  // Require admin authentication
  await requireAdmin(request, context);
  
  // Get service registry
  const services = getServiceRegistry(context);
  
  // Get query parameters
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate") || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = url.searchParams.get("endDate") || new Date().toISOString();
  const groupBy = url.searchParams.get("groupBy") || "day";
  const templateName = url.searchParams.get("templateName") || undefined;
  
  try {
    // Get email metrics
    const metrics = await services.emailAnalytics.getMetrics({
      startDate,
      endDate,
      groupBy: groupBy as any,
      templateName,
    });
    
    // Get email service health
    const emailHealth = await services.email.getHealth();
    
    // Get email analytics health
    const analyticsHealth = await services.emailAnalytics.getHealth();
    
    // Get queue stats if using queue service
    let queueStats = null;
    if (services.email.serviceName.includes("queue")) {
      queueStats = (services.email as any).getQueueStats();
    }
    
    // Get template list
    const templates = [
      "transactional/order-confirmation",
      "transactional/shipping-notification",
      "security/password-reset",
      "security/email-verification",
      "marketing/abandoned-cart",
      "marketing/order-followup",
    ];
    
    return json({
      metrics,
      emailHealth,
      analyticsHealth,
      queueStats,
      templates,
      filters: {
        startDate,
        endDate,
        groupBy,
        templateName,
      },
    });
  } catch (error) {
    console.error("Error loading email dashboard data", error);
    return json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Email dashboard component
 */
export default function EmailDashboard() {
  const data = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState(data.filters);
  
  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Update URL with new filters
    const url = new URL(window.location.href);
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value as string);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.pushState({}, "", url.toString());
  };
  
  // Refresh data when filters change
  useEffect(() => {
    // This would normally trigger a data refresh
    // For now, we'll just simulate it
    console.log("Filters changed, would refresh data", filters);
  }, [filters]);
  
  // Check for errors
  if ("error" in data) {
    return (
      <div className="p-6">
        <Alert type="error" title="Error Loading Dashboard">
          {data.error}
        </Alert>
      </div>
    );
  }
  
  const { metrics, emailHealth, analyticsHealth, queueStats } = data;
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Email Monitoring Dashboard</h1>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4">
        <DateRangePicker
          startDate={new Date(filters.startDate)}
          endDate={new Date(filters.endDate)}
          onChange={(start, end) => handleFilterChange({
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          })}
        />
        
        <Select
          label="Group By"
          value={filters.groupBy}
          options={[
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
            { value: "template", label: "Template" },
          ]}
          onChange={(value) => handleFilterChange({ groupBy: value })}
        />
        
        <Select
          label="Template"
          value={filters.templateName || ""}
          options={[
            { value: "", label: "All Templates" },
            ...data.templates.map(template => ({
              value: template,
              label: template.split("/").pop() || template,
            })),
          ]}
          onChange={(value) => handleFilterChange({ templateName: value || undefined })}
        />
      </div>
      
      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Email Service"
          value={emailHealth.status}
          status={emailHealth.status === "healthy" ? "success" : "error"}
          subtitle={emailHealth.message}
        />
        
        <MetricCard
          title="Analytics Service"
          value={analyticsHealth.status}
          status={analyticsHealth.status === "healthy" ? "success" : "error"}
          subtitle={analyticsHealth.message}
        />
        
        {queueStats && (
          <MetricCard
            title="Email Queue"
            value={`${queueStats.pending} pending`}
            status={queueStats.pending > 100 ? "warning" : "success"}
            subtitle={`${queueStats.total} total emails in queue`}
          />
        )}
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Delivery Rate"
          value={formatPercent(metrics.overall.deliveryRate)}
          status={metrics.overall.deliveryRate >= 0.95 ? "success" : "warning"}
          subtitle={`${formatNumber(metrics.overall.delivered)} / ${formatNumber(metrics.overall.sent)}`}
        />
        
        <MetricCard
          title="Open Rate"
          value={formatPercent(metrics.overall.openRate)}
          status={metrics.overall.openRate >= 0.2 ? "success" : "info"}
          subtitle={`${formatNumber(metrics.overall.opened)} / ${formatNumber(metrics.overall.delivered)}`}
        />
        
        <MetricCard
          title="Click Rate"
          value={formatPercent(metrics.overall.clickRate)}
          status={metrics.overall.clickRate >= 0.1 ? "success" : "info"}
          subtitle={`${formatNumber(metrics.overall.clicked)} / ${formatNumber(metrics.overall.delivered)}`}
        />
        
        <MetricCard
          title="Bounce Rate"
          value={formatPercent(metrics.overall.bounceRate)}
          status={metrics.overall.bounceRate <= 0.05 ? "success" : "error"}
          subtitle={`${formatNumber(metrics.overall.bounced)} / ${formatNumber(metrics.overall.sent)}`}
        />
      </div>
      
      {/* Tabs */}
      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <TabPanel id="overview" label="Overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Email Volume Chart */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Email Volume</h2>
              <LineChart
                data={metrics.breakdown?.map(item => ({
                  name: item.key,
                  sent: item.metrics.sent,
                  delivered: item.metrics.delivered,
                  opened: item.metrics.opened,
                  clicked: item.metrics.clicked,
                }))}
                xKey="name"
                yKeys={["sent", "delivered", "opened", "clicked"]}
                colors={["#6366F1", "#10B981", "#F59E0B", "#EF4444"]}
              />
            </div>
            
            {/* Engagement Rates Chart */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Engagement Rates</h2>
              <LineChart
                data={metrics.breakdown?.map(item => ({
                  name: item.key,
                  deliveryRate: item.metrics.deliveryRate * 100,
                  openRate: item.metrics.openRate * 100,
                  clickRate: item.metrics.clickRate * 100,
                }))}
                xKey="name"
                yKeys={["deliveryRate", "openRate", "clickRate"]}
                colors={["#6366F1", "#10B981", "#F59E0B"]}
                unit="%"
              />
            </div>
          </div>
          
          {/* Email Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Email Status Distribution</h2>
              <PieChart
                data={[
                  { name: "Delivered", value: metrics.overall.delivered },
                  { name: "Bounced", value: metrics.overall.bounced },
                  { name: "Failed", value: metrics.overall.sent - metrics.overall.delivered - metrics.overall.bounced },
                ]}
                colors={["#10B981", "#EF4444", "#F59E0B"]}
              />
            </div>
            
            {/* Engagement Distribution */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Engagement Distribution</h2>
              <PieChart
                data={[
                  { name: "Opened & Clicked", value: metrics.overall.clicked },
                  { name: "Opened (No Click)", value: metrics.overall.opened - metrics.overall.clicked },
                  { name: "Not Opened", value: metrics.overall.delivered - metrics.overall.opened },
                ]}
                colors={["#6366F1", "#10B981", "#94A3B8"]}
              />
            </div>
          </div>
          
          {/* Template Performance */}
          {filters.groupBy === "template" && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-xl font-semibold mb-4">Template Performance</h2>
              <DataTable
                data={metrics.breakdown?.map(item => ({
                  template: item.key,
                  sent: item.metrics.sent,
                  delivered: formatPercent(item.metrics.deliveryRate),
                  opened: formatPercent(item.metrics.openRate),
                  clicked: formatPercent(item.metrics.clickRate),
                  bounced: formatPercent(item.metrics.bounceRate),
                }))}
                columns={[
                  { key: "template", header: "Template" },
                  { key: "sent", header: "Sent" },
                  { key: "delivered", header: "Delivery Rate" },
                  { key: "opened", header: "Open Rate" },
                  { key: "clicked", header: "Click Rate" },
                  { key: "bounced", header: "Bounce Rate" },
                ]}
              />
            </div>
          )}
        </TabPanel>
        
        <TabPanel id="delivery" label="Delivery">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Delivery Rate Over Time */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Delivery Rate Over Time</h2>
              <LineChart
                data={metrics.breakdown?.map(item => ({
                  name: item.key,
                  deliveryRate: item.metrics.deliveryRate * 100,
                }))}
                xKey="name"
                yKeys={["deliveryRate"]}
                colors={["#6366F1"]}
                unit="%"
              />
            </div>
            
            {/* Bounce Rate Over Time */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Bounce Rate Over Time</h2>
              <LineChart
                data={metrics.breakdown?.map(item => ({
                  name: item.key,
                  bounceRate: item.metrics.bounceRate * 100,
                }))}
                xKey="name"
                yKeys={["bounceRate"]}
                colors={["#EF4444"]}
                unit="%"
              />
            </div>
          </div>
          
          {/* Delivery Status by Template */}
          {filters.groupBy === "template" && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-xl font-semibold mb-4">Delivery Status by Template</h2>
              <BarChart
                data={metrics.breakdown?.map(item => ({
                  name: item.key,
                  delivered: item.metrics.delivered,
                  bounced: item.metrics.bounced,
                  failed: item.metrics.sent - item.metrics.delivered - item.metrics.bounced,
                }))}
                xKey="name"
                yKeys={["delivered", "bounced", "failed"]}
                colors={["#10B981", "#EF4444", "#F59E0B"]}
                stacked={true}
              />
            </div>
          )}
        </TabPanel>
        
        <TabPanel id="engagement" label="Engagement">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Open Rate Over Time */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Open Rate Over Time</h2>
              <LineChart
                data={metrics.breakdown?.map(item => ({
                  name: item.key,
                  openRate: item.metrics.openRate * 100,
                }))}
                xKey="name"
                yKeys={["openRate"]}
                colors={["#10B981"]}
                unit="%"
              />
            </div>
            
            {/* Click Rate Over Time */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Click Rate Over Time</h2>
              <LineChart
                data={metrics.breakdown?.map(item => ({
                  name: item.key,
                  clickRate: item.metrics.clickRate * 100,
                }))}
                xKey="name"
                yKeys={["clickRate"]}
                colors={["#F59E0B"]}
                unit="%"
              />
            </div>
          </div>
          
          {/* Click-to-Open Rate by Template */}
          {filters.groupBy === "template" && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-xl font-semibold mb-4">Click-to-Open Rate by Template</h2>
              <BarChart
                data={metrics.breakdown?.map(item => ({
                  name: item.key,
                  clickToOpenRate: item.metrics.clickToOpenRate * 100,
                }))}
                xKey="name"
                yKeys={["clickToOpenRate"]}
                colors={["#6366F1"]}
                unit="%"
              />
            </div>
          )}
        </TabPanel>
        
        <TabPanel id="queue" label="Queue">
          {queueStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard
                  title="Total Emails"
                  value={formatNumber(queueStats.total)}
                  subtitle="Total emails in queue"
                />
                
                <MetricCard
                  title="Pending"
                  value={formatNumber(queueStats.pending)}
                  status={queueStats.pending > 100 ? "warning" : "success"}
                  subtitle="Emails waiting to be sent"
                />
                
                <MetricCard
                  title="Processing"
                  value={formatNumber(queueStats.processing)}
                  subtitle="Emails currently being sent"
                />
                
                <MetricCard
                  title="Failed"
                  value={formatNumber(queueStats.failed)}
                  status={queueStats.failed > 0 ? "error" : "success"}
                  subtitle="Emails that failed to send"
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Queue Status */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-xl font-semibold mb-4">Queue Status</h2>
                  <PieChart
                    data={[
                      { name: "Pending", value: queueStats.pending },
                      { name: "Processing", value: queueStats.processing },
                      { name: "Completed", value: queueStats.completed },
                      { name: "Failed", value: queueStats.failed },
                    ]}
                    colors={["#F59E0B", "#6366F1", "#10B981", "#EF4444"]}
                  />
                </div>
                
                {/* Queue by Priority */}
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-xl font-semibold mb-4">Queue by Priority</h2>
                  <PieChart
                    data={[
                      { name: "Critical", value: queueStats.byPriority.critical },
                      { name: "High", value: queueStats.byPriority.high },
                      { name: "Medium", value: queueStats.byPriority.medium },
                      { name: "Low", value: queueStats.byPriority.low },
                    ]}
                    colors={["#EF4444", "#F59E0B", "#6366F1", "#94A3B8"]}
                  />
                </div>
              </div>
              
              {/* Processing Stats */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="text-xl font-semibold mb-4">Processing Stats</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    title="Processed"
                    value={formatNumber(queueStats.processingStats.processed)}
                    size="small"
                  />
                  
                  <MetricCard
                    title="Successful"
                    value={formatNumber(queueStats.processingStats.successful)}
                    size="small"
                  />
                  
                  <MetricCard
                    title="Failed"
                    value={formatNumber(queueStats.processingStats.failed)}
                    size="small"
                  />
                  
                  <MetricCard
                    title="Retried"
                    value={formatNumber(queueStats.processingStats.retried)}
                    size="small"
                  />
                  
                  <MetricCard
                    title="Cancelled"
                    value={formatNumber(queueStats.processingStats.cancelled)}
                    size="small"
                  />
                  
                  <MetricCard
                    title="Rate Delayed"
                    value={formatNumber(queueStats.processingStats.rateDelayed)}
                    size="small"
                  />
                  
                  <MetricCard
                    title="Domain Delayed"
                    value={formatNumber(queueStats.processingStats.domainDelayed)}
                    size="small"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-4">
              <Alert type="info" title="Queue Service Not Active">
                The email queue service is not currently active. Queue statistics are only available when using the queue service.
              </Alert>
            </div>
          )}
        </TabPanel>
      </Tabs>
    </div>
  );
}
