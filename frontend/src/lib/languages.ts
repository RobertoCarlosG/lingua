/**
 * Registro central de idiomas de aprendizaje.
 *
 * Única fuente de verdad: agregar un idioma aquí actualiza tipos, toggle,
 * colores y validadores. Para un idioma nuevo también hace falta:
 *   1. Clases CSS `.lang-badge-<code>` y `.text-gradient-<code>` en index.css
 *   2. Ampliar el CHECK de `language` en una migración de Supabase
 *   3. Espejar el código en VALID_LANGUAGES del backend (lesson_validator.py)
 *
 * Las clases de Tailwind van como strings literales completos para que el
 * escáner JIT las detecte — no construir nombres de clase por interpolación.
 */

export interface LanguageTheme {
  /** Badge de nivel/idioma, p. ej. "B2" en tarjetas de lección */
  badge: string
  /** Texto con degradado para títulos de página */
  gradient: string
  /** Color de acento para texto destacado (traducciones, links) */
  accent: string
  /** Borde al pasar el cursor por tarjetas de vocabulario */
  cardHover: string
  /** Borde estático de acento (banners, contenedores destacados) */
  border: string
  /** Botón de acción primaria de la página */
  button: string
  /** Estado activo en el selector de idioma */
  toggleActive: string
  /** Relleno de barras de progreso */
  progress: string
}

export interface LanguageConfig {
  label: string
  flag: string
  /** Rango de niveles del contenido precargado, p. ej. "B2 → C1" */
  levels: string
  theme: LanguageTheme
  dictionary: {
    /** Hay lookup de diccionario (aunque sea solo traducción sugerida) */
    lookup: boolean
    /** Se pueden generar lecciones YAML desde palabras (requiere definiciones) */
    generate: boolean
  }
}

export const LEARNING_LANGUAGES = {
  en: {
    label: 'English',
    flag: '🇬🇧',
    levels: 'B2 → C1',
    theme: {
      badge: 'lang-badge-en',
      gradient: 'text-gradient-en',
      accent: 'text-blue-300',
      cardHover: 'hover:border-blue-500/20',
      border: 'border-blue-500/20',
      button: 'bg-blue-500/15 border-blue-500/25 text-blue-300 hover:bg-blue-500/25',
      toggleActive: 'bg-blue-500/20 border border-blue-500/30 text-blue-300 shadow-sm',
      progress: 'bg-blue-500/70',
    },
    dictionary: { lookup: true, generate: true },
  },
  pt: {
    label: 'Português',
    flag: '🇧🇷',
    levels: 'A1 → A2',
    theme: {
      badge: 'lang-badge-pt',
      gradient: 'text-gradient-pt',
      accent: 'text-purple-300',
      cardHover: 'hover:border-purple-500/20',
      border: 'border-purple-500/20',
      button: 'bg-purple-500/15 border-purple-500/25 text-purple-300 hover:bg-purple-500/25',
      toggleActive: 'bg-purple-500/20 border border-purple-500/30 text-purple-300 shadow-sm',
      progress: 'bg-purple-500/70',
    },
    dictionary: { lookup: true, generate: false },
  },
} as const satisfies Record<string, LanguageConfig>

export type Language = keyof typeof LEARNING_LANGUAGES

export const LANGUAGE_CODES = Object.keys(LEARNING_LANGUAGES) as Language[]

export function languageConfig(lang: Language): LanguageConfig {
  return LEARNING_LANGUAGES[lang]
}

export function langTheme(lang: Language): LanguageTheme {
  return LEARNING_LANGUAGES[lang].theme
}
