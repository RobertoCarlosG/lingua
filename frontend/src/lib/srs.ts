// Repetición espaciada — SM-2 simplificado.
// "again" reinicia la palabra (reaparece en 10 min); "hard" crece 1.2x y
// castiga el ease; "good" multiplica por ease; "easy" da bonus 1.3x.

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export interface SrsState {
  interval_days: number
  ease: number
  due_at: string
}

export const DAY_MS = 24 * 60 * 60 * 1000
const AGAIN_DELAY_MS = 10 * 60 * 1000
const MIN_EASE = 1.3
const MAX_INTERVAL_DAYS = 365

export function initialSrs(now: Date): SrsState {
  return { interval_days: 0, ease: 2.5, due_at: now.toISOString() }
}

export function reviewWord(state: SrsState, rating: Rating, now: Date): SrsState {
  let interval = state.interval_days
  let ease = state.ease

  switch (rating) {
    case 'again':
      interval = 0
      ease = Math.max(MIN_EASE, ease - 0.2)
      return { interval_days: interval, ease, due_at: new Date(now.getTime() + AGAIN_DELAY_MS).toISOString() }
    case 'hard':
      interval = interval === 0 ? 1 : interval * 1.2
      ease = Math.max(MIN_EASE, ease - 0.15)
      break
    case 'good':
      interval = interval === 0 ? 1 : interval * ease
      break
    case 'easy':
      interval = Math.max(1, interval) * ease * 1.3
      ease = ease + 0.15
      break
  }

  interval = Math.min(interval, MAX_INTERVAL_DAYS)
  return {
    interval_days: interval,
    ease,
    due_at: new Date(now.getTime() + interval * DAY_MS).toISOString(),
  }
}

export function statusForInterval(intervalDays: number): 'learning' | 'known' | 'mastered' {
  if (intervalDays >= 21) return 'mastered'
  if (intervalDays >= 7) return 'known'
  return 'learning'
}

export function isDue(state: { due_at: string | null }, now: Date): boolean {
  if (!state.due_at) return true
  return new Date(state.due_at).getTime() <= now.getTime()
}
