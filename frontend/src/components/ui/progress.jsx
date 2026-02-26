import { cn } from '@/lib/utils'

export function Progress({ value = 0, className, indicatorClassName }) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div
        className={cn('h-full rounded-full bg-blue-500 transition-all duration-300', indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
