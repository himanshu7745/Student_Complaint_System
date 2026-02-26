import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function KpiCard({ label, value, hint, accent = 'teal' }) {
  const accentClass = {
    teal: 'from-teal-500/15 to-cyan-400/5 border-teal-200',
    amber: 'from-amber-400/15 to-orange-400/5 border-amber-200',
    rose: 'from-rose-400/15 to-red-400/5 border-rose-200',
    slate: 'from-slate-300/15 to-slate-200/5 border-slate-200',
  }[accent] || 'from-teal-500/15 to-cyan-400/5 border-teal-200'

  return (
    <Card className={cn('bg-gradient-to-br', accentClass)}>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="mt-3 font-display text-3xl font-bold">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}
