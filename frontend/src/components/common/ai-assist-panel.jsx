import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip } from '@/components/ui/tooltip'
import { AlertTriangle, Brain, Check, Edit3, ShieldCheck } from 'lucide-react'
import { CategoryChips, PriorityChip } from '@/components/common/chips'

export function AIAssistPanel({ prediction, onAccept, onEdit, showManualWarning = false }) {
  if (!prediction) {
    return (
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="h-4 w-4" />AI Assist</CardTitle>
          <CardDescription>Start typing the complaint to see classification suggestions.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="sticky top-24 overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-b from-slate-50 to-white">
        <CardTitle className="flex items-center gap-2 text-base"><Brain className="h-4 w-4 text-blue-600" />AI Assist</CardTitle>
        <CardDescription>Transparent AI suggestions with confidence and routing preview.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        {showManualWarning || prediction.confidence?.belowThreshold ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
              <div>
                <div className="text-sm font-semibold text-amber-900">Low confidence classification</div>
                <p className="mt-1 text-xs text-amber-800/80">Please verify categories manually or send this ticket to the manual review queue.</p>
              </div>
            </div>
          </div>
        ) : null}

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Predicted Categories</div>
          <CategoryChips categories={prediction.categories} />
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Priority Suggestion</div>
          <div className="flex items-start gap-2">
            <PriorityChip priority={prediction.priority.level} />
            <p className="text-xs text-slate-600">{prediction.priority.why}</p>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Assigned To</div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
            <div className="font-medium text-slate-800">{prediction.assignees.owner?.name || 'TBD'}</div>
            <div className="text-xs text-slate-500">{prediction.assignees.owner?.role || 'Primary owner'}</div>
            {prediction.assignees.collaborators?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {prediction.assignees.collaborators.map((person) => (
                  <Badge key={person.id} variant="default">{person.name}</Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
            <span>Confidence</span>
            <span>{prediction.confidence.overall}%</span>
          </div>
          <Progress
            value={prediction.confidence.overall}
            className="h-2.5"
            indicatorClassName={prediction.confidence.belowThreshold ? 'bg-amber-500' : 'bg-emerald-500'}
          />
          <div className="mt-3 space-y-2">
            {prediction.confidence.labels.map((label) => (
              <div key={label.label} className="rounded-lg border border-slate-200 bg-white p-2">
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                  <span>{label.label}</span>
                  <span>{label.score}%</span>
                </div>
                <Progress value={label.score} className="h-1.5" indicatorClassName="bg-blue-500" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Tooltip content="Confirms AI suggestions without editing labels.">
            <Button type="button" variant="default" className="w-full" onClick={onAccept}>
              <Check className="h-4 w-4" />
              Looks Correct
            </Button>
          </Tooltip>
          <Tooltip content="Opens manual category editing mode.">
            <Button type="button" variant="outline" className="w-full" onClick={onEdit}>
              <Edit3 className="h-4 w-4" />
              Edit Categories
            </Button>
          </Tooltip>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600">
          <div className="mb-1 flex items-center gap-2 font-medium text-slate-700"><ShieldCheck className="h-3.5 w-3.5" />Why this is trustworthy</div>
          The system shows label-level confidence and routing rationale, and you can override categories before submission.
        </div>
      </CardContent>
    </Card>
  )
}
