import { LEARNING_LANGUAGES, type Language } from '@/lib/languages'

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateString: string, locale = 'es-MX'): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function getLanguageLabel(lang: Language): string {
  return LEARNING_LANGUAGES[lang].label
}

export function getLanguageFlag(lang: Language): string {
  return LEARNING_LANGUAGES[lang].flag
}
