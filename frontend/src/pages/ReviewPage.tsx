import { useEffect, useRef, useState } from 'react'
import { Brain, CheckCircle2, RotateCcw, Upload, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { languageConfig } from '@/lib/languages'
import { cn } from '@/lib/utils'
import { YamlFileButton } from '@/components/import/YamlFileButton'
import { importVocabWords } from '@/lib/import-vocab'
import { downloadVocabTemplate, parseVocabFromYaml } from '@/lib/vocab-yaml'
import { reviewWord, statusForInterval, type Rating } from '@/lib/srs'
import { toDateString } from '@/lib/stats'
import { Flashcard } from '@/components/review/Flashcard'
import type { VocabWord } from '@/types/database'

const SESSION_LIMIT = 30

export function ReviewPage() {
  const { activeLanguage } = useStore()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [queue, setQueue] = useState<VocabWord[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [missed, setMissed] = useState(0)
  const [finished, setFinished] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const startedAt = useRef(Date.now())

  useEffect(() => {
    fetchDueWords()
  }, [activeLanguage])

  async function fetchDueWords() {
    setLoading(true)
    setIndex(0)
    setMissed(0)
    setFinished(false)
    startedAt.current = Date.now()
    const { data } = await supabase
      .from('vocab_words')
      .select('*')
      .eq('language', activeLanguage)
      .or(`due_at.is.null,due_at.lte.${new Date().toISOString()}`)
      .order('due_at', { ascending: true, nullsFirst: true })
      .limit(SESSION_LIMIT)
    setQueue(data ?? [])
    setLoading(false)
  }

  async function handleYamlUpload(text: string) {
    if (!user || importing) return
    setImportError(null)
    setImportMsg(null)
    setImporting(true)

    const parsed = parseVocabFromYaml(text)
    if (parsed.errors.length > 0 && parsed.words.length === 0) {
      setImportError(parsed.errors.join(' · '))
      setImporting(false)
      return
    }
    if (parsed.language && parsed.language !== activeLanguage) {
      setImportError(t('yamlImport.languageMismatch', {
        yamlLang: languageConfig(parsed.language).label,
        activeLang: languageConfig(activeLanguage).label,
      }))
      setImporting(false)
      return
    }

    const result = await importVocabWords(activeLanguage, parsed.words)
    if (result.error) {
      setImportError(t('yamlImport.importError'))
    } else {
      setImportMsg(t('yamlImport.importSuccess', { imported: result.imported, skipped: result.skipped }))
      await fetchDueWords()
    }
    setImporting(false)
  }

  async function handleRate(rating: Rating) {
    const word = queue[index]
    const now = new Date()
    const next = reviewWord(
      { interval_days: word.interval_days ?? 0, ease: word.ease ?? 2.5, due_at: word.due_at ?? now.toISOString() },
      rating,
      now
    )
    const wasMissed = rating === 'again'
    if (wasMissed) setMissed(m => m + 1)

    await Promise.all([
      supabase
        .from('vocab_words')
        .update({
          ...next,
          status: statusForInterval(next.interval_days),
          times_seen: (word.times_seen ?? 0) + 1,
          times_correct: (word.times_correct ?? 0) + (wasMissed ? 0 : 1),
          last_reviewed_at: now.toISOString(),
        })
        .eq('id', word.id),
      supabase.from('reviews').insert({ word_id: word.id, rating }),
    ])

    if (index + 1 >= queue.length) {
      await logSession()
      setFinished(true)
    } else {
      setIndex(i => i + 1)
    }
  }

  async function logSession() {
    const minutes = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000))
    await supabase.from('session_logs').insert({
      language: activeLanguage,
      date: toDateString(new Date()),
      duration_minutes: minutes,
      activities: ['repaso'],
      words_reviewed: queue.length,
      errors_made: missed,
      notes: '',
    })
  }

  const config = languageConfig(activeLanguage)
  const progress = queue.length > 0 ? (index / queue.length) * 100 : 0

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gradient-brand">
            {t('review.title')} {config.flag}
          </h1>
          <p className="text-2 text-sm mt-1">{t('review.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!loading && queue.length > 0 && !finished && (
            <span className="glass-sm px-3 py-2 text-sm font-medium text-2">
              {index + 1} / {queue.length}
            </span>
          )}
          <button
            type="button"
            onClick={downloadVocabTemplate}
            className="btn btn-ghost text-xs py-2 px-3"
          >
            <Download size={14} />
            <span className="hidden sm:inline">{t('yamlImport.downloadVocabTemplate')}</span>
          </button>
          <YamlFileButton
            label={t('yamlImport.upload')}
            icon={importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            onLoad={handleYamlUpload}
            disabled={importing}
            className="text-xs py-2 px-3"
            labelClassName="hidden sm:inline"
          />
        </div>
      </div>

      {importError && (
        <div className="glass-sm p-3 border border-red-500/25 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle size={13} className="shrink-0" />
          {importError}
        </div>
      )}
      {importMsg && (
        <div className="glass-sm p-3 border border-green-500/25 text-xs text-green-300 flex items-center gap-2">
          <CheckCircle size={13} className="shrink-0" />
          {importMsg}
        </div>
      )}

      {loading ? (
        <div className="glass p-10 text-center text-3 text-sm">{t('common.loading')}</div>
      ) : queue.length === 0 ? (
        <div className="glass p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-white/[0.06] flex items-center justify-center mx-auto">
            <Brain size={26} className="text-3" />
          </div>
          <p className="text-2 text-sm font-medium">{t('review.emptyTitle')}</p>
          <p className="text-3 text-xs">{t('review.emptyHint')}</p>
        </div>
      ) : finished ? (
        <div className="glass p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-green-500/15 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} className="text-green-400" />
          </div>
          <p className="text-1 text-xl font-semibold">{t('review.done')}</p>
          <p className="text-2 text-sm">
            {t('review.summary', { total: queue.length, missed })}
          </p>
          <button onClick={fetchDueWords} className="btn btn-ghost mx-auto mt-2">
            <RotateCcw size={15} />
            {t('review.more')}
          </button>
        </div>
      ) : (
        <>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', config.theme.progress)}
              style={{ width: `${progress}%` }}
            />
          </div>
          <Flashcard word={queue[index]} onRate={handleRate} />
        </>
      )}
    </div>
  )
}
