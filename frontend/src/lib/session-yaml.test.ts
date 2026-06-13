import { describe, it, expect } from 'vitest'
import { parseSessionsFromYaml, SESSIONS_TEMPLATE_YML } from './session-yaml'

describe('parseSessionsFromYaml', () => {
  it('parsea sesiones válidas', () => {
    const result = parseSessionsFromYaml(SESSIONS_TEMPLATE_YML)
    expect(result.errors).toEqual([])
    expect(result.language).toBe('en')
    expect(result.sessions).toHaveLength(2)
    expect(result.sessions[0]).toMatchObject({
      date: '2026-06-13',
      duration_minutes: 45,
      words_reviewed: 20,
      activities: ['repaso', 'lectura'],
    })
  })

  it('rechaza fecha inválida', () => {
    const result = parseSessionsFromYaml(`language: en
sessions:
  - date: "13/06/2026"
    duration_minutes: 30
    words_reviewed: 5
    errors_made: 0
`)
    expect(result.sessions).toHaveLength(0)
    expect(result.errors.some(e => e.includes('date'))).toBe(true)
  })
})
