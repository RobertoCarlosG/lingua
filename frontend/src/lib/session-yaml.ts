import yaml from 'js-yaml'
import { LANGUAGE_CODES, type Language } from '@/lib/languages'
import type { SessionLog } from '@/types/database'

export type NewSessionLog = Omit<SessionLog, 'id' | 'created_at' | 'user_id'>

export const SESSIONS_TEMPLATE_YML = `language: en
sessions:
  - date: "2026-06-13"
    duration_minutes: 45
    activities: ["repaso", "lectura"]
    words_reviewed: 20
    errors_made: 2
    notes: "Repaso matutino de verbos irregulares"

  - date: "2026-06-12"
    duration_minutes: 30
    activities: ["repaso"]
    words_reviewed: 15
    errors_made: 0
    notes: ""
`

export interface SessionsYamlParseResult {
  sessions: NewSessionLog[]
  language: Language | null
  errors: string[]
}

export function downloadSessionsTemplate(): void {
  const blob = new Blob([SESSIONS_TEMPLATE_YML], { type: 'text/yaml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'lingua-sesiones-plantilla.yml'
  anchor.click()
  URL.revokeObjectURL(url)
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function parseSessionsFromYaml(text: string): SessionsYamlParseResult {
  try {
    const raw = yaml.load(text)
    if (!raw || typeof raw !== 'object') {
      return { sessions: [], language: null, errors: ['YAML inválido'], }
    }

    const obj = raw as Record<string, unknown>
    const errors: string[] = []
    const lang = obj.language as string | undefined

    if (!lang || !LANGUAGE_CODES.includes(lang as Language)) {
      errors.push(`Falta o es inválido "language" (${LANGUAGE_CODES.join(' | ')})`)
    }

    if (!Array.isArray(obj.sessions) || obj.sessions.length === 0) {
      errors.push('Falta el array "sessions" con al menos una entrada')
      return { sessions: [], language: null, errors }
    }

    const sessions: NewSessionLog[] = []

    obj.sessions.forEach((item, i) => {
      if (!item || typeof item !== 'object') {
        errors.push(`sessions[${i}]: entrada inválida`)
        return
      }
      const s = item as Record<string, unknown>
      const date = String(s.date ?? '')
      if (!DATE_RE.test(date)) {
        errors.push(`sessions[${i}]: "date" debe ser YYYY-MM-DD`)
      }

      const duration = Number(s.duration_minutes ?? 0)
      if (!Number.isFinite(duration) || duration < 1) {
        errors.push(`sessions[${i}]: "duration_minutes" debe ser >= 1`)
      }

      const wordsReviewed = Number(s.words_reviewed ?? 0)
      const errorsMade = Number(s.errors_made ?? 0)
      if (!Number.isFinite(wordsReviewed) || wordsReviewed < 0) {
        errors.push(`sessions[${i}]: "words_reviewed" inválido`)
      }
      if (!Number.isFinite(errorsMade) || errorsMade < 0) {
        errors.push(`sessions[${i}]: "errors_made" inválido`)
      }

      if (errors.some(e => e.startsWith(`sessions[${i}]`))) return

      sessions.push({
        language: lang as Language,
        date,
        duration_minutes: Math.round(duration),
        activities: Array.isArray(s.activities) ? s.activities.map(String) : [],
        words_reviewed: Math.round(wordsReviewed),
        errors_made: Math.round(errorsMade),
        notes: String(s.notes ?? ''),
      })
    })

    return {
      sessions: errors.length === 0 || sessions.length > 0 ? sessions : [],
      language: lang as Language ?? null,
      errors,
    }
  } catch {
    return { sessions: [], language: null, errors: ['YAML inválido — revisa la sintaxis'] }
  }
}
