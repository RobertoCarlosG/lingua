import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { LessonYAML } from '@/types/database'

interface LessonReviewProps {
  lesson: LessonYAML
  onFinish: (score: number, total: number) => void
  onExit: () => void
}

export function LessonReview({ lesson, onFinish, onExit }: LessonReviewProps) {
  const { t } = useTranslation()
  const exercises = lesson.exercises ?? []
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  if (exercises.length === 0) {
    return (
      <div className="glass p-8 text-center space-y-4">
        <p className="text-2 text-sm">{t('lessons.reviewNoExercises')}</p>
        <button onClick={onExit} className="btn btn-primary mx-auto">{t('common.back')}</button>
      </div>
    )
  }

  const ex = exercises[index]
  const progress = (index / exercises.length) * 100

  function checkAnswer() {
    const isCorrect = answer.trim().toLowerCase() === ex.answer.trim().toLowerCase()
    setCorrect(isCorrect)
    if (isCorrect) setScore(s => s + 1)
    setChecked(true)
  }

  function next() {
    if (index + 1 >= exercises.length) {
      setFinished(true)
      onFinish(score + (correct ? 1 : 0), exercises.length)
    } else {
      setIndex(i => i + 1)
      setAnswer('')
      setChecked(false)
      setCorrect(false)
    }
  }

  if (finished) {
    const pct = Math.round((score / exercises.length) * 100)
    return (
      <div className="glass p-8 text-center space-y-4 animate-fade-in">
        <p className="text-4xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}</p>
        <p className="text-xl font-semibold text-1">{t('lessons.reviewDone')}</p>
        <p className="text-2 text-sm">
          {t('lessons.reviewScore', { score, total: exercises.length, pct })}
        </p>
        <button onClick={onExit} className="btn btn-primary mx-auto">{t('common.back')}</button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full bg-accent/70 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="glass p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-3">{index + 1} / {exercises.length}</span>
          <span className="text-xs px-2 py-0.5 rounded-lg bg-white/[0.07] text-3 border border-white/[0.08]">{ex.type}</span>
        </div>

        <p className="text-base font-medium text-1">{ex.prompt}</p>

        {ex.type === 'multiple_choice' && ex.options ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ex.options.map(opt => (
              <button
                key={opt}
                disabled={checked}
                onClick={() => setAnswer(opt)}
                className={cn(
                  'px-4 py-3 rounded-xl text-sm border text-left transition-all',
                  checked
                    ? opt === ex.answer
                      ? 'bg-green-500/15 border-green-500/30 text-green-300'
                      : opt === answer
                      ? 'bg-red-500/15 border-red-500/30 text-red-300'
                      : 'border-white/10 text-3'
                    : answer === opt
                    ? 'bg-white/10 border-white/25 text-1'
                    : 'border-white/10 text-2 hover:border-white/20 hover:bg-white/[0.05]'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <input
            className="glass-input w-full px-4 py-3 text-sm"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !checked && answer.trim() && checkAnswer()}
            disabled={checked}
            placeholder={t('lessons.reviewAnswer')}
            autoFocus
          />
        )}

        {checked && (
          <div className={cn('p-3 rounded-xl text-sm', correct ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300')}>
            {correct ? t('lessons.reviewCorrect') : t('lessons.reviewWrong', { answer: ex.answer })}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          {!checked ? (
            <button
              onClick={checkAnswer}
              disabled={!answer.trim()}
              className="btn btn-primary disabled:opacity-40"
            >
              {t('lessons.reviewCheck')}
            </button>
          ) : (
            <button onClick={next} className="btn btn-primary">
              {index + 1 >= exercises.length ? t('lessons.reviewFinish') : t('common.next')}
            </button>
          )}
        </div>
      </div>

      <button onClick={onExit} className="btn btn-ghost text-xs mx-auto">
        {t('common.cancel')}
      </button>
    </div>
  )
}
