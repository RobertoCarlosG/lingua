import { useEffect, useState } from 'react'
import { Plus, Search, ChevronDown, BookMarked, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { lookupWord } from '@/lib/dictionary'
import { initialSrs } from '@/lib/srs'
import { useStore } from '@/lib/store'
import { cn, formatDate } from '@/lib/utils'
import type { VocabWord, WordStatus } from '@/types/database'

const STATUS_LABELS: Record<WordStatus, string> = {
  new: 'Nueva',
  learning: 'Aprendiendo',
  known: 'Conocida',
  mastered: 'Dominada',
}

const STATUS_COLORS: Record<WordStatus, string> = {
  new: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  learning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  known: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  mastered: 'bg-green-500/20 text-green-300 border-green-500/30',
}

function AddWordModal({ onClose, onSave, language }: {
  onClose: () => void
  onSave: (word: Omit<VocabWord, 'id' | 'created_at' | 'user_id'>) => void
  language: 'en' | 'pt'
}) {
  const [form, setForm] = useState({
    word: '', ipa: '', translation: '', definition: '', example_sentence: '', tags: '',
  })
  const [looking, setLooking] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  async function handleLookup() {
    if (!form.word.trim() || looking) return
    setLooking(true)
    setLookupError(null)
    const entry = await lookupWord(form.word)
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
      setLookupError('No se encontró en el diccionario')
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

  const inputClass = "glass-input w-full px-3 py-2 text-sm"

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-6 animate-slide-up">
        <h2 className="text-base font-semibold text-white mb-4">Agregar palabra</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Palabra</label>
              <div className="flex gap-1.5">
                <input className={inputClass} value={form.word} onChange={e => setForm(f => ({...f, word: e.target.value}))} placeholder="accomplish" required />
                {language === 'en' && (
                  <button
                    type="button"
                    onClick={handleLookup}
                    disabled={looking || !form.word.trim()}
                    title="Buscar en el diccionario"
                    className="glass-btn px-2.5 text-blue-300 disabled:opacity-40 shrink-0"
                  >
                    {looking ? <Loader2 size={14} className="animate-spin" /> : <BookMarked size={14} />}
                  </button>
                )}
              </div>
              {lookupError && <p className="text-xs text-amber-400 mt-1">{lookupError}</p>}
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">IPA</label>
              <input className={inputClass} value={form.ipa} onChange={e => setForm(f => ({...f, ipa: e.target.value}))} placeholder="/əˈkʌmplɪʃ/" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Traducción</label>
            <input className={inputClass} value={form.translation} onChange={e => setForm(f => ({...f, translation: e.target.value}))} placeholder="lograr, alcanzar" required />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Definición</label>
            <input className={inputClass} value={form.definition} onChange={e => setForm(f => ({...f, definition: e.target.value}))} placeholder="To succeed in doing something difficult" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Ejemplo</label>
            <input className={inputClass} value={form.example_sentence} onChange={e => setForm(f => ({...f, example_sentence: e.target.value}))} placeholder="She has accomplished all her goals." />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Tags (separados por coma)</label>
            <input className={inputClass} value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="verbo, formal, C1" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 glass-btn px-4 py-2 text-sm text-white/60">Cancelar</button>
            <button type="submit" className="flex-1 bg-blue-600/80 hover:bg-blue-600 border border-blue-500/30 rounded-xl px-4 py-2 text-sm text-white transition-all">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function VocabularyPage() {
  const { activeLanguage } = useStore()
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
      .insert({ ...wordData, user_id: 'demo-user' })
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

  const isEN = activeLanguage === 'en'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-semibold ${isEN ? 'text-gradient-en' : 'text-gradient-pt'}`}>
            Vocabulario {isEN ? '🇺🇸' : '🇧🇷'}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">{words.length} palabras en tu glosario</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
            isEN
              ? 'bg-blue-500/15 border-blue-500/25 text-blue-300 hover:bg-blue-500/25'
              : 'bg-purple-500/15 border-purple-500/25 text-purple-300 hover:bg-purple-500/25'
          )}
        >
          <Plus size={15} />
          Agregar
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="glass-input w-full pl-9 pr-3 py-2 text-sm"
            placeholder="Buscar palabra..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'new', 'learning', 'known', 'mastered'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs border transition-all',
                filterStatus === s
                  ? 'bg-white/15 border-white/25 text-white'
                  : 'bg-transparent border-white/10 text-white/40 hover:text-white/70'
              )}
            >
              {s === 'all' ? 'Todas' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass p-8 text-center text-white/30 text-sm">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="glass p-10 text-center">
          <p className="text-white/30 text-sm">No hay palabras aún.</p>
          <button onClick={() => setShowAdd(true)} className="text-blue-400 text-sm mt-2 hover:underline">
            Agrega tu primera palabra
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(word => (
            <div key={word.id} className="glass overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
                onClick={() => setExpanded(expanded === word.id ? null : word.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{word.word}</span>
                    {word.ipa && (
                      <span className="text-xs font-mono text-white/30">{word.ipa}</span>
                    )}
                  </div>
                  <p className="text-sm text-white/50 truncate">{word.translation}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('text-xs px-2 py-0.5 rounded-md border', STATUS_COLORS[word.status])}>
                    {STATUS_LABELS[word.status]}
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn('text-white/30 transition-transform', expanded === word.id && 'rotate-180')}
                  />
                </div>
              </button>

              {expanded === word.id && (
                <div className="px-4 pb-4 border-t border-white/[0.06] pt-3 space-y-3 animate-fade-in">
                  {word.definition && (
                    <p className="text-sm text-white/60">{word.definition}</p>
                  )}
                  {word.example_sentence && (
                    <p className="text-sm text-white/40 italic">"{word.example_sentence}"</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-1 flex-wrap">
                      {word.tags?.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded bg-white/[0.06] text-white/40">{tag}</span>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {(['new', 'learning', 'known', 'mastered'] as WordStatus[]).map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(word.id, s)}
                          className={cn(
                            'px-2 py-1 rounded-lg text-xs border transition-all',
                            word.status === s
                              ? STATUS_COLORS[s]
                              : 'border-white/10 text-white/30 hover:text-white/60'
                          )}
                        >
                          {STATUS_LABELS[s]}
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
