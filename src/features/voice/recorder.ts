export type RecorderFailure = 'unsupported' | 'denied' | 'failed'

export interface Recording {
  blob: Blob
  durationMs: number
}

export interface RecordingSession {
  stop: () => void
  cancel: () => void
}

export function recorderSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  )
}

function pickMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}

function wasDenied(err: unknown): boolean {
  const name =
    typeof err === 'object' && err !== null && 'name' in err ? String((err as { name: unknown }).name) : ''
  return name === 'NotAllowedError' || name === 'SecurityError'
}

interface StartOptions {
  maxMs: number
  onTick: (elapsedMs: number) => void
  onComplete: (recording: Recording) => void
  onError: (failure: RecorderFailure) => void
}

/** Records one clip. Stops itself at maxMs; the caller either stops or cancels. */
export function startRecording(options: StartOptions): RecordingSession {
  const chunks: Blob[] = []
  let stream: MediaStream | null = null
  let recorder: MediaRecorder | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let startedAt = 0
  let durationMs = 0
  let stopped = false
  let cancelled = false
  let finished = false

  function releaseStream() {
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
  }

  function clearTimer() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function stop() {
    if (stopped) return
    stopped = true
    clearTimer()
    if (recorder && recorder.state !== 'inactive') {
      durationMs = Math.min(Date.now() - startedAt, options.maxMs)
      recorder.stop()
      return
    }
    releaseStream()
  }

  function cancel() {
    cancelled = true
    clearTimer()
    stopped = true
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    } else {
      releaseStream()
    }
  }

  async function begin() {
    if (!recorderSupported()) {
      options.onError('unsupported')
      return
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      if (!cancelled) options.onError(wasDenied(err) ? 'denied' : 'failed')
      return
    }
    if (cancelled || stopped) {
      releaseStream()
      return
    }

    const mimeType = pickMimeType()
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    } catch {
      releaseStream()
      if (!cancelled) options.onError('failed')
      return
    }

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = () => {
      if (finished) return
      finished = true
      clearTimer()
      const type = recorder?.mimeType ?? 'audio/webm'
      releaseStream()
      if (cancelled) return
      options.onComplete({
        blob: new Blob(chunks, { type }),
        durationMs: durationMs || Math.min(Date.now() - startedAt, options.maxMs),
      })
    }

    startedAt = Date.now()
    recorder.start()
    timer = setInterval(() => {
      const elapsed = Date.now() - startedAt
      options.onTick(Math.min(elapsed, options.maxMs))
      if (elapsed >= options.maxMs) stop()
    }, 200)
  }

  void begin()
  return { stop, cancel }
}
