'use client'

import { useEffect, useState } from 'react'
import * as api from '@/lib/api'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

export default function TrainPage() {
  const [model, setModel] = useState<any>(null); const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null); const [training, setTraining] = useState(false); const [result, setResult] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null)
  const loadModel = () => { setLoading(true); api.getModelInfo().then(d => { setModel(d); setLoading(false) }).catch(() => setLoading(false)) }
  useEffect(() => { loadModel() }, [])

  const train = async () => {
    if (!file) return; setTraining(true); setResult(null); setErr(null)
    try { const m = await api.trainModel(file); setResult(`✅ Accuracy: ${(m.test_accuracy * 100).toFixed(0)}%`); setFile(null); loadModel() } catch (e: any) { setErr(e.message) }
    setTraining(false)
  }

  const toggleModel = async (custom: boolean) => { await api.setActiveModel(custom); loadModel() }

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-svk-border border-t-svk-accent rounded-full animate-spin" /></div>

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Train model</h1>
      <p className="text-sm text-svk-text-muted mb-6">Train on your own messages</p>

      <div className="bg-svk-bg-card border border-svk-border rounded-xl p-5 shadow-svk-sm mb-4">
        <h2 className="font-semibold text-sm mb-3">Current model</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-svk-text-muted">Active:</span><span>{model?.label}</span></div>
          <div className="flex justify-between"><span className="text-svk-text-muted">Categories:</span><span>{model?.categories?.join(', ') || 'None'}</span></div>
          {model?.accuracy && <div className="flex justify-between"><span className="text-svk-text-muted">Accuracy:</span><span>{(model.accuracy * 100).toFixed(0)}%</span></div>}
          <div className="flex justify-between"><span className="text-svk-text-muted">Custom model:</span><Badge variant={model?.has_custom_model ? 'success' : 'default'}>{model?.has_custom_model ? 'Available' : 'Not trained'}</Badge></div>
          {model?.has_custom_model && <div className="pt-2 flex gap-2">{model?.is_custom_active ? <><Badge variant="success">✓ Active</Badge><Button variant="outline" size="sm" onClick={() => toggleModel(false)}>Use preset</Button></> : <Button size="sm" onClick={() => toggleModel(true)}>Use custom</Button>}</div>}
        </div>
      </div>

      {model?.custom_metrics && (
        <div className="bg-svk-bg-card border border-svk-border rounded-xl p-5 shadow-svk-sm mb-4">
          <h2 className="font-semibold text-sm mb-1">📊 Custom model</h2>
          <p className="text-xs text-svk-text-muted mb-3">{model.custom_metrics.n_samples || '?'} examples</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-svk-accent-light text-center"><div className="text-lg font-bold text-svk-accent">{model.custom_metrics.n_samples || '?'}</div><div className="text-xs text-svk-text-muted">Examples</div></div>
            {model.custom_metrics.test_accuracy && <div className="p-3 rounded-lg bg-svk-accent-light text-center"><div className="text-lg font-bold text-svk-accent">{(model.custom_metrics.test_accuracy * 100).toFixed(0)}%</div><div className="text-xs text-svk-text-muted">Accuracy</div></div>}
            <div className="p-3 rounded-lg bg-svk-accent-light text-center"><div className="text-lg font-bold text-svk-accent">{model.custom_metrics.categories?.length || 0}</div><div className="text-xs text-svk-text-muted">Categories</div></div>
          </div>
        </div>
      )}

      <div className="bg-svk-bg-card border border-svk-border rounded-xl p-5 shadow-svk-sm">
        <h2 className="font-semibold text-sm mb-1">🎓 Train on your data</h2>
        <p className="text-xs text-svk-text-muted mb-3">Upload CSV with <code className="text-svk-accent bg-svk-accent-light px-1 rounded text-[10px]">text</code> and <code className="text-svk-accent bg-svk-accent-light px-1 rounded text-[10px]">category</code> columns.</p>
        <div className="border-2 border-dashed border-svk-border rounded-xl p-6 text-center hover:border-svk-accent/30 cursor-pointer mb-3" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]) }}>
          <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="csv" />
          <label htmlFor="csv" className="cursor-pointer">{file ? <p className="text-sm font-medium text-svk-accent">{file.name}</p> : <><p className="text-lg mb-1">📁</p><p className="text-xs text-svk-text-muted">Click or drop CSV</p></>}</label>
        </div>
        {file && <Button onClick={train} disabled={training} className="w-full">{training ? 'Training...' : '🚀 Train'}</Button>}
        {result && <div className="mt-3 p-3 rounded-lg bg-svk-green-light text-svk-green text-sm">{result}</div>}
        {err && <div className="mt-3 p-3 rounded-lg bg-svk-coral-light text-svk-coral text-sm">{err}</div>}
      </div>
    </div>
  )
}
