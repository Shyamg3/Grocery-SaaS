import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getLangMode, subscribeLangMode, type LangMode } from './i18n'

const LangOverride = createContext<LangMode | null>(null)

/** Forces a language for a subtree (used by the /design preview). */
export function LangScope({ lang, children }: { lang: LangMode; children: ReactNode }) {
  return <LangOverride.Provider value={lang}>{children}</LangOverride.Provider>
}

export function useLangMode(): LangMode {
  const override = useContext(LangOverride)
  const [mode, setMode] = useState<LangMode>(getLangMode)

  useEffect(() => subscribeLangMode(setMode), [])

  return override ?? mode
}
