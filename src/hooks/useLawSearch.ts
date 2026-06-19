import { useCallback, useMemo, useRef, useState } from 'react'
import { searchLaw } from '@/utils/api'

export type SearchResult = {
  answer: string
  context: string
}

export type SearchState =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'streaming'; data: SearchResult }
  | { state: 'success'; data: SearchResult }
  | { state: 'not_found'; data: SearchResult }
  | { state: 'error'; error: string }

function requestRenderFrame(callback: () => void) {
  if (typeof globalThis.requestAnimationFrame === 'function') {
    const id = globalThis.requestAnimationFrame(callback)
    return () => globalThis.cancelAnimationFrame(id)
  }

  const id = globalThis.setTimeout(callback, 16)
  return () => globalThis.clearTimeout(id)
}

export function useLawSearch() {
  const [state, setState] = useState<SearchState>({ state: 'idle' })
  const controllerRef = useRef<AbortController | null>(null)

  const run = useCallback(async (query: string) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setState({ state: 'streaming', data: { answer: '', context: '' } })

    let queuedData: SearchResult | null = null
    let cancelQueuedFrame: (() => void) | null = null
    let streamIsActive = true

    const cancelQueuedUpdate = () => {
      cancelQueuedFrame?.()
      cancelQueuedFrame = null
      queuedData = null
    }

    const flushQueuedUpdate = () => {
      cancelQueuedFrame = null
      if (!streamIsActive || !queuedData) return

      const nextData = queuedData
      queuedData = null

      setState((current) => {
        if (controllerRef.current !== controller || current.state !== 'streaming') return current
        return { state: 'streaming', data: nextData }
      })
    }

    const queueStreamingUpdate = (partial: SearchResult) => {
      queuedData = partial
      if (cancelQueuedFrame) return
      cancelQueuedFrame = requestRenderFrame(flushQueuedUpdate)
    }

    try {
      const data = await searchLaw(query, {
        signal: controller.signal,
        onUpdate: queueStreamingUpdate,
      })
      const normalizedAnswer = data.answer.trim().toLowerCase()
      const notFound = normalizedAnswer === "i don't know"

      streamIsActive = false
      cancelQueuedUpdate()
      if (controllerRef.current !== controller) return

      setState(notFound ? { state: 'not_found', data } : { state: 'success', data })
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      streamIsActive = false
      cancelQueuedUpdate()
      if (controllerRef.current !== controller) return
      setState({ state: 'error', error: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      streamIsActive = false
      cancelQueuedUpdate()
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    setState({ state: 'idle' })
  }, [])

  return useMemo(() => ({ state, run, reset }), [state, run, reset])
}
