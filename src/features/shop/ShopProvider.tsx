import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

export interface Shop {
  id: string
  name: string
  shop_type: string
  language: string
}

interface ShopContextValue {
  shop: Shop | null
  loading: boolean
  loadError: boolean
  reload: () => void
}

const ShopContext = createContext<ShopContextValue | null>(null)

export function ShopProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id
  const [shop, setShop] = useState<Shop | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!session) {
        setShop(null)
        setLoadError(false)
        setLoadedFor(null)
        return
      }
      const finish = () => setLoadedFor(session.user.id)

      setLoadError(false)
      const { data: memberData, error: memberError } = await supabase
        .from('shop_members')
        .select('shop_id')
        .limit(1)
      // supabase-js has no generated DB types yet, so query results are untyped
      const members = (memberData ?? []) as { shop_id: string }[]
      if (cancelled) return
      if (memberError) {
        setLoadError(true)
        finish()
        return
      }
      if (members.length === 0) {
        setShop(null)
        finish()
        return
      }

      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, name, shop_type, language')
        .eq('id', members[0].shop_id)
        .single()
      if (cancelled) return
      if (shopError || !shopData) {
        setLoadError(true)
        setShop(null)
        finish()
        return
      }
      setShop(shopData as Shop)
      finish()
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [session, userId, reloadKey])

  const value: ShopContextValue = {
    shop,
    loading: session !== null && loadedFor !== session.user.id,
    loadError,
    reload: () => {
      setLoadedFor(null)
      setReloadKey((k) => k + 1)
    },
  }

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used inside ShopProvider')
  return ctx
}
