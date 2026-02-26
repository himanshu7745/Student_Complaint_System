import { Badge } from '@/components/ui/badge'

const SEVERITY_STYLES = {
  LOW: 'default',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'danger',
}

export function SeverityBadge({ severity }) {
  return <Badge variant={SEVERITY_STYLES[severity] || 'default'}>{severity || 'N/A'}</Badge>
}
