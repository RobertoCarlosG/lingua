import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importVocabWords } from './import-vocab'
import type { NewVocabWord } from './lesson-to-vocab'

const { fromMock, insertMock, inMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  insertMock: vi.fn(),
  inMock: vi.fn(),
}))

vi.mock('./supabase', () => ({
  supabase: { from: fromMock },
}))

const WORD: NewVocabWord = {
  language: 'en',
  word: 'accomplish',
  translation: 'lograr',
  ipa: '',
  definition: '',
  example_sentence: '',
  tags: [],
  status: 'new',
  times_seen: 0,
  times_correct: 0,
  last_reviewed_at: null,
  interval_days: 0,
  ease: 2.5,
  due_at: new Date().toISOString(),
}

beforeEach(() => {
  vi.clearAllMocks()
  inMock.mockReturnValue({ data: [], error: null })
  insertMock.mockResolvedValue({ error: null })
  fromMock.mockImplementation(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: inMock,
      }),
    }),
    insert: insertMock,
  }))
})

describe('importVocabWords', () => {
  it('inserta palabras nuevas y reporta omitidas', async () => {
    inMock.mockResolvedValueOnce({
      data: [{ word: 'existing' }],
      error: null,
    })

    const result = await importVocabWords('en', [
      WORD,
      { ...WORD, word: 'existing' },
      { ...WORD, word: 'endeavor', translation: 'esfuerzo' },
    ])

    expect(result).toEqual({ imported: 2, skipped: 1 })
    expect(insertMock).toHaveBeenCalledOnce()
    expect(insertMock.mock.calls[0][0]).toHaveLength(2)
  })

  it('no inserta si todas existen', async () => {
    inMock.mockResolvedValueOnce({ data: [{ word: 'accomplish' }], error: null })

    const result = await importVocabWords('en', [WORD])

    expect(result).toEqual({ imported: 0, skipped: 1 })
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('filtra por idioma activo', async () => {
    await importVocabWords('en', [{ ...WORD, language: 'pt' }])
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('propaga error de select', async () => {
    inMock.mockResolvedValueOnce({ data: null, error: { message: 'denied' } })
    const result = await importVocabWords('en', [WORD])
    expect(result.error).toBe('denied')
    expect(result.imported).toBe(0)
  })
})
