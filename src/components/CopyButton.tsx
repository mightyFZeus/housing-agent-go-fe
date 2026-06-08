import { useCallback, useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CopyButton({
    text,
    label,
    disabled,
    className,
}: {
    text: string
    label: string
    disabled?: boolean
    className?: string
}) {
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!copied) return
        const id = window.setTimeout(() => setCopied(false), 1200)
        return () => window.clearTimeout(id)
    }, [copied])

    const onCopy = useCallback(async () => {
        if (disabled) return
        await navigator.clipboard.writeText(text)
        setCopied(true)
    }, [disabled, text])

    return (
        <button
            type="button"
            onClick={onCopy}
            disabled={disabled}
            className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
        >
            {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4 text-white/70" />}
            {copied ? 'Copied' : label}
        </button>
    )
}
