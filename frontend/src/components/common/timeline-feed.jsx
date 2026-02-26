import { Clock3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateTime } from '@/lib/format'

export function TimelineFeed({ items = [] }) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm text-slate-500">No timeline activity yet.</CardContent>
        </Card>
      ) : null}
      {items.map((item) => (
        <div key={item.id} className="relative pl-8">
          <span className="absolute left-3 top-7 h-full w-px bg-slate-200" aria-hidden />
          <span className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
            <Clock3 className="h-3.5 w-3.5 text-slate-500" />
          </span>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-slate-900">{item.action}</span>
                <span className="text-slate-400">by</span>
                <span className="text-slate-600">{item.actor}</span>
              </div>
              {item.detail ? <p className="mt-1.5 text-sm text-slate-600">{item.detail}</p> : null}
              <div className="mt-2 text-xs text-slate-400">{formatDateTime(item.timestamp)}</div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
