import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importSessionLogs } from './import-sessions'
import type { NewSessionLog } from './session-yaml'

const insertMock = vi.hoisted(() => vi.fn())

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({ insert: insertMock })),
  },
}))

const SESSION: NewSessionLog = {
  language: 'en',
  date: '2026-06-13',
  duration_minutes: 30,
  activities: ['repaso'],
  words_reviewed: 10,
  errors_made: 0,
  notes: '',
}

beforeEach(() => {
  vi.clearAllMocks()
  insertMock.mockResolvedValue({ error: null })
})

describe('importSessionLogs', () => {
  it('inserta sesiones y devuelve el conteo', async () => {
    const result = await importSessionLogs([SESSION, { ...SESSION, date: '2026-06-12' }])
    expect(result).toEqual({ imported: 2 })
    expect(insertMock).toHaveBeenCalledWith([SESSION, { ...SESSION, date: '2026-06-12' }])
  })

  it('devuelve cero sin llamar insert para lista vacía', async () => {
    const result = await importSessionLogs([])
    expect(result).toEqual({ imported: 0 })
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('propaga error de insert', async () => {
    insertMock.mockResolvedValueOnce({ error: { message: 'rls' } })
    const result = await importSessionLogs([SESSION])
    expect(result).toEqual({ imported: 0, error: 'rls' })
  })
})
