import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={8}
        className={cn('z-50 min-w-44 rounded-xl border bg-white p-1 shadow-soft', className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn('flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none hover:bg-muted focus:bg-muted', className)}
      {...props}
    />
  )
}
