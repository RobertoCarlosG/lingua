// Estadísticas derivadas de la actividad (fechas en formato YYYY-MM-DD local).

export interface DayActivity {
  date: string
  day: string
  count: number
}

function parseLocalDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date: string, days: number): string {
  const d = parseLocalDate(date)
  d.setDate(d.getDate() + days)
  return toDateString(d)
}

/** Días consecutivos con actividad terminando hoy o ayer (la racha de hoy
 * sigue viva mientras no pase la medianoche sin practicar). */
export function computeStreak(dates: string[], today: string): number {
  const active = new Set(dates)
  let cursor = active.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (active.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Actividad de los últimos 7 días (el más viejo primero, hoy al final).
 *  locale: BCP-47 string used to format the short weekday label. */
export function weeklyActivity(
  rows: { date: string; count: number }[],
  today: string,
  locale = 'es-MX'
): DayActivity[] {
  const totals = new Map<string, number>()
  for (const row of rows) {
    totals.set(row.date, (totals.get(row.date) ?? 0) + row.count)
  }
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const week: DayActivity[] = []
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i)
    week.push({
      date,
      day: fmt.format(parseLocalDate(date)),
      count: totals.get(date) ?? 0,
    })
  }
  return week
}
