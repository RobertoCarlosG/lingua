import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VocabWord } from '@/types/database'
import type { Rating } from '@/lib/srs'

const RATING_BUTTONS: { rating: Rating; label: string; className: string }[] = [
  { rating: 'again', label: 'Otra vez', className: 'border-red-500/30 text-red-300 hover:bg-red-500/15' },
  { rating: 'hard', label: 'Difícil', className: 'border-amber-500/30 text-amber-300 hover:bg-amber-500/15' },
  { rating: 'good', label: 'Bien', className: 'border-blue-500/30 text-blue-300 hover:bg-blue-500/15' },
  { rating: 'easy', label: 'Fácil', className: 'border-green-500/30 text-green-300 hover:bg-green-500/15' },
]

export function Flashcard({ word, onRate }: { word: VocabWord; onRate: (rating: Rating) => void }) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setRevealed(false)
  }, [word.id])

  return (
    <div className="glass p-8 text-center space-y-5">
      <div>
        <p className="text-3xl font-semibold text-white">{word.word}</p>
        {word.ipa && <p className="text-sm font-mono text-white/40 mt-2">{word.ipa}</p>}
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="glass-btn inline-flex items-center gap-2 px-5 py-2.5 text-sm text-white/70"
        >
          <Eye size={15} />
          Mostrar respuesta
        </button>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xl text-white/90">{word.translation}</p>
          {word.definition && <p className="text-sm text-white/50">{word.definition}</p>}
          {word.example_sentence && (
            <p className="text-sm text-white/35 italic">"{word.example_sentence}"</p>
          )}
          <div className="flex justify-center gap-2 pt-2">
            {RATING_BUTTONS.map(({ rating, label, className }) => (
              <button
                key={rating}
                onClick={() => onRate(rating)}
                className={cn('px-4 py-2 rounded-xl text-sm border bg-transparent transition-all', className)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
