import { Clock3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatRelative } from '@/lib/format'

export function SLAIndicator({ dueAt, status }) {
  if (!dueAt) return <Badge variant="default">No SLA</Badge>
  const overdue = new Date(dueAt) < new Date() && !['Resolved', 'Closed'].includes(status)
  return (
    <Badge variant={overdue ? 'danger' : 'default'} className="gap-1.5">
      <Clock3 className="h-3 w-3" />
      {overdue ? 'Overdue' : 'Due'} {formatRelative(dueAt)}
    </Badge>
  )
}
