import { AlertCircle, CheckCircle2, CircleDot, Clock3, RotateCcw, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function StatusChip({ status, className }) {
  const map = {
    New: { variant: 'info', icon: CircleDot },
    Acknowledged: { variant: 'default', icon: CheckCircle2 },
    'In Progress': { variant: 'warning', icon: Clock3 },
    'Needs Info': { variant: 'purple', icon: AlertCircle },
    Resolved: { variant: 'success', icon: CheckCircle2 },
    Closed: { variant: 'default', icon: CheckCircle2 },
    Reopened: { variant: 'warning', icon: RotateCcw },
  }
  const config = map[status] || map.New
  const Icon = config.icon
  return (
    <Badge variant={config.variant} className={cn('gap-1.5', className)}>
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  )
}

export function PriorityChip({ priority, className }) {
  const map = {
    Critical: 'danger',
    High: 'warning',
    Medium: 'info',
    Low: 'default',
  }
  return (
    <Badge variant={map[priority] || 'default'} className={cn('gap-1.5', className)}>
      {priority === 'Critical' ? <ShieldAlert className="h-3 w-3" /> : null}
      {priority}
    </Badge>
  )
}

export function CategoryChips({ categories = [], className }) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {categories.map((cat) => (
        <Badge key={cat} variant="default" className="bg-white">
          {cat}
        </Badge>
      ))}
    </div>
  )
}
