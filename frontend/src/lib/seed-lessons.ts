import { parseLesson } from './yaml-parser'
import type { Language } from '@/types/database'

// Lecciones precargadas: todo .yml dentro de src/content/ se empaqueta en el build
const modules = import.meta.glob('../content/**/*.yml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export interface BundledLesson {
  path: string
  title: string
  language: Language
  yaml: string
}

export function bundledLessons(): BundledLesson[] {
  return Object.entries(modules)
    .map(([path, yaml]) => {
      const parsed = parseLesson(yaml)
      if (!parsed) return null
      return { path, title: parsed.title, language: parsed.language, yaml }
    })
    .filter((l): l is BundledLesson => l !== null)
    .sort((a, b) => a.path.localeCompare(b.path))
}

export function lessonsToSeed(
  bundled: BundledLesson[],
  existing: Array<{ language: string; title: string }>
): BundledLesson[] {
  const seen = new Set(existing.map(e => `${e.language}:${e.title.trim().toLowerCase()}`))
  return bundled.filter(l => !seen.has(`${l.language}:${l.title.trim().toLowerCase()}`))
}

const seedPromises = new Map<string, Promise<number>>()

/**
 * Inserta las lecciones precargadas que aún no existen en Supabase para el
 * usuario autenticado. Idempotente (deduplica por idioma + título) y memoizada
 * por usuario, así que es seguro invocarla desde varios puntos al iniciar.
 */
export async function seedLessons(): Promise<number> {
  // Import dinámico: evita exigir las env vars de Supabase al importar este módulo
  const { supabase } = await import('./supabase')

  // Con RLS cada usuario ve solo sus lecciones, así que la precarga es por usuario
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return 0

  let promise = seedPromises.get(userId)
  if (!promise) {
    promise = doSeed(userId).catch(err => {
      console.error('No se pudieron precargar las lecciones:', err)
      seedPromises.delete(userId)
      return 0
    })
    seedPromises.set(userId, promise)
  }
  return promise
}

async function doSeed(userId: string): Promise<number> {
  const bundled = bundledLessons()
  if (bundled.length === 0) return 0

  const { supabase } = await import('./supabase')
  const { data: existing, error } = await supabase.from('lessons').select('language, title')
  if (error) throw error

  const fresh = lessonsToSeed(bundled, existing ?? [])
  if (fresh.length === 0) return 0

  const rows = fresh.map(l => ({
    user_id: userId,
    language: l.language,
    title: l.title,
    yaml_content: l.yaml,
    rendered_at: null,
  }))

  const { error: insertError } = await supabase.from('lessons').insert(rows)
  if (insertError) throw insertError
  return rows.length
}
