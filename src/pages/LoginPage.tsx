import { useState, type FormEvent } from 'react'
import LanguageToggle from '../components/ui/LanguageToggle'
import { mapAuthError } from '../features/auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { t, type StringKey } from '../lib/i18n'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorKey, setErrorKey] = useState<StringKey | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)
  const [busy, setBusy] = useState(false)
  const [, bump] = useState(0)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorKey(null)
    if (!email.trim() || !password) {
      setErrorKey('error.fillRequired')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw new Error(error.message)
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) throw new Error(error.message)
        if (!data.session) {
          setCheckEmail(true)
          return
        }
      }
    } catch (err) {
      setErrorKey(mapAuthError(err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="flex justify-end p-3">
        <LanguageToggle onChange={() => bump((n) => n + 1)} />
      </div>
      <div className="flex flex-1 flex-col justify-center px-6 pb-10">
        {checkEmail ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-2xl bg-emerald-50 p-4 text-base text-emerald-900">{t('auth.checkEmail')}</div>
            <button
              type="button"
              onClick={() => {
                setCheckEmail(false)
                setMode('signin')
              }}
              className="min-h-[48px] text-base font-bold text-emerald-700"
            >
              {t('auth.backToSignIn')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <h1 className="text-center text-2xl font-bold">
              {t(mode === 'signin' ? 'auth.signInTitle' : 'auth.signUpTitle')}
            </h1>
            {errorKey && (
              <div role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">
                {t(errorKey)}
              </div>
            )}
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
              {t('auth.email')}
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
              {t('auth.password')}
              <input
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 min-h-[56px] rounded-xl bg-emerald-600 text-lg font-bold text-white active:bg-emerald-700 disabled:opacity-50"
            >
              {t(mode === 'signin' ? 'auth.signInBtn' : 'auth.signUpBtn')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setErrorKey(null)
              }}
              className="min-h-[48px] text-base font-medium text-emerald-700"
            >
              {t(mode === 'signin' ? 'auth.needAccount' : 'auth.haveAccount')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
