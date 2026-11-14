import { supabase } from '../../lib/supabase'
import type { VoiceParseItem } from './match'

export type VoiceParseErrorCode =
  | 'offline'
  | 'auth'
  | 'forbidden'
  | 'limit'
  | 'audio'
  | 'server'
  | 'network'
  | 'invalid_response'

export class VoiceParseError extends Error {
  readonly code: VoiceParseErrorCode

  constructor(code: VoiceParseErrorCode) {
    super(`voice-parse failed: ${code}`)
    this.name = 'VoiceParseError'
    this.code = code
  }
}

export interface VoiceParseResult {
  transcript: string
  items: VoiceParseItem[]
  eventId: string
}

export interface FinalVoiceItem {
  spoken_name: string
  product_id: string
  product_name: string
  qty: number
  unit: string
}

function mapStatus(status: number): VoiceParseErrorCode {
  if (status === 401) return 'auth'
  if (status === 403) return 'forbidden'
  if (status === 429) return 'limit'
  if (status === 400 || status === 413) return 'audio'
  return 'server'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isParseItem(value: unknown): value is VoiceParseItem {
  if (!isRecord(value)) return false
  return (
    typeof value.spoken_name === 'string' &&
    typeof value.qty === 'number' &&
    Number.isFinite(value.qty) &&
    value.qty > 0 &&
    typeof value.unit === 'string' &&
    typeof value.confidence === 'number'
  )
}

function toResult(value: unknown): VoiceParseResult | null {
  if (!isRecord(value)) return null
  const { transcript, items, event_id: eventId } = value
  if (typeof transcript !== 'string' || typeof eventId !== 'string') return null
  if (!Array.isArray(items) || !items.every(isParseItem)) return null
  return { transcript, items, eventId }
}

export async function parseVoice(
  shopId: string,
  audioBase64: string,
  mimeType: string,
): Promise<VoiceParseResult> {
  if (!navigator.onLine) throw new VoiceParseError('offline')

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new VoiceParseError('auth')

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-parse`
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shop_id: shopId, audio_base64: audioBase64, mime_type: mimeType }),
    })
  } catch {
    throw new VoiceParseError(navigator.onLine ? 'network' : 'offline')
  }

  if (!response.ok) throw new VoiceParseError(mapStatus(response.status))

  const body: unknown = await response.json().catch(() => null)
  const result = toResult(body)
  if (!result) throw new VoiceParseError('invalid_response')
  return result
}

/** Records what the owner actually drafted so voice accuracy can be measured. */
export async function saveFinalVoiceItems(eventId: string, items: FinalVoiceItem[]): Promise<void> {
  const { error } = await supabase.rpc('save_voice_final_items', {
    p_event_id: eventId,
    p_items: items,
  })
  if (error) throw new Error(error.message)
}
