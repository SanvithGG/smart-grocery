import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function DashboardBarChart({ data, tone = 'light', color = '#10b981' }) {
  const isCyber = tone === 'cyber'

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isCyber ? '#312e81' : '#e2e8f0'} />
        <XAxis dataKey="label" stroke={isCyber ? '#94a3b8' : '#64748b'} tickLine={false} axisLine={false} />
        <YAxis stroke={isCyber ? '#94a3b8' : '#64748b'} tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="value" fill={color} radius={[12, 12, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default DashboardBarChart
