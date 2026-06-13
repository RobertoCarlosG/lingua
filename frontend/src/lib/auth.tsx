import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function resolveSession(session: Session | null): Promise<Session | null> {
  if (!session) return null
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    await supabase.auth.signOut()
    return null
  }
  return session
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let initialDone = false

    function finishInitial() {
      if (mounted && !initialDone) {
        initialDone = true
        setLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        if (!mounted) return

        const resolved = await resolveSession(nextSession)
        setSession(resolved)

        if (event === 'INITIAL_SESSION') {
          finishInitial()
        }
      }
    )

    // Fallback si INITIAL_SESSION no llega (p. ej. entorno de tests)
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      await new Promise(r => setTimeout(r, 50))
      if (!mounted || initialDone) return
      const resolved = await resolveSession(session)
      setSession(resolved)
      finishInitial()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
