import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function DashboardLineChart({ data, tone = 'light', color = '#0284c7' }) {
  const isCyber = tone === 'cyber'

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isCyber ? '#1e3a8a' : '#e2e8f0'} />
        <XAxis dataKey="label" stroke={isCyber ? '#94a3b8' : '#64748b'} tickLine={false} axisLine={false} />
        <YAxis stroke={isCyber ? '#94a3b8' : '#64748b'} tickLine={false} axisLine={false} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={3}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default DashboardLineChart
