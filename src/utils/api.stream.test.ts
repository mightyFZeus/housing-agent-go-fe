import { describe, expect, it, vi } from 'vitest'
import { searchLaw } from '@/utils/api'

function makeStream(chunks: string[]) {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

describe('searchLaw streaming', () => {
  it('handles SSE (text/event-stream) with deltas', async () => {
    const originalFetch = globalThis.fetch
    const updates: Array<{ answer: string; context: string }> = []

    globalThis.fetch = vi.fn(async () => {
      const stream = makeStream([
        'data: {"answer_delta":"Under Lagos State law\\n\\n"}\n\n',
        'data: {"answer_delta":"* **Sitting tenant**\\n"}\n\n',
        'data: {"context":"Section 4 — Advance Rent..."}\n\n',
        'data: [DONE]\n\n',
      ])

      return new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    }) as unknown as typeof fetch

    try {
      const data = await searchLaw('advance rent', {
        onUpdate: (p) => updates.push({ ...p }),
      })

      expect(data.answer).toContain('Under Lagos State law')
      expect(data.answer).toContain('Sitting tenant')
      expect(data.context).toContain('Section 4')
      expect(updates.length).toBeGreaterThan(0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('handles NDJSON line-delimited JSON', async () => {
    const originalFetch = globalThis.fetch
    const updates: Array<{ answer: string; context: string }> = []

    globalThis.fetch = vi.fn(async () => {
      const stream = makeStream([
        '{"answer_delta":"A"}\n',
        '{"answer_delta":"B"}\n',
        '{"context":"CTX"}\n',
      ])

      return new Response(stream, {
        status: 200,
        headers: { 'content-type': 'application/x-ndjson' },
      })
    }) as unknown as typeof fetch

    try {
      const data = await searchLaw('q', { onUpdate: (p) => updates.push({ ...p }) })
      expect(data.answer).toBe('AB')
      expect(data.context).toBe('CTX')
      expect(updates.length).toBeGreaterThan(0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('preserves word fragments exactly as they stream in', async () => {
    const originalFetch = globalThis.fetch

    globalThis.fetch = vi.fn(async () => {
      const stream = makeStream([
        'data: {"answer_delta":"ten"}\n\n',
        'data: {"answer_delta":"ancy"}\n\n',
        'data: {"answer_delta":" law"}\n\n',
        'data: [DONE]\n\n',
      ])

      return new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    }) as unknown as typeof fetch

    try {
      const data = await searchLaw('tenant law')
      expect(data.answer).toBe('tenancy law')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('adds spaces between streamed word tokens that omit leading whitespace', async () => {
    const originalFetch = globalThis.fetch

    globalThis.fetch = vi.fn(async () => {
      const stream = makeStream([
        'data: {"answer_delta":"The"}\n\n',
        'data: {"answer_delta":"tenant"}\n\n',
        'data: {"answer_delta":"must"}\n\n',
        'data: {"answer_delta":"give"}\n\n',
        'data: {"answer_delta":"notice."}\n\n',
        'data: [DONE]\n\n',
      ])

      return new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      })
    }) as unknown as typeof fetch

    try {
      const data = await searchLaw('notice')
      expect(data.answer).toBe('The tenant must give notice.')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
