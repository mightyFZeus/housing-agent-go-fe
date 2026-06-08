import { useEffect, useMemo, useState } from 'react'
import { getHealth } from '@/utils/api'

export type HealthStatus =
  | { state: 'loading' }
  | { state: 'online'; env: string }
  | { state: 'offline'; error: string }

export function useHealthStatus(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>({ state: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    getHealth(controller.signal)
      .then((data) => setStatus({ state: 'online', env: data.env }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setStatus({ state: 'offline', error: err instanceof Error ? err.message : 'Offline' })
      })

    return () => controller.abort()
  }, [])

  return useMemo(() => status, [status])
}
