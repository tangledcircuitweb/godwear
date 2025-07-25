/**
 * Bar Chart Component
 * 
 * A component for displaying bar charts using HTML/CSS (HonoX compatible).
 */

// Define interfaces locally (following AI-first principles)
interface BarChartProps {
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
 * Bar Chart Component for HonoX
 */
export function BarChart({ data = [], xKey, yKeys, colors, unit, stacked = false, height = 300 }: BarChartProps) {
  // Default colors if not provided
  const defaultColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
  const barColors = colors || defaultColors;
  
  // Calculate max value for scaling
  const maxValue = Math.max(
    ...data.flatMap(item => 
      stacked 
        ? [yKeys.reduce((sum, key) => sum + (Number(item[key]) || 0), 0)]
        : yKeys.map(key => Number(item[key]) || 0)
    ),
    1
  );
  
  return (
    <div class="w-full bg-white p-4 rounded-lg shadow">
      <div class="flex flex-col" style={{ height: `${height}px` }}>
        {/* Chart Area */}
        <div class="flex-1 flex items-end justify-around space-x-2 border-b border-gray-200 pb-2">
          {data.map((item, index) => (
            <div key={index} class="flex flex-col items-center space-y-1 flex-1">
              {/* Bars */}
              <div class="flex flex-col items-center justify-end h-full w-full max-w-16">
                {stacked ? (
                  // Stacked bars
                  <div class="flex flex-col justify-end w-full h-full">
                    {yKeys.map((key, keyIndex) => {
                      const value = Number(item[key]) || 0;
                      const heightPercent = (value / maxValue) * 100;
                      return (
                        <div
                          key={key}
                          class="w-full transition-all duration-300 hover:opacity-80"
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: barColors[keyIndex % barColors.length],
                            minHeight: value > 0 ? '2px' : '0px'
                          }}
                          title={`${key}: ${value}${unit || ''}`}
                        />
                      );
                    })}
                  </div>
                ) : (
                  // Grouped bars
                  <div class="flex justify-center items-end space-x-1 h-full w-full">
                    {yKeys.map((key, keyIndex) => {
                      const value = Number(item[key]) || 0;
                      const heightPercent = (value / maxValue) * 100;
                      return (
                        <div
                          key={key}
                          class="transition-all duration-300 hover:opacity-80"
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: barColors[keyIndex % barColors.length],
                            width: `${100 / yKeys.length}%`,
                            minHeight: value > 0 ? '2px' : '0px'
                          }}
                          title={`${key}: ${value}${unit || ''}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* X-axis label */}
              <div class="text-xs text-gray-600 text-center truncate w-full">
                {String(item[xKey])}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div class="flex flex-wrap justify-center mt-4 space-x-4">
          {yKeys.map((key, index) => (
            <div key={key} class="flex items-center space-x-1">
              <div
                class="w-3 h-3 rounded"
                style={{ backgroundColor: barColors[index % barColors.length] }}
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
