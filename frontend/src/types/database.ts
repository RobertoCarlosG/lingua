export type Language = 'en' | 'pt'

export type WordStatus = 'new' | 'learning' | 'known' | 'mastered'

export type ErrorSeverity = 'minor' | 'moderate' | 'recurring'

export type VocabWord = {
  id: string
  user_id: string
  language: Language
  word: string
  translation: string
  ipa: string
  definition: string
  example_sentence: string
  status: WordStatus
  times_seen: number
  times_correct: number
  tags: string[]
  created_at: string
  last_reviewed_at: string | null
}

export type ErrorEntry = {
  id: string
  user_id: string
  language: Language
  error_text: string
  correction: string
  explanation: string
  category: string
  is_recurring: boolean
  occurrence_count: number
  created_at: string
  last_seen_at: string
}

export type SessionLog = {
  id: string
  user_id: string
  language: Language
  date: string
  duration_minutes: number
  activities: string[]
  words_reviewed: number
  errors_made: number
  notes: string
  created_at: string
}

export type Lesson = {
  id: string
  user_id: string
  language: Language
  title: string
  yaml_content: string
  rendered_at: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      vocab_words: {
        Row: VocabWord
        Insert: Omit<VocabWord, 'id' | 'created_at'>
        Update: Partial<Omit<VocabWord, 'id'>>
        Relationships: []
      }
      error_entries: {
        Row: ErrorEntry
        Insert: Omit<ErrorEntry, 'id' | 'created_at'>
        Update: Partial<Omit<ErrorEntry, 'id'>>
        Relationships: []
      }
      session_logs: {
        Row: SessionLog
        Insert: Omit<SessionLog, 'id' | 'created_at'>
        Update: Partial<Omit<SessionLog, 'id'>>
        Relationships: []
      }
      lessons: {
        Row: Lesson
        Insert: Omit<Lesson, 'id' | 'created_at'>
        Update: Partial<Omit<Lesson, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export interface LessonYAML {
  title: string
  language: Language
  level: string
  type: 'vocabulary' | 'phonetics' | 'grammar' | 'reading' | 'conversation'
  objectives?: string[]
  vocabulary?: VocabItem[]
  sections?: LessonSection[]
  exercises?: Exercise[]
  notes?: string
}

export interface VocabItem {
  word: string
  ipa: string
  translation: string
  definition: string
  example: string
  audio_hint?: string
  tags?: string[]
}

export interface LessonSection {
  title: string
  type: 'explanation' | 'reading' | 'dialogue' | 'phonetics'
  content: string
  tips?: string[]
}

export interface Exercise {
  type: 'fill_blank' | 'translate' | 'multiple_choice' | 'reorder'
  prompt: string
  answer: string
  options?: string[]
  explanation?: string
}
