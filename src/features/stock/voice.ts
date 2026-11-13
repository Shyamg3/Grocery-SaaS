export interface VoiceCandidate {
  id: string
  name: string
  name_ta: string | null
  aliases: string[]
}

interface SpeechAlternative {
  transcript: string
}

interface SpeechResult {
  0: SpeechAlternative
  isFinal: boolean
  length: number
}

interface SpeechResultList {
  length: number
  [index: number]: SpeechResult
}

interface SpeechResultEvent {
  results: SpeechResultList
}

interface SpeechErrorEvent {
  error?: string
}

interface RecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  abort: () => void
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
}

type RecognitionCtor = new () => RecognitionLike

export type VoiceFailure = 'unsupported' | 'denied' | 'failed'

function recognitionCtor(): RecognitionCtor | null {
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

export function voiceSupported(): boolean {
  return recognitionCtor() !== null
}

interface ListenCallbacks {
  onTranscript: (text: string) => void
  onError: (reason: VoiceFailure) => void
  onEnd: () => void
}

/** One short utterance; returns a cancel function. */
export function listenOnce(lang: 'ta' | 'en', callbacks: ListenCallbacks): () => void {
  const Ctor = recognitionCtor()
  if (!Ctor) {
    callbacks.onError('unsupported')
    callbacks.onEnd()
    return () => {}
  }

  const recognition = new Ctor()
  recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-IN'
  recognition.interimResults = false
  recognition.continuous = false

  let finished = false
  recognition.onresult = (event) => {
    const last = event.results[event.results.length - 1]
    const text = last?.[0]?.transcript?.trim() ?? ''
    if (text) callbacks.onTranscript(text)
  }
  recognition.onerror = (event) => {
    if (finished) return
    const denied = event.error === 'not-allowed' || event.error === 'service-not-allowed'
    callbacks.onError(denied ? 'denied' : 'failed')
  }
  recognition.onend = () => {
    if (finished) return
    finished = true
    callbacks.onEnd()
  }

  try {
    recognition.start()
  } catch {
    callbacks.onError('failed')
    callbacks.onEnd()
  }

  return () => {
    finished = true
    try {
      recognition.abort()
    } catch {
      // recognition already stopped
    }
  }
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"'()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Matches a spoken transcript against catalog names, Tamil names and aliases. */
export function matchProduct<T extends VoiceCandidate>(products: T[], transcript: string): T | null {
  const phrase = normalize(transcript)
  if (phrase === '') return null
  const words = phrase.split(' ')

  let best: { product: T; score: number } | null = null
  for (const product of products) {
    const names = [product.name, product.name_ta ?? '', ...product.aliases]
      .map(normalize)
      .filter((name) => name !== '')

    let score = 0
    for (const name of names) {
      if (name === phrase) {
        score = Math.max(score, 100)
      } else if (phrase.includes(name) || name.includes(phrase)) {
        score = Math.max(score, 60)
      } else {
        const nameWords = name.split(' ')
        const hits = nameWords.filter((word) => words.includes(word)).length
        if (hits > 0) score = Math.max(score, Math.round((hits / nameWords.length) * 40))
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { product, score }
  }

  return best && best.score >= 40 ? best.product : null
}
