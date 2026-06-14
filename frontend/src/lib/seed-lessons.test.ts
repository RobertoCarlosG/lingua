import { describe, it, expect } from 'vitest'
import { bundledLessons, lessonsToSeed, type BundledLesson } from './seed-lessons'
import { parseLesson, validateLesson } from './yaml-parser'

describe('bundledLessons', () => {
  const all = bundledLessons()

  it('incluye los bloques precargados de inglés y portugués', () => {
    const en = all.filter(l => l.language === 'en')
    const pt = all.filter(l => l.language === 'pt')
    // 4 bloques EN × 7 archivos (6 lecciones + examen)
    expect(en.length).toBeGreaterThanOrEqual(28)
    // 2 bloques PT × 6 archivos (5 lecciones + examen)
    expect(pt.length).toBeGreaterThanOrEqual(12)
  })

  it('cada lección precargada parsea y pasa la validación sin errores', () => {
    expect(all.length).toBeGreaterThan(0)
    for (const lesson of all) {
      const parsed = parseLesson(lesson.yaml)
      expect(parsed, `${lesson.path} no parsea como YAML de lección`).not.toBeNull()
      const errors = validateLesson(parsed!)
      expect(errors, `${lesson.path}: ${errors.join('; ')}`).toEqual([])
    }
  })

  it('no hay títulos duplicados dentro del mismo idioma', () => {
    const keys = all.map(l => `${l.language}:${l.title.toLowerCase()}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('usa los niveles esperados: en → B2/C1, pt/fr → A1/A2, ja → N5/N4', () => {
    const ALLOWED_LEVELS: Record<string, string[]> = {
      en: ['B2', 'C1'],
      pt: ['A1', 'A2'],
      fr: ['A1', 'A2'],
      ja: ['N5', 'N4'],
    }
    for (const lesson of all) {
      const parsed = parseLesson(lesson.yaml)!
      const allowed = ALLOWED_LEVELS[lesson.language] ?? []
      expect(allowed, `${lesson.path} tiene nivel ${parsed.level}`).toContain(parsed.level)
    }
  })

  it('cada bloque incluye un examen con al menos 10 ejercicios', () => {
    const blocks = new Map<string, BundledLesson[]>()
    for (const lesson of all) {
      const match = lesson.title.match(/^Bloque (\d+)/)
      expect(match, `${lesson.path} no sigue el formato "Bloque N · NN — ..."`).not.toBeNull()
      const key = `${lesson.language}:${match![1]}`
      blocks.set(key, [...(blocks.get(key) ?? []), lesson])
    }
    expect(blocks.size).toBeGreaterThanOrEqual(6)
    for (const [key, lessons] of blocks) {
      expect(lessons.length, `bloque ${key} tiene menos de 6 archivos`).toBeGreaterThanOrEqual(6)
      const exams = lessons.filter(l => l.title.includes('Examen'))
      expect(exams.length, `bloque ${key} no tiene exactamente un examen`).toBe(1)
      const parsed = parseLesson(exams[0].yaml)!
      expect(parsed.exercises?.length ?? 0, `examen de ${key} con pocos ejercicios`).toBeGreaterThanOrEqual(10)
    }
  })
})

describe('lessonsToSeed', () => {
  const lesson = (language: 'en' | 'pt', title: string): BundledLesson => ({
    path: `${language}/${title}.yml`,
    title,
    language,
    yaml: '',
  })

  it('devuelve todo cuando no hay lecciones existentes', () => {
    const bundled = [lesson('en', 'Bloque 1 · 01 — A'), lesson('pt', 'Bloque 1 · 01 — B')]
    expect(lessonsToSeed(bundled, [])).toEqual(bundled)
  })

  it('filtra las que ya existen por idioma + título, sin importar mayúsculas', () => {
    const bundled = [lesson('en', 'Bloque 1 · 01 — A'), lesson('en', 'Bloque 1 · 02 — B')]
    const existing = [{ language: 'en', title: 'bloque 1 · 01 — a' }]
    expect(lessonsToSeed(bundled, existing)).toEqual([bundled[1]])
  })

  it('no confunde títulos iguales en idiomas distintos', () => {
    const bundled = [lesson('en', 'Bloque 1 · 01 — A'), lesson('pt', 'Bloque 1 · 01 — A')]
    const existing = [{ language: 'en', title: 'Bloque 1 · 01 — A' }]
    expect(lessonsToSeed(bundled, existing)).toEqual([bundled[1]])
  })
})
