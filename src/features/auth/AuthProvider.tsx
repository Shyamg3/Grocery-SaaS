import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { StringKey } from '../../lib/i18n'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function mapAuthError(message: string): StringKey {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'error.invalidCredentials'
  if (m.includes('invalid email')) return 'error.invalidEmail'
  if (m.includes('already registered')) return 'error.emailInUse'
  if (m.includes('email not confirmed')) return 'error.emailNotConfirmed'
  if (m.includes('password should be')) return 'error.weakPassword'
  if (m.includes('fetch') || m.includes('network') || m.includes('timeout') || m.includes('load failed')) {
    return 'error.network'
  }
  return 'error.generic'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value: AuthContextValue = {
    session,
    loading,
    signOut: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
