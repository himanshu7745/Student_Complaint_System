import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Checkbox({ checked, onCheckedChange, className, disabled, ...props }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      className={cn(
        'inline-flex h-4 w-4 items-center justify-center rounded border transition focus:outline-none focus:ring-2 focus:ring-blue-200',
        checked ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white text-transparent',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...props}
    >
      <Check className="h-3 w-3" />
    </button>
  )
}
