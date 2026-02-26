import { createContext, useContext, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

const TabsContext = createContext(null)

export function Tabs({ defaultValue, value, onValueChange, className, children }) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const currentValue = value ?? internalValue
  const setValue = onValueChange ?? setInternalValue
  const ctx = useMemo(() => ({ value: currentValue, setValue }), [currentValue, setValue])

  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }) {
  return (
    <div
      className={cn('inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ value, className, children, ...props }) {
  const ctx = useContext(TabsContext)
  const active = ctx?.value === value
  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={cn(
        'inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium transition',
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children, ...props }) {
  const ctx = useContext(TabsContext)
  if (ctx?.value !== value) return null
  return (
    <div className={cn('mt-4', className)} {...props}>
      {children}
    </div>
  )
}
