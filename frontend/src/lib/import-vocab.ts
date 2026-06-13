import { supabase } from './supabase'
import type { Language } from '@/types/database'
import type { NewVocabWord } from './lesson-to-vocab'

export interface VocabImportResult {
  imported: number
  skipped: number
  error?: string
}

/** Inserta palabras nuevas en vocab_words, omitiendo duplicados por idioma + word. */
export async function importVocabWords(
  language: Language,
  words: NewVocabWord[]
): Promise<VocabImportResult> {
  const scoped = words.filter(w => w.language === language)
  if (scoped.length === 0) return { imported: 0, skipped: 0 }

  const { data: existingRows, error: selectError } = await supabase
    .from('vocab_words')
    .select('word')
    .eq('language', language)
    .in('word', scoped.map(w => w.word))

  if (selectError) {
    console.error('vocab_words select failed:', selectError)
    return { imported: 0, skipped: 0, error: selectError.message }
  }

  const existing = new Set((existingRows ?? []).map(r => r.word.toLowerCase()))
  const fresh = scoped.filter(w => !existing.has(w.word.toLowerCase()))

  if (fresh.length > 0) {
    const { error: insertError } = await supabase.from('vocab_words').insert(fresh)
    if (insertError) {
      console.error('vocab_words insert failed:', insertError)
      return { imported: 0, skipped: scoped.length - fresh.length, error: insertError.message }
    }
  }

  return { imported: fresh.length, skipped: scoped.length - fresh.length }
}
