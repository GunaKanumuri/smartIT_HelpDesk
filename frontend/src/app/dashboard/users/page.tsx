'use client'

import { useEffect, useState } from 'react'
import * as api from '@/lib/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [em, setEm] = useState(''); const [pw, setPw] = useState(''); const [role, setRole] = useState('agent'); const [nm, setNm] = useState(''); const [err, setErr] = useState('')

  const load = () => { setLoading(true); api.getTeam().then(d => { setUsers(d); setLoading(false) }).catch(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const add = async () => {
    setErr(''); try { await api.addTeamMember({ email: em, password: pw, role, display_name: nm }); setShowAdd(false); setEm(''); setPw(''); setNm(''); load() } catch (e: any) { setErr(e.message) }
  }
  const toggle = async (id: number, active: boolean) => { await api.updateTeamMember(id, { is_active: !active }); load() }

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-svk-border border-t-svk-accent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-xl font-bold">Team</h1><p className="text-sm text-svk-text-muted">{users.length} members</p></div>
        <Button onClick={() => setShowAdd(true)} size="sm">+ Add</Button>
      </div>
      <div className="bg-svk-bg-card border border-svk-border rounded-xl shadow-svk-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-svk-border text-svk-text-muted text-xs uppercase tracking-wider">
            <th className="text-left p-3 font-medium">Name</th><th className="text-left p-3 font-medium">Email</th><th className="text-left p-3 font-medium">Role</th><th className="text-left p-3 font-medium">Status</th><th className="text-right p-3 font-medium">Action</th>
          </tr></thead>
          <tbody>{users.map((u: any) => (
            <tr key={u.id} className="border-b border-svk-border/50 hover:bg-svk-bg-hover transition-colors">
              <td className="p-3 font-medium">{u.display_name || u.email.split('@')[0]}</td>
              <td className="p-3 text-svk-text-muted">{u.email}</td>
              <td className="p-3"><Badge variant={u.role === 'owner' ? 'danger' : u.role === 'admin' ? 'warning' : u.role === 'agent' ? 'accent' : 'default'}>{u.role}</Badge></td>
              <td className="p-3">{u.is_active ? <span className="text-svk-green text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-svk-green" />Active</span> : <span className="text-svk-text-muted text-xs">Inactive</span>}</td>
              <td className="p-3 text-right">{u.role !== 'owner' && <button onClick={() => toggle(u.id, u.is_active)} className="text-xs text-svk-text-muted hover:text-svk-coral">{u.is_active ? 'Deactivate' : 'Activate'}</button>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add team member">
        <div className="space-y-3">
          {err && <div className="p-3 rounded-lg bg-svk-coral-light text-svk-coral text-sm">{err}</div>}
          <Input label="Email" value={em} onChange={e => setEm(e.target.value)} placeholder="colleague@example.com" />
          <Input label="Name" optional value={nm} onChange={e => setNm(e.target.value)} />
          <Input label="Password" type="password" value={pw} onChange={e => setPw(e.target.value)} />
          <div className="mb-3"><label className="block text-sm text-svk-text-secondary mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-white border border-svk-border rounded-lg px-3 py-2 text-sm outline-none">
              <option value="agent">Agent</option><option value="admin">Admin</option><option value="viewer">Viewer</option>
            </select></div>
          <div className="flex gap-2"><Button onClick={add} className="flex-1">Add</Button><Button variant="ghost" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button></div>
        </div>
      </Modal>
    </div>
  )
}
