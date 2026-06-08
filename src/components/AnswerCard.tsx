import CopyButton from '@/components/CopyButton'
import ContextPanel from '@/components/ContextPanel'
import Markdown from '@/components/Markdown'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

export default function AnswerCard({
    answer,
    context,
    isStreaming,
}: {
    answer: string
    context: string
    isStreaming?: boolean
}) {
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const shouldAutoScrollRef = useRef(true)

    useEffect(() => {
        const onScroll = () => {
            const doc = document.documentElement
            const distanceFromBottom = doc.scrollHeight - (window.scrollY + window.innerHeight)
            shouldAutoScrollRef.current = distanceFromBottom < 160
        }

        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        if (!isStreaming) return
        if (!shouldAutoScrollRef.current) return
        bottomRef.current?.scrollIntoView({ block: 'end' })
    }, [isStreaming, answer, context])

    return (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">Answer</div>
                        <div className="flex shrink-0 gap-2">
                            <CopyButton text={answer} label="Copy answer" disabled={answer.trim().length === 0} />
                            <CopyButton
                                text={context}
                                label="Copy context"
                                disabled={context.trim().length === 0}
                                className="hidden sm:inline-flex"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        {isStreaming ? (
                            <div className="mb-3 flex items-center gap-2 text-xs text-white/60">
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-200" />
                                Generating…
                            </div>
                        ) : null}
                        <Markdown content={answer} />
                        <div ref={bottomRef} />
                    </div>
                </div>
            </div>

            {context.trim().length > 0 ? (
                <div className="mt-6">
                    <div className="sm:hidden">
                        <CopyButton
                            text={context}
                            label="Copy context"
                            disabled={context.trim().length === 0}
                            className="w-full justify-center"
                        />
                    </div>
                    <div className="mt-3">
                        <ContextPanel context={context} />
                    </div>
                </div>
            ) : null}
        </section>
    )
}
