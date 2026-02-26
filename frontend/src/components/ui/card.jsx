import { cn } from '@/lib/utils'

export function Card({ className, ...props }) {
  return <div className={cn('rounded-2xl border bg-card/90 text-card-foreground shadow-soft backdrop-blur-sm', className)} {...props} />
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-display text-lg font-bold tracking-tight', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}
