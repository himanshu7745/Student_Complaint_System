import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }) {
  return <TabsPrimitive.List className={cn('inline-flex h-10 items-center rounded-xl bg-muted p-1', className)} {...props} />
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-soft', className)}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content className={cn('mt-4 outline-none', className)} {...props} />
}
