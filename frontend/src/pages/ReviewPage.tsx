import { useEffect, useRef, useState } from 'react'
import { Brain, CheckCircle2, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import { useAuth } from '@/lib/auth'
import { languageConfig } from '@/lib/languages'
import { cn } from '@/lib/utils'
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
      supabase.from('reviews').insert({ word_id: word.id, rating, user_id: user!.id }),
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
      user_id: user!.id,
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

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-semibold ${config.theme.gradient}`}>
            {t('review.title')} {config.flag}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">{t('review.subtitle')}</p>
        </div>
        {!loading && queue.length > 0 && !finished && (
          <span className="glass-sm px-3 py-1.5 text-sm text-white/60">
            {index + 1} / {queue.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="glass p-8 text-center text-white/30 text-sm">{t('common.loading')}</div>
      ) : queue.length === 0 ? (
        <div className="glass p-10 text-center space-y-2">
          <Brain size={28} className="mx-auto text-white/20" />
          <p className="text-white/50 text-sm">{t('review.emptyTitle')}</p>
          <p className="text-white/30 text-xs">{t('review.emptyHint')}</p>
        </div>
      ) : finished ? (
        <div className="glass p-10 text-center space-y-3">
          <CheckCircle2 size={32} className="mx-auto text-green-400" />
          <p className="text-white text-lg font-medium">{t('review.done')}</p>
          <p className="text-white/50 text-sm">
            {t('review.summary', { total: queue.length, missed })}
          </p>
          <button
            onClick={fetchDueWords}
            className="glass-btn inline-flex items-center gap-2 px-4 py-2 text-sm text-white/70 mt-2"
          >
            <RotateCcw size={14} />
            {t('review.more')}
          </button>
        </div>
      ) : (
        <>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', config.theme.progress)}
              style={{ width: `${(index / queue.length) * 100}%` }}
            />
          </div>
          <Flashcard word={queue[index]} onRate={handleRate} />
        </>
      )}
    </div>
  )
}
