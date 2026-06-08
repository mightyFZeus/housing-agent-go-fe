import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const EXAMPLES = [
    'What notice period is required to quit a monthly tenancy in Lagos?',
    'Can a landlord increase rent without serving notice in Lagos?',
    'What is the difference between a tenant and a licensee?',
    'Can a tenant be evicted without a court order in Lagos State?',
]

export default function ExampleQueries({
    onPick,
    className,
}: {
    onPick: (value: string) => void
    className?: string
}) {
    return (
        <div className={cn('rounded-2xl border border-white/10 bg-white/5 p-5', className)}>
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Sparkles className="h-4 w-4 text-amber-200" />
                Try an example
            </div>
            <div className="mt-4 grid gap-2">
                {EXAMPLES.map((q) => (
                    <button
                        key={q}
                        type="button"
                        onClick={() => onPick(q)}
                        className="group rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left text-sm text-white/80 transition hover:border-white/20 hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                    >
                        <span className="text-white/90 transition group-hover:text-white">{q}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
