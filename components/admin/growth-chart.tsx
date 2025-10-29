'use client'

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface ChartDataPoint {
  date: string
  [key: string]: string | number
}

interface Dataset {
  key: string
  label: string
  color: string
}

interface GrowthChartProps {
  data: ChartDataPoint[]
  datasets: Dataset[]
  type?: 'line' | 'area' | 'bar'
  height?: number
}

export function GrowthChart({ 
  data, 
  datasets, 
  type = 'area',
  height = 300 
}: GrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  const chartConfig = {
    margin: { top: 5, right: 30, left: 20, bottom: 5 }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data} {...chartConfig}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
              iconType="line"
            />
            {datasets.map((dataset) => (
              <Line
                key={dataset.key}
                type="monotone"
                dataKey={dataset.key}
                name={dataset.label}
                stroke={dataset.color}
                strokeWidth={2}
                dot={{ fill: dataset.color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart data={data} {...chartConfig}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
            />
            {datasets.map((dataset) => (
              <Bar
                key={dataset.key}
                dataKey={dataset.key}
                name={dataset.label}
                fill={dataset.color}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        )

      case 'area':
      default:
        return (
          <AreaChart data={data} {...chartConfig}>
            <defs>
              {datasets.map((dataset) => (
                <linearGradient
                  key={`gradient-${dataset.key}`}
                  id={`gradient-${dataset.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={dataset.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={dataset.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '14px' }}
            />
            {datasets.map((dataset) => (
              <Area
                key={dataset.key}
                type="monotone"
                dataKey={dataset.key}
                name={dataset.label}
                stroke={dataset.color}
                strokeWidth={2}
                fill={`url(#gradient-${dataset.key})`}
              />
            ))}
          </AreaChart>
        )
    }
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {renderChart()}
    </ResponsiveContainer>
  )
}
