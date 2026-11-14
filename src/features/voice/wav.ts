/**
 * Gemini accepts WAV but not the containers phones record by default
 * (Chrome: webm/opus, Safari: mp4/aac), so recordings are decoded and
 * re-encoded to 16 kHz mono PCM WAV before upload. 15 s ≈ 480 KB.
 */
export const VOICE_SAMPLE_RATE = 16_000

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
}

export function encodeWavPcm16(samples: Float32Array, sampleRate: number = VOICE_SAMPLE_RATE): Uint8Array {
  const dataLength = samples.length * 2
  const bytes = new Uint8Array(44 + dataLength)
  const view = new DataView(bytes.buffer)

  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeAscii(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0))
    view.setInt16(offset, Math.round(clamped * (clamped < 0 ? 0x8000 : 0x7fff)), true)
    offset += 2
  }
  return bytes
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/** Decode any MediaRecorder container and return base64 WAV for the Edge Function. */
export async function recordingToWavBase64(blob: Blob): Promise<string> {
  const encoded = await blob.arrayBuffer()
  const context = new AudioContext()
  try {
    const decoded = await context.decodeAudioData(encoded)
    const seconds = Math.min(Math.max(decoded.duration, 0.1), 15)
    const frames = Math.max(1, Math.ceil(seconds * VOICE_SAMPLE_RATE))
    const offline = new OfflineAudioContext(1, frames, VOICE_SAMPLE_RATE)
    const source = offline.createBufferSource()
    source.buffer = decoded
    source.connect(offline.destination)
    source.start()
    const rendered = await offline.startRendering()
    return bytesToBase64(encodeWavPcm16(rendered.getChannelData(0)))
  } finally {
    void context.close()
  }
}
