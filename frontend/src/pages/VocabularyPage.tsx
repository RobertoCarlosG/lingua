import { useEffect, useState } from 'react'
import { Plus, Search, ChevronDown, BookMarked, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { lookupWord } from '@/lib/dictionary'
import { initialSrs } from '@/lib/srs'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { languageConfig, type Language } from '@/lib/languages'
import { cn } from '@/lib/utils'
import type { VocabWord, WordStatus } from '@/types/database'

const STATUS_COLORS: Record<WordStatus, string> = {
  new:      'bg-white/[0.08] text-2 border-white/15',
  learning: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  known:    'bg-accent/15 text-accent-soft border-accent/25',
  mastered: 'bg-green-500/15 text-green-300 border-green-500/25',
}

function AddWordModal({ onClose, onSave, language }: {
  onClose: () => void
  onSave: (word: Omit<VocabWord, 'id' | 'created_at' | 'user_id'>) => void
  language: Language
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    word: '', ipa: '', translation: '', definition: '', example_sentence: '', tags: '',
  })
  const [looking, setLooking] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  async function handleLookup() {
    if (!form.word.trim() || looking) return
    setLooking(true)
    setLookupError(null)
    const entry = await lookupWord(form.word, language)
    if (entry) {
      const meaning = entry.meanings[0]
      setForm(f => ({
        ...f,
        word: entry.word,
        ipa: entry.ipa ?? f.ipa,
        translation: entry.translation_suggestion ?? f.translation,
        definition: meaning?.definition ?? f.definition,
        example_sentence: meaning?.example ?? f.example_sentence,
        tags: f.tags || (meaning?.part_of_speech ?? ''),
      }))
    } else {
      setLookupError(t('vocab.notFound'))
    }
    setLooking(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      language,
      word: form.word,
      ipa: form.ipa,
      translation: form.translation,
      definition: form.definition,
      example_sentence: form.example_sentence,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      status: 'new',
      times_seen: 0,
      times_correct: 0,
      last_reviewed_at: null,
      ...initialSrs(new Date()),
    })
  }

  const inputClass = "glass-input w-full px-3 py-2.5 text-sm"

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-6 animate-slide-up">
        <h2 className="text-base font-semibold text-1 mb-5">{t('vocab.modalTitle')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-2 font-medium mb-1.5 block">{t('vocab.word')}</label>
              <div className="flex gap-1.5">
                <input className={inputClass} value={form.word} onChange={e => setForm(f => ({...f, word: e.target.value}))} placeholder="accomplish" required />
                {languageConfig(language).dictionary.lookup && (
                  <button
                    type="button"
                    onClick={handleLookup}
                    disabled={looking || !form.word.trim()}
                    title={t('vocab.lookupTitle')}
                    className="btn btn-ghost px-2.5 text-accent-soft disabled:opacity-40 shrink-0"
                  >
                    {looking ? <Loader2 size={14} className="animate-spin" /> : <BookMarked size={14} />}
                  </button>
                )}
              </div>
              {lookupError && <p className="text-xs text-amber-400 mt-1">{lookupError}</p>}
            </div>
            <div>
              <label className="text-xs text-2 font-medium mb-1.5 block">{t('vocab.ipa')}</label>
              <input className={inputClass} value={form.ipa} onChange={e => setForm(f => ({...f, ipa: e.target.value}))} placeholder="/əˈkʌmplɪʃ/" />
            </div>
          </div>
          <div>
            <label className="text-xs text-2 font-medium mb-1.5 block">{t('vocab.translation')}</label>
            <input className={inputClass} value={form.translation} onChange={e => setForm(f => ({...f, translation: e.target.value}))} placeholder="lograr, alcanzar" required />
          </div>
          <div>
            <label className="text-xs text-2 font-medium mb-1.5 block">{t('vocab.definition')}</label>
            <input className={inputClass} value={form.definition} onChange={e => setForm(f => ({...f, definition: e.target.value}))} placeholder="To succeed in doing something difficult" />
          </div>
          <div>
            <label className="text-xs text-2 font-medium mb-1.5 block">{t('vocab.example')}</label>
            <input className={inputClass} value={form.example_sentence} onChange={e => setForm(f => ({...f, example_sentence: e.target.value}))} placeholder="She has accomplished all her goals." />
          </div>
          <div>
            <label className="text-xs text-2 font-medium mb-1.5 block">{t('vocab.tags')}</label>
            <input className={inputClass} value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="verbo, formal, C1" />
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

export function VocabularyPage() {
  const { activeLanguage } = useStore()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [words, setWords] = useState<VocabWord[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<WordStatus | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetchWords()
  }, [activeLanguage])

  async function fetchWords() {
    setLoading(true)
    const { data } = await supabase
      .from('vocab_words')
      .select('*')
      .eq('language', activeLanguage)
      .order('created_at', { ascending: false })
    setWords(data ?? [])
    setLoading(false)
  }

  async function handleSave(wordData: Omit<VocabWord, 'id' | 'created_at' | 'user_id'>) {
    const { data } = await supabase
      .from('vocab_words')
      .insert({ ...wordData, user_id: user!.id })
      .select()
      .single()
    if (data) {
      setWords(prev => [data, ...prev])
      setShowAdd(false)
    }
  }

  async function updateStatus(id: string, status: WordStatus) {
    await supabase.from('vocab_words').update({ status }).eq('id', id)
    setWords(prev => prev.map(w => w.id === id ? { ...w, status } : w))
  }

  const filtered = words.filter(w => {
    const matchSearch = w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.translation.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || w.status === filterStatus
    return matchSearch && matchStatus
  })

  const config = languageConfig(activeLanguage)
  const statusLabel = (s: WordStatus) => t(`vocab.status.${s}`)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gradient-brand">
            {t('vocab.title')} {config.flag}
          </h1>
          <p className="text-2 text-sm mt-1">{t('vocab.subtitle', { count: words.length })}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary shrink-0">
          <Plus size={16} />
          {t('vocab.add')}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-3" />
          <input
            className="glass-input w-full pl-10 pr-3 py-2.5 text-sm"
            placeholder={t('vocab.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'new', 'learning', 'known', 'mastered'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-2 rounded-2xl text-xs border transition-all',
                filterStatus === s
                  ? 'bg-white/15 border-white/25 text-1 font-medium'
                  : 'bg-transparent border-white/10 text-3 hover:text-2 hover:border-white/20'
              )}
            >
              {s === 'all' ? t('vocab.filterAll') : statusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass p-10 text-center text-3 text-sm">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="glass p-12 text-center space-y-3">
          <p className="text-2 text-sm">{t('vocab.empty')}</p>
          <button onClick={() => setShowAdd(true)} className="text-accent-soft text-sm hover:underline">
            {t('vocab.addFirst')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(word => (
            <div key={word.id} className="glass overflow-hidden">
              <button
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
                onClick={() => setExpanded(expanded === word.id ? null : word.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-1">{word.word}</span>
                    {word.ipa && (
                      <span className="text-xs font-mono text-3">{word.ipa}</span>
                    )}
                  </div>
                  <p className="text-sm text-2 truncate mt-0.5">{word.translation}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className={cn('text-xs px-2.5 py-1 rounded-xl border', STATUS_COLORS[word.status])}>
                    {statusLabel(word.status)}
                  </span>
                  <ChevronDown
                    size={15}
                    className={cn('text-3 transition-transform duration-200', expanded === word.id && 'rotate-180')}
                  />
                </div>
              </button>

              {expanded === word.id && (
                <div className="px-5 pb-5 border-t border-white/[0.07] pt-4 space-y-3 animate-fade-in">
                  {word.definition && (
                    <p className="text-sm text-2 leading-relaxed">{word.definition}</p>
                  )}
                  {word.example_sentence && (
                    <p className="text-sm text-3 italic">"{word.example_sentence}"</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-1.5 flex-wrap">
                      {word.tags?.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-lg bg-white/[0.07] text-3 border border-white/[0.08]">{tag}</span>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      {(['new', 'learning', 'known', 'mastered'] as WordStatus[]).map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(word.id, s)}
                          className={cn(
                            'px-2.5 py-1 rounded-xl text-xs border transition-all',
                            word.status === s
                              ? STATUS_COLORS[s]
                              : 'border-white/10 text-3 hover:text-2 hover:border-white/20'
                          )}
                        >
                          {statusLabel(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddWordModal
          language={activeLanguage}
          onClose={() => setShowAdd(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
