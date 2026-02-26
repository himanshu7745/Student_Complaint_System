import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border bg-white/70 hover:bg-white text-foreground',
  ghost: 'hover:bg-secondary text-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
}

const sizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-lg px-6',
  icon: 'h-10 w-10',
}

export function Button({ className, variant = 'default', size = 'default', asChild = false, ...props }) {
  const Comp = asChild ? 'span' : 'button'
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variants[variant] || variants.default,
        sizes[size] || sizes.default,
        className
      )}
      {...props}
    />
  )
}
