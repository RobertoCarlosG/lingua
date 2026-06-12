import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

/** Idiomas disponibles para la interfaz (autónimos, no se traducen). */
export const UI_LANGUAGES = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
} as const

export type UiLanguage = keyof typeof UI_LANGUAGES

export const UI_LANGUAGE_CODES = Object.keys(UI_LANGUAGES) as UiLanguage[]

/** Locale BCP-47 para formatear fechas/números según el idioma de la UI. */
const LOCALE_BY_UI: Record<UiLanguage, string> = {
  es: 'es-MX',
  en: 'en-GB',
  pt: 'pt-BR',
}

export function dateLocale(): string {
  return LOCALE_BY_UI[(i18n.language as UiLanguage) ?? 'es'] ?? 'es-MX'
}

export function isUiLanguage(value: string): value is UiLanguage {
  return value in UI_LANGUAGES
}

export function detectUiLanguage(): UiLanguage {
  const candidate = navigator.language?.slice(0, 2) ?? 'es'
  return isUiLanguage(candidate) ? candidate : 'es'
}

/**
 * Backend perezoso: cada idioma se carga con import() dinámico, así Vite
 * separa los JSON de locales en chunks propios y el bundle inicial solo
 * incluye el idioma activo (+ fallback es) en lugar de los tres.
 */
const lazyLocaleBackend = {
  type: 'backend' as const,
  init() {},
  read(lng: string, _ns: string, callback: (err: unknown, data?: unknown) => void) {
    import(`../locales/${lng}/common.json`)
      .then(mod => callback(null, mod.default))
      .catch(err => callback(err))
  },
}

export async function initI18n(initialLanguage: UiLanguage): Promise<typeof i18n> {
  await i18n
    .use(lazyLocaleBackend)
    .use(initReactI18next)
    .init({
      lng: initialLanguage,
      fallbackLng: 'es',
      ns: ['common'],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      returnNull: false,
    })
  return i18n
}

export default i18n
