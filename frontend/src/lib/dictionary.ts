const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface DictionaryMeaning {
  part_of_speech: string | null
  definition: string | null
  example: string | null
  synonyms: string[]
}

export interface DictionaryEntry {
  word: string
  ipa: string | null
  audio: string | null
  meanings: DictionaryMeaning[]
  translation_suggestion: string | null
}

export async function lookupWord(word: string): Promise<DictionaryEntry | null> {
  const res = await fetch(`${API_URL}/api/dictionary/${encodeURIComponent(word)}`)
  if (!res.ok) return null
  return res.json()
}

export async function generateLessonYaml(words: string[], title: string, level = 'B1'): Promise<string | null> {
  const params = new URLSearchParams({ words: words.join(','), title, level })
  const res = await fetch(`${API_URL}/api/lessons/generate?${params}`)
  if (!res.ok) return null
  return res.text()
}
