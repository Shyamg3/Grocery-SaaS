import { useState, type FormEvent } from 'react'
import LanguageToggle from '../components/LanguageToggle'
import { mapAuthError, useAuth } from '../features/auth/AuthProvider'
import { useShop } from '../features/shop/ShopProvider'
import { supabase } from '../lib/supabase'
import { t, type StringKey } from '../lib/i18n'

const SHOP_TYPES = ['grocery', 'general', 'stationery', 'fancy'] as const
type ShopType = (typeof SHOP_TYPES)[number]

export default function CreateShopPage() {
  const { signOut } = useAuth()
  const { reload } = useShop()
  const [name, setName] = useState('')
  const [shopType, setShopType] = useState<ShopType>('grocery')
  const [errorKey, setErrorKey] = useState<StringKey | null>(null)
  const [busy, setBusy] = useState(false)
  const [, bump] = useState(0)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorKey(null)
    if (!name.trim()) {
      setErrorKey('error.fillRequired')
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.rpc('create_shop', { p_name: name.trim(), p_shop_type: shopType })
      if (error) throw new Error(error.message)
      reload()
    } catch (err) {
      setErrorKey(mapAuthError(err instanceof Error ? err.message : String(err)))
      setBusy(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
    } catch {
      setErrorKey('error.generic')
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="flex items-center justify-between p-3">
        <LanguageToggle onToggle={() => bump((n) => n + 1)} />
        <button
          type="button"
          onClick={handleSignOut}
          className="min-h-[48px] rounded-xl px-4 text-sm font-medium text-neutral-600 active:bg-neutral-100"
        >
          {t('common.signOut')}
        </button>
      </div>
      <div className="flex flex-1 flex-col justify-center px-6 pb-16">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h1 className="text-center text-2xl font-bold">{t('shop.createTitle')}</h1>
          {errorKey && (
            <div role="alert" className="rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">
              {t(errorKey)}
            </div>
          )}
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            {t('shop.name')}
            <input
              type="text"
              autoComplete="organization"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('shop.namePlaceholder')}
              className="min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            {t('shop.type')}
            <select
              value={shopType}
              onChange={(e) => setShopType(e.target.value as ShopType)}
              className="min-h-[48px] rounded-xl border border-neutral-300 bg-white px-4 text-base"
            >
              {SHOP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`shop.type.${type}`)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="mt-2 min-h-[56px] rounded-xl bg-emerald-600 text-lg font-bold text-white active:bg-emerald-700 disabled:opacity-50"
          >
            {t('shop.createBtn')}
          </button>
        </form>
      </div>
    </div>
  )
}
