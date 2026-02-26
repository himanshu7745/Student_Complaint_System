import { Card, CardContent } from '@/components/ui/card'
import { CategoryChips, PriorityChip, StatusChip } from '@/components/common/chips'
import { formatRelative } from '@/lib/format'
import { SLAIndicator } from '@/components/common/sla-indicator'

export function TicketCard({ ticket, onClick, footer, compact = false }) {
  return (
    <Card
      className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <CardContent className={compact ? 'p-4' : 'p-5'}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-400">{ticket.id}</div>
            <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{ticket.title}</h3>
            <p className="mt-1 text-xs text-slate-500">Updated {formatRelative(ticket.updatedAt)}</p>
          </div>
          <StatusChip status={ticket.status} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <PriorityChip priority={ticket.priority} />
          <SLAIndicator dueAt={ticket.slaDueAt} status={ticket.status} />
        </div>
        <CategoryChips categories={ticket.categories} className="mt-3" />
        {footer ? <div className="mt-4 border-t pt-3">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}
