import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import AnswerCard from '@/components/AnswerCard'
import ErrorBanner from '@/components/ErrorBanner'
import ExampleQueries from '@/components/ExampleQueries'
import StatusChip from '@/components/StatusChip'
import { useHealthStatus } from '@/hooks/useHealthStatus'
import { useLawSearch } from '@/hooks/useLawSearch'
import { cn } from '@/lib/utils'
import { validateQuery } from '@/utils/validation'

export default function Home() {
  const health = useHealthStatus()
  const { state, run, reset } = useLawSearch()
  const [rawQuery, setRawQuery] = useState('')

  const validation = useMemo(() => validateQuery(rawQuery), [rawQuery])
  const isBusy = state.state === 'loading' || state.state === 'streaming'



  useEffect(() => {
    if (rawQuery.trim().length === 0) reset()
  }, [rawQuery, reset])

  const canSubmit = validation.isValid && !isBusy

  const onSubmit = useCallback(() => {
    if (!validation.isValid) return
    run(validation.value)
  }, [run, validation.isValid, validation.value])

  return (
    <div className="min-h-screen bg-app px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-semibold tracking-wide text-amber-200/90">Housing-Agent</div>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Lagos tenancy law, with receipts.
            </h1>
            <p className="mt-3 max-w-[55ch] text-sm leading-relaxed text-white/70">
              Ask a question and get an answer plus the official document excerpt used.
            </p>
          </div>
          <div className="self-start sm:self-auto">
            <StatusChip status={health} />
          </div>
        </header>

        <main className="mt-10 grid gap-6">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="query" className="text-sm font-semibold text-white/90">
                Your question
              </label>
              <div className={cn('text-xs tabular-nums', validation.value.length > 500 ? 'text-rose-200' : 'text-white/50')}>
                {validation.value.length}/500
              </div>
            </div>

            <textarea
              id="query"
              name="query"
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  onSubmit()
                }
              }}
              disabled={isBusy}
              rows={4}
              className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-relaxed text-white/90 placeholder:text-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 disabled:opacity-60"
              placeholder="e.g. What notice must a landlord give before eviction in Lagos?"
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-5 text-xs text-white/60">
                {validation.error ? (
                  <span className="text-rose-200">{validation.error}</span>
                ) : (
                  <span>Tip: press Cmd/Ctrl+Enter to search.</span>
                )}
              </div>

              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {isBusy ? 'Searching…' : 'Search'}
              </button>
            </div>
          </section>

          {state.state === 'error' ? <ErrorBanner message={state.error} /> : null}

          {state.state === 'idle' ? (
            <div className="grid gap-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="text-sm font-semibold text-white/90">What you’ll get</div>
                <ul className="mt-3 grid gap-2 text-sm text-white/70">
                  <li className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300/90" />
                    Answer generated from the backend model
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300/90" />
                    A quoted excerpt from the official document, for transparency
                  </li>
                </ul>
              </div>
              <ExampleQueries onPick={(q) => setRawQuery(q)} />
            </div>
          ) : null}

          {state.state === 'loading' ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 text-sm text-white/70">
                <span className="h-6 w-6 rounded-full border border-white/15 bg-white/5 p-1">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-200" />
                </span>
                Searching your knowledge base…
              </div>
              <div className="mt-4 grid gap-3">
                <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          ) : null}

          {state.state === 'not_found' ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-white/90">Not found in provided context</div>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                The backend returned “I don’t know”. Try rephrasing, or use one of the examples.
              </p>
              <div className="mt-5">
                <ExampleQueries onPick={(q) => setRawQuery(q)} />
              </div>
            </div>
          ) : null}

          {state.state === 'streaming' ? (
            <AnswerCard answer={state.data.answer} context={state.data.context} isStreaming />
          ) : null}

          {state.state === 'success' ? <AnswerCard answer={state.data.answer} context={state.data.context} /> : null}
        </main>


      </div>
    </div>
  )
}
