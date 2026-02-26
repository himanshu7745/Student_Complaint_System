import { cn } from '@/lib/utils'

export function Badge({ className, variant = 'default', children, ...props }) {
  const variants = {
    default: 'border-slate-200 bg-slate-50 text-slate-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-red-200 bg-red-50 text-red-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    purple: 'border-violet-200 bg-violet-50 text-violet-700',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        variants[variant] || variants.default,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
