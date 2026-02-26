import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sheet({ open, onOpenChange, side = 'right', children }) {
  if (!open) return null
  const sideClasses = {
    right: 'right-0 top-0 h-full w-full max-w-2xl translate-x-0',
    left: 'left-0 top-0 h-full w-full max-w-2xl translate-x-0',
  }
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/30" onClick={() => onOpenChange?.(false)} />
      <div className={cn('absolute border-l border-slate-200 bg-white shadow-2xl', sideClasses[side])}>{children}</div>
    </div>
  )
}

export function SheetHeader({ className, ...props }) {
  return <div className={cn('flex items-start justify-between gap-3 border-b p-5', className)} {...props} />
}

export function SheetTitle({ className, ...props }) {
  return <h3 className={cn('text-base font-semibold text-slate-900', className)} {...props} />
}

export function SheetDescription({ className, ...props }) {
  return <p className={cn('mt-1 text-sm text-slate-500', className)} {...props} />
}

export function SheetContent({ className, ...props }) {
  return <div className={cn('h-full overflow-y-auto p-5', className)} {...props} />
}

export function SheetClose({ className, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('rounded-lg p-2 text-slate-500 hover:bg-slate-100', className)}
    >
      <X className="h-4 w-4" />
    </button>
  )
}
