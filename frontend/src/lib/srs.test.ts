import { describe, it, expect } from 'vitest'
import { initialSrs, reviewWord, isDue, statusForInterval, DAY_MS } from './srs'

const NOW = new Date('2026-06-09T12:00:00Z')

describe('initialSrs', () => {
  it('empieza con intervalo 0, ease 2.5 y vencida ahora', () => {
    const s = initialSrs(NOW)
    expect(s.interval_days).toBe(0)
    expect(s.ease).toBe(2.5)
    expect(new Date(s.due_at).getTime()).toBe(NOW.getTime())
  })
})

describe('reviewWord', () => {
  it('primera vez "good" → 1 día', () => {
    const s = reviewWord(initialSrs(NOW), 'good', NOW)
    expect(s.interval_days).toBe(1)
    expect(s.ease).toBe(2.5)
    expect(new Date(s.due_at).getTime()).toBe(NOW.getTime() + DAY_MS)
  })

  it('"good" multiplica el intervalo por ease', () => {
    const s = reviewWord({ interval_days: 4, ease: 2.5, due_at: NOW.toISOString() }, 'good', NOW)
    expect(s.interval_days).toBeCloseTo(10)
    expect(new Date(s.due_at).getTime()).toBe(NOW.getTime() + 10 * DAY_MS)
  })

  it('"again" reinicia a 10 minutos y baja el ease', () => {
    const s = reviewWord({ interval_days: 10, ease: 2.5, due_at: NOW.toISOString() }, 'again', NOW)
    expect(s.interval_days).toBe(0)
    expect(s.ease).toBeCloseTo(2.3)
    expect(new Date(s.due_at).getTime()).toBe(NOW.getTime() + 10 * 60 * 1000)
  })

  it('el ease nunca baja de 1.3', () => {
    const s = reviewWord({ interval_days: 1, ease: 1.3, due_at: NOW.toISOString() }, 'again', NOW)
    expect(s.ease).toBe(1.3)
  })

  it('"hard" crece poco y castiga el ease', () => {
    const s = reviewWord({ interval_days: 10, ease: 2.5, due_at: NOW.toISOString() }, 'hard', NOW)
    expect(s.interval_days).toBeCloseTo(12)
    expect(s.ease).toBeCloseTo(2.35)
  })

  it('"hard" en palabra nueva → 1 día', () => {
    const s = reviewWord(initialSrs(NOW), 'hard', NOW)
    expect(s.interval_days).toBe(1)
  })

  it('"easy" da bonus de intervalo y sube el ease', () => {
    const s = reviewWord({ interval_days: 10, ease: 2.5, due_at: NOW.toISOString() }, 'easy', NOW)
    expect(s.interval_days).toBeCloseTo(10 * 2.5 * 1.3)
    expect(s.ease).toBeCloseTo(2.65)
  })

  it('"easy" en palabra nueva parte de 1 día', () => {
    const s = reviewWord(initialSrs(NOW), 'easy', NOW)
    expect(s.interval_days).toBeCloseTo(1 * 2.5 * 1.3)
  })

  it('el intervalo se limita a 365 días', () => {
    const s = reviewWord({ interval_days: 300, ease: 2.5, due_at: NOW.toISOString() }, 'easy', NOW)
    expect(s.interval_days).toBe(365)
  })
})

describe('statusForInterval', () => {
  it('0 días → learning (acaba de fallar o es nueva ya vista)', () => {
    expect(statusForInterval(0)).toBe('learning')
  })

  it('menos de 7 días → learning', () => {
    expect(statusForInterval(3)).toBe('learning')
  })

  it('7 a 20 días → known', () => {
    expect(statusForInterval(7)).toBe('known')
    expect(statusForInterval(20)).toBe('known')
  })

  it('21+ días → mastered', () => {
    expect(statusForInterval(21)).toBe('mastered')
    expect(statusForInterval(365)).toBe('mastered')
  })
})

describe('isDue', () => {
  it('sin due_at (palabra vieja sin migrar) está vencida', () => {
    expect(isDue({ due_at: null }, NOW)).toBe(true)
  })

  it('due_at en el pasado está vencida', () => {
    expect(isDue({ due_at: '2026-06-08T12:00:00Z' }, NOW)).toBe(true)
  })

  it('due_at en el futuro no está vencida', () => {
    expect(isDue({ due_at: '2026-06-10T12:00:00Z' }, NOW)).toBe(false)
  })
})
