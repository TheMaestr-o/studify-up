import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { RetentionDataPoint } from '../../api/client'

interface RetentionChartProps {
  data: RetentionDataPoint[]
}

export function RetentionChart({ data }: RetentionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        No retention data yet
      </div>
    )
  }

  const chartData = data.map(point => ({
    day: new Date(point.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    retention_pct: point.retention_pct,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
        <YAxis stroke="#6b7280" domain={[0, 100]} style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          labelStyle={{ color: '#1f2937' }}
          formatter={(value) => `${value}%`}
        />
        <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Mastered (80%+)', position: 'right', fill: '#10b981', fontSize: 12 }} />
        <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Reviewing (50-80%)', position: 'right', fill: '#f59e0b', fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="retention_pct"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          fill="url(#colorRetention)"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
