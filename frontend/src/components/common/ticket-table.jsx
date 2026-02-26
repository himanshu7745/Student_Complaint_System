import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CategoryChips, PriorityChip, StatusChip } from '@/components/common/chips'
import { EmptyState } from '@/components/common/empty-state'
import { formatRelative } from '@/lib/format'
import { Progress } from '@/components/ui/progress'
import { SLAIndicator } from '@/components/common/sla-indicator'

export function TicketTable({
  tickets = [],
  loading = false,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  mode = 'user',
}) {
  if (loading) {
    return (
      <div className="space-y-3 rounded-xl border bg-white p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-3">
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-4 h-4" />
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-2 h-4" />
            <Skeleton className="col-span-2 h-4" />
          </div>
        ))}
      </div>
    )
  }

  if (!tickets.length) {
    return <EmptyState title="No tickets found" description="Try adjusting filters or search terms." />
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-soft">
      <Table>
        <TableHeader>
          <tr>
            {selectable ? <TableHead className="w-10"><span className="sr-only">Select</span></TableHead> : null}
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            {mode === 'admin' ? <TableHead>Confidence</TableHead> : null}
            {mode === 'admin' ? <TableHead>Owner</TableHead> : null}
            <TableHead>{mode === 'admin' ? 'SLA' : 'Updated'}</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id} className="cursor-pointer" onClick={() => onRowClick?.(ticket)}>
              {selectable ? (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selectedIds.includes(ticket.id)} onCheckedChange={() => onToggleSelect?.(ticket.id)} />
                </TableCell>
              ) : null}
              <TableCell className="font-medium text-slate-900">{ticket.id}</TableCell>
              <TableCell>
                <div className="max-w-[280px]">
                  <div className="truncate font-medium text-slate-800">{ticket.title}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{ticket.location?.building || '-'} / {ticket.location?.room || '-'}</div>
                </div>
              </TableCell>
              <TableCell><CategoryChips categories={ticket.categories} /></TableCell>
              <TableCell><PriorityChip priority={ticket.priority} /></TableCell>
              <TableCell><StatusChip status={ticket.status} /></TableCell>
              {mode === 'admin' ? (
                <TableCell>
                  <div className="w-28">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>{ticket.confidence?.overall ?? '-'}%</span>
                    </div>
                    <Progress
                      value={ticket.confidence?.overall || 0}
                      className="h-1.5"
                      indicatorClassName={ticket.confidence?.belowThreshold ? 'bg-amber-500' : 'bg-emerald-500'}
                    />
                  </div>
                </TableCell>
              ) : null}
              {mode === 'admin' ? (
                <TableCell>
                  <div className="max-w-[160px] truncate">{ticket.assignees?.owner?.name || 'Unassigned'}</div>
                </TableCell>
              ) : null}
              <TableCell>
                {mode === 'admin' ? (
                  <SLAIndicator dueAt={ticket.slaDueAt} status={ticket.status} />
                ) : (
                  <span className="text-sm text-slate-600">{formatRelative(ticket.updatedAt)}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
