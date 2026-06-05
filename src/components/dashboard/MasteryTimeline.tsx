import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { MasteryDataPoint } from '../../api/client'

interface MasteryTimelineProps {
  data: MasteryDataPoint[]
}

export function MasteryTimeline({ data }: MasteryTimelineProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        No mastery data yet
      </div>
    )
  }

  const chartData = data.map(point => ({
    day: new Date(point.start_day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    newly_mastered: point.newly_mastered,
    cumulative_mastered: point.cumulative_mastered,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
        <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
          labelStyle={{ color: '#1f2937' }}
        />
        <Legend />
        <Bar dataKey="newly_mastered" fill="#10b981" name="Mastered Today" />
        <Bar dataKey="cumulative_mastered" fill="#3b82f6" name="Total Mastered" />
      </BarChart>
    </ResponsiveContainer>
  )
}
