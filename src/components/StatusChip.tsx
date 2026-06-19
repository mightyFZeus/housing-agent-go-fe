import { cn } from '@/lib/utils'
import type { HealthStatus } from '@/hooks/useHealthStatus'

export default function StatusChip({ status }: { status: HealthStatus }) {
    if (status.state === 'loading') {
        return (
            <span className={cn('inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70')}>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40" />
                Checking backend…
            </span>
        )
    }

    if (status.state === 'offline') {
        return (
            <span className={cn('inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs text-rose-100')}>
                <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
                Backend offline
            </span>
        )
    }

    return (
        <span className={cn('inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100')}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            Online
        </span>
    )
}
