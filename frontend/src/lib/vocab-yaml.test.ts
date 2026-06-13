import { describe, it, expect } from 'vitest'
import { parseVocabFromYaml, VOCAB_LIST_TEMPLATE_YML } from './vocab-yaml'

const NOW = new Date('2026-06-09T12:00:00Z')

describe('parseVocabFromYaml', () => {
  it('parsea lista standalone con words', () => {
    const result = parseVocabFromYaml(VOCAB_LIST_TEMPLATE_YML, NOW)
    expect(result.errors).toEqual([])
    expect(result.source).toBe('vocab-list')
    expect(result.language).toBe('en')
    expect(result.words).toHaveLength(2)
    expect(result.words[0].word).toBe('accomplish')
    expect(result.words[0].example_sentence).toContain('accomplished')
  })

  it('extrae vocabulary de una lección YAML', () => {
    const yaml = `title: "Test"
language: pt
level: A1
type: vocabulary
vocabulary:
  - word: "olá"
    translation: "hola"
    example: "Olá!"
`
    const result = parseVocabFromYaml(yaml, NOW)
    expect(result.errors).toEqual([])
    expect(result.source).toBe('lesson')
    expect(result.language).toBe('pt')
    expect(result.words).toHaveLength(1)
    expect(result.words[0].word).toBe('olá')
  })

  it('rechaza YAML sin words ni vocabulary', () => {
    const result = parseVocabFromYaml('language: en\nfoo: bar', NOW)
    expect(result.words).toHaveLength(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rechaza words sin language', () => {
    const result = parseVocabFromYaml('words:\n  - word: x\n    translation: y', NOW)
    expect(result.words).toHaveLength(0)
    expect(result.errors.some(e => e.includes('language'))).toBe(true)
  })
})
