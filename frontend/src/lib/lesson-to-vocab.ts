import type { LessonYAML, VocabWord } from '@/types/database'
import { initialSrs } from './srs'

export type NewVocabWord = Omit<VocabWord, 'id' | 'created_at' | 'user_id' | 'due_at'> & { due_at: string }

/** Convierte el vocabulario de una lección YAML en filas listas para
 * insertar en vocab_words, con el SRS inicial (vencen de inmediato). */
export function lessonVocabToWords(lesson: LessonYAML, now: Date): NewVocabWord[] {
  const srs = initialSrs(now)
  return (lesson.vocabulary ?? [])
    .filter(item => item.word && item.translation)
    .map(item => ({
      language: lesson.language,
      word: item.word,
      translation: item.translation,
      ipa: item.ipa ?? '',
      definition: item.definition ?? '',
      example_sentence: item.example ?? '',
      tags: item.tags ?? [],
      status: 'new' as const,
      times_seen: 0,
      times_correct: 0,
      last_reviewed_at: null,
      ...srs,
    }))
}
