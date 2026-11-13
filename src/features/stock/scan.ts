export type ScanFailure = 'denied' | 'unsupported' | 'failed'

export interface ScanHandle {
  stop: () => void
}

interface DetectedBarcode {
  rawValue: string
}

interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'itf']

function failureReason(err: unknown): ScanFailure {
  const name = (err as { name?: string } | null)?.name ?? ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return 'denied'
  }
  if (name === 'NotSupportedError') return 'unsupported'
  return 'failed'
}

export function scanFailure(err: unknown): ScanFailure {
  return failureReason(err)
}

function tagged(reason: ScanFailure): Error {
  const error = new Error(reason) as Error & { scanReason?: ScanFailure }
  error.scanReason = reason
  return error
}

/**
 * Opens the rear camera and reports the first decoded barcode.
 * Uses the native BarcodeDetector when available and lazily loads ZXing otherwise,
 * so the fallback is never in the main bundle.
 */
export async function startScan(
  video: HTMLVideoElement,
  onCode: (code: string) => void,
): Promise<ScanHandle> {
  const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector

  if (Detector) {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
    } catch (err) {
      throw tagged(failureReason(err))
    }

    video.srcObject = stream
    await video.play().catch(() => {})

    const detector = new Detector({ formats: FORMATS })
    let timer: number | null = null
    let stopped = false

    const stop = () => {
      if (stopped) return
      stopped = true
      if (timer !== null) window.clearTimeout(timer)
      stream.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }

    const tick = async () => {
      if (stopped) return
      if (video.readyState >= 2) {
        try {
          const codes = await detector.detect(video)
          if (codes.length > 0) {
            stop()
            onCode(codes[0].rawValue)
            return
          }
        } catch {
          // frame not ready yet; try again on the next tick
        }
      }
      timer = window.setTimeout(() => void tick(), 250)
    }
    void tick()

    return { stop }
  }

  try {
    const { BrowserMultiFormatReader } = await import('@zxing/browser')
    const reader = new BrowserMultiFormatReader()
    let stopFn: (() => void) | null = null
    const controls = await reader.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      video,
      (result) => {
        if (!result) return
        stopFn?.()
        onCode(result.getText())
      },
    )
    stopFn = () => controls.stop()
    return { stop: stopFn }
  } catch (err) {
    throw tagged(failureReason(err))
  }
}
