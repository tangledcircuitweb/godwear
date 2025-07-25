/**
 * Pie Chart Component
 * 
 * A component for displaying pie charts using SVG (HonoX compatible).
 */

// Define interfaces locally (following AI-first principles)
interface PieChartProps {
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
 * Pie Chart Component for HonoX
 */
export function PieChart({ data = [], colors, height = 300 }: PieChartProps) {
  // Default colors if not provided
  const defaultColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
  const pieColors = colors || defaultColors;
  
  if (data.length === 0) {
    return (
      <div class="w-full bg-white p-4 rounded-lg shadow flex items-center justify-center" style={{ height: `${height}px` }}>
        <p class="text-gray-500">No data available</p>
      </div>
    );
  }
  
  // Calculate total and percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 80;
  const centerX = 120;
  const centerY = 120;
  
  // Generate pie slices
  let currentAngle = 0;
  const slices = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 2 * Math.PI;
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    // Calculate path for pie slice
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    currentAngle += angle;
    
    return {
      ...item,
      pathData,
      percentage: percentage * 100,
      color: pieColors[index % pieColors.length]
    };
  });
  
  return (
    <div class="w-full bg-white p-4 rounded-lg shadow">
      <div class="flex flex-col items-center" style={{ height: `${height}px` }}>
        {/* Chart Area */}
        <div class="flex-1 flex items-center justify-center">
          <svg width="240" height="240" viewBox="0 0 240 240">
            {slices.map((slice, index) => (
              <g key={slice.name}>
                <path
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="white"
                  stroke-width="2"
                  class="hover:opacity-80 transition-opacity duration-200"
                >
                  <title>{`${slice.name}: ${slice.value} (${slice.percentage.toFixed(1)}%)`}</title>
                </path>
              </g>
            ))}
          </svg>
        </div>
        
        {/* Legend */}
        <div class="flex flex-wrap justify-center mt-4 space-x-4 max-w-full">
          {slices.map((slice) => (
            <div key={slice.name} class="flex items-center space-x-1 mb-2">
              <div
                class="w-3 h-3 rounded"
                style={{ backgroundColor: slice.color }}
              />
              <span class="text-xs text-gray-600">
                {slice.name}: {slice.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
