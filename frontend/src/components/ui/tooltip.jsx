import { cn } from '@/lib/utils'

export function Tooltip({ content, children, className }) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      {children}
      {content ? (
        <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-soft group-hover:block">
          {content}
        </span>
      ) : null}
    </span>
  )
}
