import { useEffect, useState } from 'react'
import { Plus, AlertTriangle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { cn, formatDate } from '@/lib/utils'
import type { ErrorEntry } from '@/types/database'

const CATEGORIES = ['gramática', 'vocabulario', 'pronunciación', 'preposición', 'tiempo verbal', 'otro']

function AddErrorModal({ onClose, onSave, language }: {
  onClose: () => void
  onSave: (e: Omit<ErrorEntry, 'id' | 'created_at' | 'user_id'>) => void
  language: 'en' | 'pt'
}) {
  const [form, setForm] = useState({
    error_text: '', correction: '', explanation: '', category: 'gramática',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      language,
      ...form,
      is_recurring: false,
      occurrence_count: 1,
      last_seen_at: new Date().toISOString(),
    })
  }

  const inputClass = "glass-input w-full px-3 py-2 text-sm"

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-6 animate-slide-up">
        <h2 className="text-base font-semibold text-white mb-4">Registrar error</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Lo que escribiste / dijiste</label>
            <input className={inputClass} value={form.error_text} onChange={e => setForm(f => ({...f, error_text: e.target.value}))} placeholder='Ej: "I have went to..."' required />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Corrección</label>
            <input className={inputClass} value={form.correction} onChange={e => setForm(f => ({...f, correction: e.target.value}))} placeholder='Ej: "I have gone to..."' required />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Explicación</label>
            <textarea className={cn(inputClass, "resize-none h-20")} value={form.explanation} onChange={e => setForm(f => ({...f, explanation: e.target.value}))} placeholder="go → gone (participio irregular)" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Categoría</label>
            <select className={inputClass} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 glass-btn px-4 py-2 text-sm text-white/60">Cancelar</button>
            <button type="submit" className="flex-1 bg-amber-600/70 hover:bg-amber-600/90 border border-amber-500/30 rounded-xl px-4 py-2 text-sm text-white transition-all">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ErrorBankPage() {
  const { activeLanguage } = useStore()
  const { user } = useAuth()
  const [errors, setErrors] = useState<ErrorEntry[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchErrors()
  }, [activeLanguage])

  async function fetchErrors() {
    setLoading(true)
    const { data } = await supabase
      .from('error_entries')
      .select('*')
      .eq('language', activeLanguage)
      .order('occurrence_count', { ascending: false })
    setErrors(data ?? [])
    setLoading(false)
  }

  async function handleSave(errorData: Omit<ErrorEntry, 'id' | 'created_at' | 'user_id'>) {
    const { data } = await supabase
      .from('error_entries')
      .insert({ ...errorData, user_id: user!.id })
      .select()
      .single()
    if (data) {
      setErrors(prev => [data, ...prev])
      setShowAdd(false)
    }
  }

  async function markRecurring(id: string, current: number) {
    const newCount = current + 1
    await supabase
      .from('error_entries')
      .update({ occurrence_count: newCount, is_recurring: newCount >= 2, last_seen_at: new Date().toISOString() })
      .eq('id', id)
    setErrors(prev => prev.map(e =>
      e.id === id ? { ...e, occurrence_count: newCount, is_recurring: newCount >= 2 } : e
    ))
  }

  const isEN = activeLanguage === 'en'
  const recurring = errors.filter(e => e.is_recurring)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-semibold ${isEN ? 'text-gradient-en' : 'text-gradient-pt'}`}>
            Banco de errores {isEN ? '🇺🇸' : '🇧🇷'}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            {errors.length} errores · {recurring.length} recurrentes
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border bg-amber-500/15 border-amber-500/25 text-amber-300 hover:bg-amber-500/25 transition-all"
        >
          <Plus size={15} />
          Registrar
        </button>
      </div>

      {recurring.length > 0 && (
        <div className="glass border-amber-500/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-amber-400" />
            <h2 className="text-sm font-medium text-amber-300">Errores recurrentes — prestar atención</h2>
          </div>
          <div className="space-y-2">
            {recurring.map(e => (
              <div key={e.id} className="flex items-start gap-3 text-sm">
                <span className="text-amber-400/60 shrink-0">×{e.occurrence_count}</span>
                <div>
                  <span className="text-white/40 line-through">{e.error_text}</span>
                  <span className="text-white/70 mx-2">→</span>
                  <span className="text-white">{e.correction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass p-8 text-center text-white/30 text-sm">Cargando...</div>
      ) : errors.length === 0 ? (
        <div className="glass p-10 text-center">
          <p className="text-white/30 text-sm">Sin errores registrados. ¡Buen comienzo!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {errors.map(error => (
            <div key={error.id} className={cn('glass p-4', error.is_recurring && 'border-amber-500/20')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-white/40 line-through">{error.error_text}</span>
                    <span className="text-white/30">→</span>
                    <span className="text-sm text-white font-medium">{error.correction}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/[0.06] text-white/40">{error.category}</span>
                    {error.is_recurring && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/25 text-amber-300">recurrente</span>
                    )}
                  </div>
                  {error.explanation && (
                    <p className="text-xs text-white/40">{error.explanation}</p>
                  )}
                  <p className="text-xs text-white/25">{formatDate(error.created_at)}</p>
                </div>
                <button
                  onClick={() => markRecurring(error.id, error.occurrence_count)}
                  title="Marcar que ocurrió de nuevo"
                  className="shrink-0 p-1.5 rounded-lg hover:bg-amber-500/10 text-white/20 hover:text-amber-400 transition-all"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddErrorModal
          language={activeLanguage}
          onClose={() => setShowAdd(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
