/**
 * Line Chart Component
 * 
 * A component for displaying line charts using SVG (HonoX compatible).
 */

// Define interfaces locally (following AI-first principles)
interface LineChartProps {
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
 * Line Chart Component for HonoX
 */
export function LineChart({ data = [], xKey, yKeys, colors, unit, height = 300 }: LineChartProps) {
  // Default colors if not provided
  const defaultColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
  const lineColors = colors || defaultColors;
  
  if (data.length === 0) {
    return (
      <div class="w-full bg-white p-4 rounded-lg shadow flex items-center justify-center" style={{ height: `${height}px` }}>
        <p class="text-gray-500">No data available</p>
      </div>
    );
  }
  
  // Calculate dimensions
  const padding = 40;
  const chartWidth = 400;
  const chartHeight = height - 80; // Leave space for legend
  
  // Calculate min/max values for scaling
  const allValues = data.flatMap(item => yKeys.map(key => Number(item[key]) || 0));
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues, 1);
  const valueRange = maxValue - minValue || 1;
  
  // Generate SVG paths for each line
  const generatePath = (yKey: string) => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * (chartWidth - 2 * padding) + padding;
      const value = Number(item[yKey]) || 0;
      const y = chartHeight - padding - ((value - minValue) / valueRange) * (chartHeight - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };
  
  return (
    <div class="w-full bg-white p-4 rounded-lg shadow">
      <div class="flex flex-col" style={{ height: `${height}px` }}>
        {/* Chart Area */}
        <div class="flex-1">
          <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} class="overflow-visible">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" stroke-width="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Lines */}
            {yKeys.map((yKey, index) => (
              <g key={yKey}>
                <path
                  d={generatePath(yKey)}
                  fill="none"
                  stroke={lineColors[index % lineColors.length]}
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                {/* Data points */}
                {data.map((item, dataIndex) => {
                  const x = (dataIndex / (data.length - 1)) * (chartWidth - 2 * padding) + padding;
                  const value = Number(item[yKey]) || 0;
                  const y = chartHeight - padding - ((value - minValue) / valueRange) * (chartHeight - 2 * padding);
                  return (
                    <circle
                      key={dataIndex}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={lineColors[index % lineColors.length]}
                      class="hover:r-6 transition-all duration-200"
                    >
                      <title>{`${item[xKey]}: ${value}${unit || ''}`}</title>
                    </circle>
                  );
                })}
              </g>
            ))}
            
            {/* X-axis labels */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * (chartWidth - 2 * padding) + padding;
              return (
                <text
                  key={index}
                  x={x}
                  y={chartHeight - 10}
                  text-anchor="middle"
                  class="text-xs fill-gray-600"
                >
                  {String(item[xKey])}
                </text>
              );
            })}
          </svg>
        </div>
        
        {/* Legend */}
        <div class="flex flex-wrap justify-center mt-4 space-x-4">
          {yKeys.map((key, index) => (
            <div key={key} class="flex items-center space-x-1">
              <div
                class="w-3 h-3 rounded-full"
                style={{ backgroundColor: lineColors[index % lineColors.length] }}
              />
              <span class="text-xs text-gray-600">
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
