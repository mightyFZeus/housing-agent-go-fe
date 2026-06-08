import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ErrorBanner({ message, className }: { message: string; className?: string }) {
    return (
        <div
            role="alert"
            className={cn(
                'flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-rose-50',
                className,
            )}
        >
            <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-200" />
            <div className="text-sm leading-relaxed">
                <div className="font-medium">Error</div>
                <div className="text-rose-50/90">{message}</div>
            </div>
        </div>
    )
}
