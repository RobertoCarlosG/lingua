import { useEffect, useState } from 'react'
import { Plus, AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { languageConfig, type Language } from '@/lib/languages'
import { dateLocale } from '@/lib/i18n'
import { cn, formatDate } from '@/lib/utils'
import type { ErrorEntry } from '@/types/database'

const CATEGORIES = ['gramática', 'vocabulario', 'pronunciación', 'preposición', 'tiempo verbal', 'otro']

function AddErrorModal({ onClose, onSave, language }: {
  onClose: () => void
  onSave: (e: Omit<ErrorEntry, 'id' | 'created_at' | 'user_id'>) => void
  language: Language
}) {
  const { t } = useTranslation()
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

  const inputClass = "glass-input w-full px-3 py-2.5 text-sm"

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-6 animate-slide-up">
        <h2 className="text-base font-semibold text-1 mb-5">{t('errors.modalTitle')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-2 font-medium mb-1.5 block">{t('errors.errorText')}</label>
            <input className={inputClass} value={form.error_text} onChange={e => setForm(f => ({...f, error_text: e.target.value}))} placeholder='"I have went to..."' required />
          </div>
          <div>
            <label className="text-xs text-2 font-medium mb-1.5 block">{t('errors.correction')}</label>
            <input className={inputClass} value={form.correction} onChange={e => setForm(f => ({...f, correction: e.target.value}))} placeholder='"I have gone to..."' required />
          </div>
          <div>
            <label className="text-xs text-2 font-medium mb-1.5 block">{t('errors.explanation')}</label>
            <textarea className={cn(inputClass, "resize-none h-20")} value={form.explanation} onChange={e => setForm(f => ({...f, explanation: e.target.value}))} placeholder="go → gone (participio irregular)" />
          </div>
          <div>
            <label className="text-xs text-2 font-medium mb-1.5 block">{t('errors.category')}</label>
            <select className={cn(inputClass, "[&>option]:bg-ink-900")} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary flex-1">{t('common.save')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ErrorBankPage() {
  const { activeLanguage } = useStore()
  const { user } = useAuth()
  const { t } = useTranslation()
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

  const config = languageConfig(activeLanguage)
  const recurring = errors.filter(e => e.is_recurring)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gradient-brand">
            {t('errors.title')} {config.flag}
          </h1>
          <p className="text-2 text-sm mt-1">
            {t('errors.subtitle', { count: errors.length, recurring: recurring.length })}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary shrink-0">
          <Plus size={16} />
          {t('errors.register')}
        </button>
      </div>

      {recurring.length > 0 && (
        <div className="glass p-5 border-amber-500/20">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <AlertTriangle size={14} className="text-amber-400" />
            </div>
            <h2 className="text-sm font-semibold text-amber-300">{t('errors.recurringTitle')}</h2>
          </div>
          <div className="space-y-2.5">
            {recurring.map(e => (
              <div key={e.id} className="flex items-start gap-3 text-sm">
                <span className="text-amber-400/60 shrink-0 font-mono text-xs mt-0.5">×{e.occurrence_count}</span>
                <div>
                  <span className="text-2 line-through">{e.error_text}</span>
                  <span className="text-3 mx-2">→</span>
                  <span className="text-1 font-medium">{e.correction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass p-10 text-center text-3 text-sm">{t('common.loading')}</div>
      ) : errors.length === 0 ? (
        <div className="glass p-12 text-center">
          <p className="text-2 text-sm">{t('errors.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {errors.map(error => (
            <div key={error.id} className={cn('glass p-5', error.is_recurring && 'border-amber-500/20')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm text-3 line-through">{error.error_text}</span>
                    <span className="text-3 text-xs">→</span>
                    <span className="text-sm text-1 font-semibold">{error.correction}</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-white/[0.07] text-3 border border-white/[0.09]">
                      {error.category}
                    </span>
                    {error.is_recurring && (
                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-300">
                        {t('errors.recurringBadge')}
                      </span>
                    )}
                  </div>
                  {error.explanation && (
                    <p className="text-xs text-2 leading-relaxed">{error.explanation}</p>
                  )}
                  <p className="text-xs text-3">{formatDate(error.created_at, dateLocale())}</p>
                </div>
                <button
                  onClick={() => markRecurring(error.id, error.occurrence_count)}
                  title={t('errors.markAgain')}
                  className="shrink-0 p-2 rounded-xl hover:bg-amber-500/10 text-3 hover:text-amber-400 transition-all"
                  aria-label={t('errors.markAgain')}
                >
                  <RefreshCw size={14} />
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
