import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function KpiCard({ label, value, subtext, icon: Icon, trend }) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
            {subtext ? <p className="mt-1 text-xs text-slate-500">{subtext}</p> : null}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
            {Icon ? <Icon className="h-5 w-5 text-slate-600" /> : <ArrowUpRight className="h-5 w-5 text-slate-600" />}
          </div>
        </div>
        {trend ? <div className="mt-4 text-xs font-medium text-emerald-600">{trend}</div> : null}
      </CardContent>
    </Card>
  )
}
