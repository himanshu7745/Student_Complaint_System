import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function EmptyState({ title = 'Nothing here yet', description, actionLabel, onAction, icon: Icon = Inbox }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-14 text-center">
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <Icon className="h-6 w-6 text-slate-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p> : null}
        {actionLabel ? (
          <Button className="mt-5" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
