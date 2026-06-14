import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { VocabWord } from '@/types/database'
import type { Rating } from '@/lib/srs'

const RATING_BUTTONS: { rating: Rating; labelKey: string; className: string }[] = [
  { rating: 'again', labelKey: 'flashcard.again', className: 'border-red-500/30 text-red-300 hover:bg-red-500/15 hover:border-red-500/50' },
  { rating: 'hard', labelKey: 'flashcard.hard', className: 'border-amber-500/30 text-amber-300 hover:bg-amber-500/15 hover:border-amber-500/50' },
  { rating: 'good', labelKey: 'flashcard.good', className: 'border-accent/35 text-accent-soft hover:bg-accent/15 hover:border-accent/55' },
  { rating: 'easy', labelKey: 'flashcard.easy', className: 'border-green-500/30 text-green-300 hover:bg-green-500/15 hover:border-green-500/50' },
]

export function Flashcard({ word, onRate }: { word: VocabWord; onRate: (rating: Rating) => void }) {
  const [revealed, setRevealed] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    setRevealed(false)
  }, [word.id])

  return (
    <div className="glass p-5 sm:p-8 text-center space-y-6">
      <div>
        <p className="text-3xl sm:text-4xl font-semibold text-1 tracking-tight break-all">{word.word}</p>
        {word.ipa && (
          <p className="text-sm font-mono text-3 mt-2">{word.ipa}</p>
        )}
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="btn btn-ghost mx-auto"
        >
          <Eye size={16} />
          {t('flashcard.reveal')}
        </button>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xl sm:text-2xl text-1 font-medium">{word.translation}</p>
          {word.definition && (
            <p className="text-sm text-2 max-w-sm mx-auto leading-relaxed">{word.definition}</p>
          )}
          {word.example_sentence && (
            <p className="text-sm text-3 italic max-w-sm mx-auto">"{word.example_sentence}"</p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-center sm:gap-2 pt-2">
            {RATING_BUTTONS.map(({ rating, labelKey, className }) => (
              <button
                key={rating}
                onClick={() => onRate(rating)}
                className={cn(
                  'px-2 sm:px-5 py-2.5 rounded-2xl text-sm border bg-transparent transition-all active:scale-[0.97]',
                  'min-h-[44px]',
                  className
                )}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
