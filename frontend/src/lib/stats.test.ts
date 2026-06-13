import { describe, it, expect } from 'vitest'
import { computeStreak, weeklyActivity } from './stats'

const TODAY = '2026-06-09' // martes

describe('computeStreak', () => {
  it('sin actividad → 0', () => {
    expect(computeStreak([], TODAY)).toBe(0)
  })

  it('solo hoy → 1', () => {
    expect(computeStreak(['2026-06-09'], TODAY)).toBe(1)
  })

  it('tres días consecutivos terminando hoy → 3', () => {
    expect(computeStreak(['2026-06-09', '2026-06-08', '2026-06-07'], TODAY)).toBe(3)
  })

  it('practicó ayer pero hoy aún no → la racha sigue viva', () => {
    expect(computeStreak(['2026-06-08', '2026-06-07'], TODAY)).toBe(2)
  })

  it('último día hace 2 días → racha rota', () => {
    expect(computeStreak(['2026-06-07', '2026-06-06'], TODAY)).toBe(0)
  })

  it('huecos cortan la racha', () => {
    expect(computeStreak(['2026-06-09', '2026-06-07'], TODAY)).toBe(1)
  })

  it('fechas duplicadas cuentan una vez', () => {
    expect(computeStreak(['2026-06-09', '2026-06-09', '2026-06-08'], TODAY)).toBe(2)
  })

  it('el orden de entrada no importa', () => {
    expect(computeStreak(['2026-06-07', '2026-06-09', '2026-06-08'], TODAY)).toBe(3)
  })
})

describe('weeklyActivity', () => {
  it('devuelve 7 días terminando hoy, con ceros si no hay actividad', () => {
    const week = weeklyActivity([], TODAY)
    expect(week).toHaveLength(7)
    expect(week[6].date).toBe('2026-06-09')
    expect(week[0].date).toBe('2026-06-03')
    expect(week.every(d => d.count === 0)).toBe(true)
  })

  it('etiqueta los días usando Intl (locale es-MX por defecto)', () => {
    const week = weeklyActivity([], TODAY, 'es-MX')
    // Intl.DateTimeFormat retorna minúsculas en es-MX
    expect(week[6].day).toBe(new Intl.DateTimeFormat('es-MX', { weekday: 'short' }).format(new Date(2026, 5, 9)))
    expect(week[5].day).toBe(new Intl.DateTimeFormat('es-MX', { weekday: 'short' }).format(new Date(2026, 5, 8)))
    expect(week[0].day).toBe(new Intl.DateTimeFormat('es-MX', { weekday: 'short' }).format(new Date(2026, 5, 3)))
  })

  it('suma la actividad por día', () => {
    const rows = [
      { date: '2026-06-09', count: 5 },
      { date: '2026-06-09', count: 3 },
      { date: '2026-06-08', count: 2 },
    ]
    const week = weeklyActivity(rows, TODAY)
    expect(week[6].count).toBe(8)
    expect(week[5].count).toBe(2)
  })

  it('ignora actividad fuera de la ventana de 7 días', () => {
    const rows = [{ date: '2026-06-01', count: 99 }]
    const week = weeklyActivity(rows, TODAY)
    expect(week.every(d => d.count === 0)).toBe(true)
  })
})
