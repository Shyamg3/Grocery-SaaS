// voice-parse: spoken billing -> structured items (Gemini, server-side only)
//
// POST { shop_id, audio_base64, mime_type } with a Supabase user JWT.
// Steps: verify JWT + shop membership -> reserve one daily call (max 100/shop/day,
// table voice_usage) -> load active products -> Gemini -> zod validate -> log
// voice_events. AI output is a SUGGESTION; prices never come from AI
// (PROJECT_RULES.md #5, #6). The Gemini key lives only in the Supabase secret
// GEMINI_API_KEY and never reaches the browser.
//
// Deploy: supabase functions deploy voice-parse
// Secret: supabase secrets set GEMINI_API_KEY=...

import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

// Current stable Flash model per the official docs (checked 2026-11-14):
// https://aistudio.google.com/docs/models
const GEMINI_MODEL = 'gemini-3.8-flash'
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const CATALOG_LIMIT = 300
const DAILY_LIMIT = 100 // must match v_limit in 006_voice_usage.sql
const MAX_AUDIO_BASE64_CHARS = 8_000_000 // ~6 MB decoded; keeps mobile uploads small
const GEMINI_TIMEOUT_MS = 60_000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const INSTRUCTION = `The speaker is a shop owner in Tamil, English or mixed Tanglish listing items sold.
Extract each item as {spoken_name, qty, unit}. Understand Tamil quantity words:
அரை = 0.5, கால் = 0.25, ஒன்றரை = 1.5, and English like 'half kilo'. Convert grams to kg
when the product unit is kg. Do NOT invent prices. Do NOT guess items that were not
spoken. Return ONLY JSON matching the schema; if unsure, set confidence low.`

// Shape is mirrored by zod below and by Gemini's responseSchema.
const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    transcript: { type: 'STRING' },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          spoken_name: { type: 'STRING' },
          qty: { type: 'NUMBER' },
          unit: { type: 'STRING' },
          confidence: { type: 'NUMBER', minimum: 0, maximum: 1 },
        },
        required: ['spoken_name', 'qty', 'unit', 'confidence'],
        propertyOrdering: ['spoken_name', 'qty', 'unit', 'confidence'],
      },
    },
  },
  required: ['transcript', 'items'],
  propertyOrdering: ['transcript', 'items'],
}

const requestSchema = z.object({
  shop_id: z.string().uuid(),
  audio_base64: z.string().min(1),
  mime_type: z
    .string()
    .trim()
    .regex(/^audio\/[a-z0-9.+-]+$/i),
})

const itemSchema = z.object({
  spoken_name: z.string().min(1),
  qty: z.number().positive(),
  unit: z.string().min(1),
  confidence: z.number().min(0).max(1),
})

const modelOutputSchema = z.object({
  transcript: z.string(),
  items: z.array(itemSchema),
})
type ModelOutput = z.infer<typeof modelOutputSchema>

// No generated DB types are wired into edge functions, so rows are cast at the boundary.
type CatalogProduct = {
  name: string
  name_ta: string | null
  aliases: string[] | null
  unit: string
}

type QuotaRow = { allowed: boolean; used: number; remaining: number }

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fail(
  status: number,
  code: string,
  error: string,
  extra?: Record<string, unknown>,
): Response {
  return json({ code, error, ...extra }, status)
}

function buildPrompt(catalog: CatalogProduct[]): string {
  return `${INSTRUCTION}

Shop product catalog. Match spoken words against "name", "name_ta" or "aliases"; when an
item matches, use that product's unit. The catalog is only for matching - never list a
product the speaker did not say.
${JSON.stringify(catalog)}`
}

async function handle(req: Request): Promise<Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const geminiKey = Deno.env.get('GEMINI_API_KEY')
  if (!supabaseUrl || !anonKey) {
    console.error('voice-parse: SUPABASE_URL / SUPABASE_ANON_KEY missing')
    return fail(500, 'server_misconfigured', 'Voice parsing is not configured correctly.')
  }

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return fail(400, 'invalid_json', 'Send a JSON body.')
  }

  const parsedBody = requestSchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return fail(400, 'invalid_request', 'shop_id, audio_base64 and mime_type are required.', {
      fields: parsedBody.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }
  const { shop_id, mime_type } = parsedBody.data
  const audio = parsedBody.data.audio_base64.replace(/\s+/g, '')

  if (audio.length > MAX_AUDIO_BASE64_CHARS) {
    return fail(413, 'audio_too_large', 'The recording is too long. Keep it under about 60 seconds.')
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(audio)) {
    return fail(400, 'invalid_audio_data', 'The audio is not valid base64.')
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : ''
  if (!jwt) {
    return fail(401, 'unauthorized', 'Please sign in again.')
  }

  const db = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })

  const { data: userData, error: userError } = await db.auth.getUser(jwt)
  if (userError || !userData.user) {
    return fail(401, 'unauthorized', 'Please sign in again.')
  }

  // RLS also restricts this read; the explicit filter gives a clean 403 for non-members.
  const { data: member, error: memberError } = await db
    .from('shop_members')
    .select('role')
    .eq('shop_id', shop_id)
    .eq('user_id', userData.user.id)
    .maybeSingle()
  if (memberError) {
    console.error('voice-parse: shop_members lookup failed', memberError)
    return fail(500, 'membership_check_failed', 'Could not verify shop access. Please try again.')
  }
  if (!member) {
    return fail(403, 'forbidden', 'You do not have access to this shop.')
  }

  if (!geminiKey) {
    console.error('voice-parse: GEMINI_API_KEY secret is not set')
    return fail(500, 'server_misconfigured', 'Voice parsing is not configured correctly.')
  }

  const { data: quotaData, error: quotaError } = await db.rpc('consume_voice_quota', {
    p_shop_id: shop_id,
  })
  if (quotaError) {
    console.error('voice-parse: consume_voice_quota failed', quotaError)
    if (quotaError.code === '42501') {
      return fail(403, 'forbidden', 'You do not have access to this shop.')
    }
    if (quotaError.code === '28000') {
      return fail(401, 'unauthorized', 'Please sign in again.')
    }
    return fail(500, 'quota_check_failed', 'Could not check today\u2019s usage. Please try again.')
  }
  const quota = (Array.isArray(quotaData) ? quotaData[0] : quotaData) as QuotaRow | null
  if (!quota) {
    return fail(500, 'quota_check_failed', 'Could not check today\u2019s usage. Please try again.')
  }
  if (!quota.allowed) {
    return fail(429, 'rate_limited', 'Voice limit reached for today. Try again tomorrow.', {
      used: quota.used,
      limit: DAILY_LIMIT,
    })
  }

  const { data: products, error: productsError } = await db
    .from('products')
    .select('name,name_ta,aliases,unit')
    .eq('shop_id', shop_id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name')
    .limit(CATALOG_LIMIT)
  if (productsError) {
    console.error('voice-parse: products lookup failed', productsError)
    return fail(500, 'catalog_failed', 'Could not load products. Please try again.')
  }
  const catalog = (products ?? []) as CatalogProduct[]

  let geminiRes: Response
  try {
    geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: buildPrompt(catalog) },
              { inlineData: { mimeType: mime_type, data: audio } },
            ],
          },
        ],
        // temperature is intentionally omitted: the current docs mark it unsupported
        // on Gemini 3.6 Flash and later. The response schema enforces the shape.
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
        },
      }),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    })
  } catch (err) {
    console.error('voice-parse: Gemini request failed', err)
    return fail(502, 'gemini_unavailable', 'Voice parsing is temporarily unavailable. Please try again.')
  }

  if (!geminiRes.ok) {
    const detail = await geminiRes.text().catch(() => '')
    console.error(`voice-parse: Gemini ${geminiRes.status}: ${detail.slice(0, 2000)}`)
    if (geminiRes.status === 400) {
      return fail(400, 'invalid_audio', 'The audio could not be processed. Record a shorter clip and try again.')
    }
    if (geminiRes.status === 401 || geminiRes.status === 403) {
      return fail(500, 'server_misconfigured', 'Voice parsing is not configured correctly.')
    }
    return fail(502, 'gemini_unavailable', 'Voice parsing is temporarily unavailable. Please try again.')
  }

  const payload = (await geminiRes.json().catch(() => null)) as GeminiResponse | null
  const text = (payload?.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')
    .trim()
  if (!text) {
    return fail(502, 'empty_model_output', 'We could not understand the recording. Please try again.')
  }

  let rawOutput: unknown
  try {
    rawOutput = JSON.parse(text)
  } catch {
    console.error('voice-parse: model output is not JSON', text.slice(0, 2000))
    return fail(502, 'invalid_model_output', 'We could not read the items clearly. Please record again.')
  }

  const parsedOutput = modelOutputSchema.safeParse(rawOutput)
  if (!parsedOutput.success) {
    console.error('voice-parse: model output failed validation', {
      issues: parsedOutput.error.issues,
      raw: text.slice(0, 2000),
    })
    return fail(502, 'invalid_model_output', 'We could not read the items clearly. Please record again.')
  }

  const result: ModelOutput = parsedOutput.data
  const { data: inserted, error: eventError } = await db
    .from('voice_events')
    .insert({
      shop_id,
      transcript: result.transcript,
      parsed: result,
    })
    .select('id')
    .single()
  if (eventError) {
    // Never hide this: the shop loses the corrected data otherwise (PROJECT_RULES.md error handling).
    console.error('voice-parse: voice_events insert failed', eventError)
    return fail(500, 'event_write_failed', 'The items were read but could not be saved. Please try again.')
  }
  const eventId = (inserted as { id: string } | null)?.id
  if (!eventId) {
    console.error('voice-parse: voice_events insert returned no id')
    return fail(500, 'event_write_failed', 'The items were read but could not be saved. Please try again.')
  }

  // event_id lets the app save the owner-confirmed items back via
  // save_voice_final_items() so accuracy can be measured.
  return json({ ...result, event_id: eventId }, 200)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return fail(405, 'method_not_allowed', 'Use POST.')
  }
  try {
    return await handle(req)
  } catch (err) {
    console.error('voice-parse: unhandled error', err)
    return fail(500, 'internal_error', 'Something went wrong. Please try again.')
  }
})
