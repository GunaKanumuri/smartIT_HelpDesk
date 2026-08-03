'use client'

import { useEffect, useState } from 'react'
import * as api from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function AnalyticsPage() {
  const [tickets, setTickets] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  useEffect(() => { api.getTickets().then(d => { setTickets(d); setLoading(false) }).catch(() => setLoading(false)) }, [])
  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-svk-border border-t-svk-accent rounded-full animate-spin" /></div>

  if (tickets.length === 0) return <div className="text-center py-16 text-svk-text-muted text-sm bg-svk-bg-card border border-svk-border rounded-xl">No data yet.</div>

  const byCat: Record<string, number> = {}; tickets.forEach((t: any) => { byCat[t.category] = (byCat[t.category] || 0) + 1 })
  const catData = Object.entries(byCat).map(([n, v]) => ({ n, v }))
  const urg = { High: 0, Medium: 0, Low: 0 }; tickets.forEach((t: any) => { if (t.urgency in urg) (urg as any)[t.urgency]++ })
  const urgData = Object.entries(urg).map(([n, v]) => ({ n, v }))

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Analytics</h1>
      <p className="text-sm text-svk-text-muted mb-6">{tickets.length} total tickets</p>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-svk-bg-card border border-svk-border rounded-xl p-5 shadow-svk-sm">
          <h2 className="font-semibold text-sm mb-4">By category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData}>
              <XAxis dataKey="n" tick={{ fill: '#9b9a97', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9b9a97', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e9e9e7', borderRadius: 8 }} />
              <Bar dataKey="v" fill="#2d7ff9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-svk-bg-card border border-svk-border rounded-xl p-5 shadow-svk-sm">
          <h2 className="font-semibold text-sm mb-4">By urgency</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={urgData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="v" label={({ n, percent }) => `${n} ${(percent * 100).toFixed(0)}%`}>
                {urgData.map((_, i) => <Cell key={i} fill={['#e03e3e', '#d97706', '#0ba35b'][i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e9e9e7', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
