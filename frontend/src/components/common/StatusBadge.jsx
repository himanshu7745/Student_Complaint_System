import { Badge } from '@/components/ui/badge'

const STATUS_STYLES = {
  NEW: 'info',
  AI_CLASSIFIED: 'info',
  PENDING_ADMIN_ASSIGNMENT: 'warning',
  ASSIGNED_TO_DEPARTMENT: 'info',
  EMAIL_SENT: 'warning',
  ACK_RECEIVED: 'success',
  ACTION_TAKEN: 'success',
  RESOLVED_BY_STUDENT: 'success',
  ESCALATED_TO_DIRECTOR: 'danger',
  CLOSED: 'default',
}

export function StatusBadge({ status }) {
  return <Badge variant={STATUS_STYLES[status] || 'default'}>{(status || 'UNKNOWN').replaceAll('_', ' ')}</Badge>
}
