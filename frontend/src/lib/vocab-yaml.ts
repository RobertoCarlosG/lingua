import yaml from 'js-yaml'
import { LANGUAGE_CODES, type Language } from '@/lib/languages'
import { parseLesson } from '@/lib/yaml-parser'
import { lessonVocabToWords, type NewVocabWord } from '@/lib/lesson-to-vocab'
import { initialSrs } from '@/lib/srs'
import type { WordStatus } from '@/types/database'

const VALID_STATUSES: WordStatus[] = ['new', 'learning', 'known', 'mastered']

export const VOCAB_LIST_TEMPLATE_YML = `language: en
words:
  - word: "accomplish"
    ipa: "/əˈkʌmplɪʃ/"
    translation: "lograr, alcanzar"
    definition: "To succeed in doing something difficult"
    example: "She has accomplished all her goals."
    tags: ["verbo", "formal"]
    status: new

  - word: "acknowledge"
    ipa: "/əkˈnɒlɪdʒ/"
    translation: "reconocer, admitir"
    definition: "To accept or admit the truth of something"
    example: "He acknowledged his mistake."
    tags: ["verbo"]
    status: new
`

export type VocabYamlSource = 'vocab-list' | 'lesson'

export interface VocabYamlParseResult {
  words: NewVocabWord[]
  language: Language | null
  errors: string[]
  source: VocabYamlSource
}

export function downloadVocabTemplate(): void {
  const blob = new Blob([VOCAB_LIST_TEMPLATE_YML], { type: 'text/yaml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'lingua-vocabulario-plantilla.yml'
  anchor.click()
  URL.revokeObjectURL(url)
}

function parseVocabList(
  obj: Record<string, unknown>,
  now: Date
): VocabYamlParseResult {
  const errors: string[] = []
  const lang = obj.language as string | undefined

  if (!lang || !LANGUAGE_CODES.includes(lang as Language)) {
    errors.push(`Falta o es inválido "language" (${LANGUAGE_CODES.join(' | ')})`)
    return { words: [], language: null, errors, source: 'vocab-list' }
  }

  if (!Array.isArray(obj.words) || obj.words.length === 0) {
    errors.push('Falta el array "words" con al menos una entrada')
    return { words: [], language: null, errors, source: 'vocab-list' }
  }

  const srs = initialSrs(now)
  const words: NewVocabWord[] = []

  obj.words.forEach((item, i) => {
    if (!item || typeof item !== 'object') {
      errors.push(`words[${i}]: entrada inválida`)
      return
    }
    const w = item as Record<string, unknown>
    if (!w.word) errors.push(`words[${i}]: falta "word"`)
    if (!w.translation) errors.push(`words[${i}]: falta "translation"`)
    if (!w.word || !w.translation) return

    let status: WordStatus = 'new'
    if (w.status !== undefined) {
      if (!VALID_STATUSES.includes(w.status as WordStatus)) {
        errors.push(`words[${i}]: "status" debe ser new | learning | known | mastered`)
      } else {
        status = w.status as WordStatus
      }
    }

    words.push({
      language: lang as Language,
      word: String(w.word),
      translation: String(w.translation),
      ipa: String(w.ipa ?? ''),
      definition: String(w.definition ?? ''),
      example_sentence: String(w.example_sentence ?? w.example ?? ''),
      tags: Array.isArray(w.tags) ? w.tags.map(String) : [],
      status,
      times_seen: 0,
      times_correct: 0,
      last_reviewed_at: null,
      ...srs,
    })
  })

  return {
    words: errors.length === 0 || words.length > 0 ? words : [],
    language: lang as Language ?? null,
    errors,
    source: 'vocab-list',
  }
}

/** Extrae vocabulario de un YAML de lista (`words`) o de lección (`vocabulary`). */
export function parseVocabFromYaml(text: string, now = new Date()): VocabYamlParseResult {
  try {
    const raw = yaml.load(text)
    if (!raw || typeof raw !== 'object') {
      return { words: [], language: null, errors: ['YAML inválido'], source: 'vocab-list' }
    }

    const obj = raw as Record<string, unknown>

    if (Array.isArray(obj.words)) {
      return parseVocabList(obj, now)
    }

    const lesson = parseLesson(text)
    if (lesson?.vocabulary?.length) {
      const words = lessonVocabToWords(lesson, now)
      if (words.length === 0) {
        return {
          words: [],
          language: lesson.language,
          errors: ['La lección no tiene entradas de vocabulario válidas'],
          source: 'lesson',
        }
      }
      return { words, language: lesson.language, errors: [], source: 'lesson' }
    }

    return {
      words: [],
      language: null,
      errors: [
        'Formato no reconocido. Usa una lista con "words:" o una lección con "vocabulary:"',
      ],
      source: 'vocab-list',
    }
  } catch {
    return { words: [], language: null, errors: ['YAML inválido — revisa la sintaxis'], source: 'vocab-list' }
  }
}
