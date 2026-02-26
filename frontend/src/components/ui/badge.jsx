import { cn } from '@/lib/utils'

export function Badge({ className, variant = 'default', ...props }) {
  const variantClass = {
    default: 'bg-secondary text-secondary-foreground',
    outline: 'border bg-transparent',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-900',
    danger: 'bg-rose-100 text-rose-900',
    info: 'bg-sky-100 text-sky-900',
  }[variant]

  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide', variantClass, className)}
      {...props}
    />
  )
}
