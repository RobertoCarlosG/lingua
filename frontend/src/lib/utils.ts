export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function getLanguageLabel(lang: 'en' | 'pt'): string {
  return lang === 'en' ? 'English' : 'Português'
}

export function getLanguageFlag(lang: 'en' | 'pt'): string {
  return lang === 'en' ? '🇺🇸' : '🇧🇷'
}
