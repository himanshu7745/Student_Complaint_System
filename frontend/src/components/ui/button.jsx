import React from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-blue-500 shadow-sm',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  outline: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
}

const sizeVariants = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3 text-sm',
  lg: 'h-11 px-5',
  icon: 'h-10 w-10',
}

export const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:pointer-events-none disabled:opacity-50',
          buttonVariants[variant],
          sizeVariants[size],
          className,
        )}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
