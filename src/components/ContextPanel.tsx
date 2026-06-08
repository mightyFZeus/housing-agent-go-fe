import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { normalizeContextText } from '@/utils/formatting'

export default function ContextPanel({ context }: { context: string }) {
    const id = useId()
    const [open, setOpen] = useState(false)
    const cleaned = normalizeContextText(context)

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5">
            <button
                type="button"
                aria-controls={id}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
            >
                <div>
                    <div className="text-sm font-semibold text-white/90">Official document excerpt</div>
                    <div className="text-xs text-white/60">Quoted source text used to generate the answer</div>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-white/70 transition', open ? 'rotate-180' : 'rotate-0')} />
            </button>

            <div
                id={id}
                className={cn(
                    'grid overflow-hidden px-5 transition-[grid-template-rows,opacity] duration-300',
                    open ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] pb-0 opacity-0',
                )}
            >
                <div className="min-h-0">
                    <pre className="max-h-[40vh] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-relaxed text-white/80">
                        {cleaned}
                    </pre>
                </div>
            </div>
        </div>
    )
}
