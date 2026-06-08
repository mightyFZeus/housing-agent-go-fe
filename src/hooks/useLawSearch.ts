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

export function useLawSearch() {
  const [state, setState] = useState<SearchState>({ state: 'idle' })
  const controllerRef = useRef<AbortController | null>(null)

  const run = useCallback(async (query: string) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setState({ state: 'streaming', data: { answer: '', context: '' } })

    try {
      const data = await searchLaw(query, {
        signal: controller.signal,
        onUpdate: (partial) => setState({ state: 'streaming', data: partial }),
      })
      const normalizedAnswer = data.answer.trim().toLowerCase()
      const notFound = normalizedAnswer === "i don't know"

      setState(notFound ? { state: 'not_found', data } : { state: 'success', data })
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setState({ state: 'error', error: err instanceof Error ? err.message : 'Something went wrong' })
    }
  }, [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    setState({ state: 'idle' })
  }, [])

  return useMemo(() => ({ state, run, reset }), [state, run, reset])
}
