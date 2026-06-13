import { supabase } from './supabase'
import type { NewSessionLog } from './session-yaml'

export interface SessionImportResult {
  imported: number
  error?: string
}

export async function importSessionLogs(sessions: NewSessionLog[]): Promise<SessionImportResult> {
  if (sessions.length === 0) return { imported: 0 }

  const { error } = await supabase.from('session_logs').insert(sessions)
  if (error) {
    console.error('session_logs insert failed:', error)
    return { imported: 0, error: error.message }
  }
  return { imported: sessions.length }
}
