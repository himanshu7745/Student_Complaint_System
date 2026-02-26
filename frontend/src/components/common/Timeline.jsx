import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/utils/format'

export function Timeline({ events = [] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline / Audit Trail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No timeline events yet.</p>
        ) : (
          events.map((event, index) => (
            <div key={event.id || index} className="relative pl-6">
              <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-primary" />
              {index < events.length - 1 ? <span className="absolute left-[3px] top-4 h-[calc(100%+8px)] w-px bg-border" /> : null}
              <div className="rounded-xl border bg-white/70 p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{event.eventType}</Badge>
                  <Badge variant="default">{event.createdBy}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                </div>
                <p className="text-sm leading-6">{event.message}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
