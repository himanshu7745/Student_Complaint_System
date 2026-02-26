import React from 'react'
import { cn } from '@/lib/utils'

export const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn('flex h-10 w-full rounded-xl border border-input bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring', className)}
      {...props}
    >
      {children}
    </select>
  )
})
