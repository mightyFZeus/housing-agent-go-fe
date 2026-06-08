export type HealthOk = { status: string; env: string }
export type ApiError = { error: string }

export type SearchOk = {
  data: {
    answer: string
    context: string
  }
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  options: {
    signal?: AbortSignal
    timeoutMs: number
  },
): Promise<Response> {
  const controller = new AbortController()
  let timedOut = false

  if (options.signal) {
    if (options.signal.aborted) controller.abort()
    else options.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, options.timeoutMs)

  try {
    return await fetch(input, { signal: controller.signal })
  } catch (err: unknown) {
    if (timedOut) throw new Error('Request timed out')
    throw err
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

export async function getHealth(signal?: AbortSignal): Promise<HealthOk> {
  const res = await fetchWithTimeout('/health', { signal, timeoutMs: 2000 })
  const json = (await res.json().catch(() => null)) as unknown

  if (!res.ok) {
    const message = typeof (json as ApiError | null)?.error === 'string' ? (json as ApiError).error : 'Health check failed'
    throw new Error(message)
  }

  return json as HealthOk
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

async function readErrorMessage(res: Response): Promise<string> {
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const json = (await res.json().catch(() => null)) as unknown
    if (typeof (json as ApiError | null)?.error === 'string') return (json as ApiError).error
  }

  const text = await res.text().catch(() => '')
  return text.trim().length > 0 ? text.trim() : `Request failed (${res.status})`
}

type SearchPartial = {
  answer: string
  context: string
}

function appendSmart(prev: string, next: string) {
  if (prev.length === 0) return next
  if (next.length === 0) return prev

  if (/\s$/.test(prev) || /^\s/.test(next)) return prev + next

  const last = prev[prev.length - 1]
  const first = next[0]

  const isAlnum = (c: string) => /[A-Za-z0-9]/.test(c)
  if (next.length >= 2 && isAlnum(last) && isAlnum(first)) return `${prev} ${next}`
  return prev + next
}

function applyStreamPayload(payload: unknown, state: SearchPartial): SearchPartial {
  if (typeof payload === 'string') {
    return { ...state, answer: appendSmart(state.answer, payload) }
  }

  if (!payload || typeof payload !== 'object') return state

  const record = payload as Record<string, unknown>

  const data = record.data
  if (data && typeof data === 'object') {
    const answer = (data as Record<string, unknown>).answer
    const context = (data as Record<string, unknown>).context
    if (typeof answer === 'string' && typeof context === 'string') return { answer, context }
  }

  const delta =
    record.answer_delta ??
    record.answerDelta ??
    record.delta ??
    record.text ??
    record.content

  if (typeof delta === 'string') {
    return { ...state, answer: appendSmart(state.answer, delta) }
  }

  const answer = record.answer
  if (typeof answer === 'string') {
    return { ...state, answer }
  }

  const context = record.context
  if (typeof context === 'string') {
    return { ...state, context }
  }

  return state
}

function extractSseEvents(buffer: string): { events: string[]; rest: string } {
  const events: string[] = []
  let rest = buffer

  while (true) {
    const idx = rest.indexOf('\n\n')
    if (idx === -1) break
    events.push(rest.slice(0, idx))
    rest = rest.slice(idx + 2)
  }

  return { events, rest }
}

function parseSseEvent(eventText: string): string[] {
  const lines = eventText.split('\n')
  const dataLines: string[] = []

  for (const line of lines) {
    if (!line.startsWith('data:')) continue
    dataLines.push(line.slice(5).trimStart())
  }

  const joined = dataLines.join('\n').trim()
  if (joined.length === 0) return []
  if (joined === '[DONE]') return []
  return [joined]
}

function isProbablySse(contentType: string, firstChunk: string) {
  if (contentType.includes('text/event-stream')) return true
  return firstChunk.trimStart().startsWith('data:')
}

export async function searchLaw(
  query: string,
  options?: {
    signal?: AbortSignal
    onUpdate?: (partial: SearchPartial) => void
  },
): Promise<SearchOk['data']> {
  const url = `/search?query=${encodeURIComponent(query)}`

  let lastError: unknown = null

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetchWithTimeout(url, { signal: options?.signal, timeoutMs: 60000 })

      if (!res.ok) {
        const message = await readErrorMessage(res)

        if (attempt === 0 && res.status >= 500) {
          await sleep(250)
          continue
        }

        throw new Error(message)
      }

      const body = res.body
      if (!body) {
        const json = (await res.json().catch(() => null)) as unknown
        if (json && typeof (json as SearchOk).data?.answer === 'string' && typeof (json as SearchOk).data?.context === 'string') {
          return (json as SearchOk).data
        }
        throw new Error('Unexpected response from server')
      }

      const reader = body.getReader()
      const decoder = new TextDecoder()
      const contentType = res.headers.get('content-type') ?? ''

      let firstChunk = ''
      let buffer = ''
      let raw = ''
      let partial: SearchPartial = { answer: '', context: '' }
      let mode: 'unknown' | 'sse' | 'ndjson' = 'unknown'

      while (true) {
        const read = await reader.read()
        if (read.done) break

        const chunkText = decoder.decode(read.value, { stream: true })
        raw += chunkText
        buffer += chunkText

        if (firstChunk.length === 0) {
          firstChunk = chunkText
          if (isProbablySse(contentType, firstChunk)) mode = 'sse'
        }

        if (mode === 'sse') {
          const extracted = extractSseEvents(buffer)
          buffer = extracted.rest
          for (const eventText of extracted.events) {
            for (const dataText of parseSseEvent(eventText)) {
              let payload: unknown = dataText
              if (dataText.startsWith('{') || dataText.startsWith('[')) {
                payload = JSON.parse(dataText)
              }
              partial = applyStreamPayload(payload, partial)
              options?.onUpdate?.(partial)
            }
          }
          continue
        }

        while (true) {
          const idx = buffer.indexOf('\n')
          if (idx === -1) break
          const line = buffer.slice(0, idx).trim()
          buffer = buffer.slice(idx + 1)
          if (line.length === 0) continue

          if (mode === 'unknown' && line.startsWith('data:')) {
            mode = 'sse'
            buffer = `data:${line.slice(5)}\n` + buffer
            break
          }

          mode = 'ndjson'
          const payload = JSON.parse(line) as unknown
          partial = applyStreamPayload(payload, partial)
          options?.onUpdate?.(partial)
        }
      }

      const tail = decoder.decode()
      if (tail.length > 0) {
        raw += tail
        buffer += tail
      }

      if (mode === 'sse') {
        const extracted = extractSseEvents(buffer)
        for (const eventText of extracted.events) {
          for (const dataText of parseSseEvent(eventText)) {
            let payload: unknown = dataText
            if (dataText.startsWith('{') || dataText.startsWith('[')) {
              payload = JSON.parse(dataText)
            }
            partial = applyStreamPayload(payload, partial)
            options?.onUpdate?.(partial)
          }
        }
        return partial
      }

      const tailLine = buffer.trim()
      if (tailLine.length > 0 && (tailLine.startsWith('{') || tailLine.startsWith('['))) {
        const payload = (() => {
          try {
            return JSON.parse(tailLine) as unknown
          } catch {
            return null
          }
        })()

        if (payload !== null) {
          partial = applyStreamPayload(payload, partial)
          options?.onUpdate?.(partial)
          mode = 'ndjson'
        }
      }

      if (mode === 'unknown') {
        const trimmed = raw.trim()
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          const json = JSON.parse(trimmed) as unknown
          partial = applyStreamPayload(json, partial)
          options?.onUpdate?.(partial)
          return partial
        }
      }

      return partial
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err

      lastError = err

      if (attempt === 0) {
        await sleep(250)
        continue
      }

      throw err instanceof Error ? err : new Error('Request failed')
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed')
}
