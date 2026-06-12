import { describe, it, expect, vi, beforeEach } from 'vitest'
import { lookupWord, generateLessonYaml } from './dictionary'

const ENTRY = {
  word: 'accomplish',
  ipa: '/əˈkʌmplɪʃ/',
  audio: null,
  meanings: [],
  translation_suggestion: 'lograr',
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('lookupWord', () => {
  it('devuelve la entrada del diccionario', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(ENTRY) })
    vi.stubGlobal('fetch', fetchMock)

    const entry = await lookupWord('accomplish')

    expect(entry).toEqual(ENTRY)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/dictionary/en/accomplish'))
  })

  it('usa el idioma indicado en la ruta', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(ENTRY) })
    vi.stubGlobal('fetch', fetchMock)

    await lookupWord('saudade', 'pt')

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/dictionary/pt/saudade'))
  })

  it('codifica la palabra en la URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(ENTRY) })
    vi.stubGlobal('fetch', fetchMock)

    await lookupWord('give up')

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('give%20up'))
  })

  it('devuelve null si la API responde error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    expect(await lookupWord('zzzzz')).toBeNull()
  })
})

describe('generateLessonYaml', () => {
  it('pide la lección con palabras, título y nivel', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('title: X') })
    vi.stubGlobal('fetch', fetchMock)

    const yamlText = await generateLessonYaml(['a', 'b'], 'Mi lección', 'B2')

    expect(yamlText).toBe('title: X')
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('words=a%2Cb')
    expect(url).toContain('level=B2')
  })

  it('devuelve null si la API responde error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    expect(await generateLessonYaml(['x'], 'T')).toBeNull()
  })
})
