export interface CuratedLesson {
  id: string
  lang: 'en' | 'fr' | 'ja'
  level: string
  type: 'vocabulary' | 'grammar' | 'phonetics' | 'conversation'
  title: string
  summary: string
  vocabulary: {
    word: string
    ipa: string
    translation: string
    definition: string
    example: string
    tags?: string[]
  }[]
}

// Content will be populated by the curated lesson generator.
// Placeholder so the build doesn't fail before content is ready.
export const CURATED_LESSONS: CuratedLesson[] = []
