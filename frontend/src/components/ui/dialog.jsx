import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={() => onOpenChange?.(false)} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">{children}</div>
    </div>
  )
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn('flex items-start justify-between gap-4 border-b p-5', className)} {...props} />
}

export function DialogTitle({ className, ...props }) {
  return <h3 className={cn('text-base font-semibold text-slate-900', className)} {...props} />
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn('mt-1 text-sm text-slate-500', className)} {...props} />
}

export function DialogContent({ className, ...props }) {
  return <div className={cn('p-5', className)} {...props} />
}

export function DialogClose({ className, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700', className)}
    >
      <X className="h-4 w-4" />
    </button>
  )
}
