import { describe, it, expect } from 'vitest'
import { lessonVocabToWords } from './lesson-to-vocab'
import type { LessonYAML } from '@/types/database'

const NOW = new Date('2026-06-09T12:00:00Z')

function lesson(overrides: Partial<LessonYAML> = {}): LessonYAML {
  return {
    title: 'X',
    language: 'en',
    level: 'B1',
    type: 'vocabulary',
    vocabulary: [
      {
        word: 'accomplish',
        ipa: '/əˈkʌmplɪʃ/',
        translation: 'lograr',
        definition: 'To finish successfully',
        example: 'She accomplished her goal.',
        tags: ['verbo'],
      },
    ],
    ...overrides,
  }
}

describe('lessonVocabToWords', () => {
  it('mapea los items al formato de vocab_words con SRS inicial', () => {
    const [word] = lessonVocabToWords(lesson(), NOW)
    expect(word).toMatchObject({
      language: 'en',
      word: 'accomplish',
      translation: 'lograr',
      ipa: '/əˈkʌmplɪʃ/',
      definition: 'To finish successfully',
      example_sentence: 'She accomplished her goal.',
      tags: ['verbo'],
      status: 'new',
      times_seen: 0,
      times_correct: 0,
      interval_days: 0,
      ease: 2.5,
    })
    expect(new Date(word.due_at).getTime()).toBe(NOW.getTime())
  })

  it('usa strings vacíos para campos opcionales ausentes', () => {
    const [word] = lessonVocabToWords(
      lesson({ vocabulary: [{ word: 'x', translation: 'y' } as never] }),
      NOW
    )
    expect(word.ipa).toBe('')
    expect(word.definition).toBe('')
    expect(word.example_sentence).toBe('')
    expect(word.tags).toEqual([])
  })

  it('omite items sin word o translation', () => {
    const words = lessonVocabToWords(
      lesson({ vocabulary: [{ word: 'x' } as never, { word: 'ok', translation: 'bien' } as never] }),
      NOW
    )
    expect(words).toHaveLength(1)
    expect(words[0].word).toBe('ok')
  })

  it('lección sin vocabulario → lista vacía', () => {
    expect(lessonVocabToWords(lesson({ vocabulary: undefined }), NOW)).toEqual([])
  })

  it('hereda el idioma de la lección', () => {
    const words = lessonVocabToWords(lesson({ language: 'pt' }), NOW)
    expect(words[0].language).toBe('pt')
  })
})
