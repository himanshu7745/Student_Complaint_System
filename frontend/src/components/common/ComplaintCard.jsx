import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import { SeverityBadge } from './SeverityBadge'
import { formatDate, formatDateTime } from '@/utils/format'

export function ComplaintCard({ complaint, basePath }) {
  return (
    <Card className="animate-fade-up">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{complaint.referenceId}</p>
              <h3 className="mt-1 font-display text-lg font-semibold">{complaint.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{complaint.area} • {formatDate(complaint.complaintDate)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SeverityBadge severity={complaint.aiSeverity} />
              <StatusBadge status={complaint.status} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Assigned Dept</p>
              <p className="font-semibold">{complaint.assignedDepartment?.name || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">SLA Due</p>
              <p className="font-semibold">{formatDateTime(complaint.slaDueAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Overdue</p>
              <p className={complaint.overdue ? 'font-semibold text-rose-700' : 'font-semibold'}>{complaint.overdue ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-semibold">{formatDateTime(complaint.createdAt)}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Link to={`${basePath}/${complaint.id}`}>
              <Button variant="outline">View Details</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
