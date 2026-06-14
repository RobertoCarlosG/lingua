import { describe, it, expect } from 'vitest'
import { parseLesson, validateLesson } from './yaml-parser'
import type { LessonYAML } from '@/types/database'

const VALID_YAML = `
title: "Lección de prueba"
language: en
level: B1
type: vocabulary
vocabulary:
  - word: "accomplish"
    ipa: "/əˈkʌmplɪʃ/"
    translation: "lograr"
exercises:
  - type: translate
    prompt: "Traduce: lograr"
    answer: "accomplish"
  - type: multiple_choice
    prompt: "Sinónimo de accomplish"
    answer: "achieve"
    options: ["achieve", "avoid"]
`

describe('parseLesson', () => {
  it('parsea YAML válido', () => {
    const lesson = parseLesson(VALID_YAML)
    expect(lesson?.title).toBe('Lección de prueba')
    expect(lesson?.vocabulary).toHaveLength(1)
  })

  it('devuelve null con YAML roto', () => {
    expect(parseLesson('title: [unclosed')).toBeNull()
  })

  it('devuelve null si falta title o language', () => {
    expect(parseLesson('level: B1')).toBeNull()
  })
})

describe('validateLesson', () => {
  it('lección válida → sin errores', () => {
    const lesson = parseLesson(VALID_YAML)!
    expect(validateLesson(lesson)).toEqual([])
  })

  it('reporta campos requeridos faltantes', () => {
    const errors = validateLesson({} as LessonYAML)
    const joined = errors.join(' ')
    expect(joined).toContain('title')
    expect(joined).toContain('language')
    expect(joined).toContain('type')
  })

  it('rechaza language y type desconocidos', () => {
    const errors = validateLesson({ title: 'X', language: 'zz', type: 'dancing' } as unknown as LessonYAML)
    const joined = errors.join(' ')
    expect(joined).toContain('language')
    expect(joined).toContain('type')
  })

  it('valida entradas de vocabulario (word y translation requeridos)', () => {
    const lesson = {
      title: 'X', language: 'en', type: 'vocabulary',
      vocabulary: [{ ipa: '/x/' }, { word: 'ok', translation: 'bien' }],
    } as unknown as LessonYAML
    const errors = validateLesson(lesson)
    const joined = errors.join(' ')
    expect(joined).toContain('vocabulary[0]')
    expect(joined).not.toContain('vocabulary[1]')
  })

  it('valida ejercicios: tipo, prompt, answer y options de multiple_choice', () => {
    const lesson = {
      title: 'X', language: 'en', type: 'grammar',
      exercises: [
        { type: 'fly', prompt: '?', answer: 'a' },
        { type: 'multiple_choice', prompt: '?', answer: 'a', options: ['b', 'c'] },
        { type: 'translate', answer: 'a' },
      ],
    } as unknown as LessonYAML
    const errors = validateLesson(lesson)
    const joined = errors.join(' ')
    expect(joined).toContain('exercises[0]')
    expect(joined).toContain('exercises[1]')
    expect(joined).toContain('exercises[2]')
  })
})
