import { Card, CardContent } from '@/components/ui/card'

export function EmptyState({ title = 'No data found', description = 'Try adjusting filters or create a new item.' }) {
  return (
    <Card>
      <CardContent className="flex min-h-44 flex-col items-center justify-center gap-2 p-8 text-center">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-muted">•</div>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
