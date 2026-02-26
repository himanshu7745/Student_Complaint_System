import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function ErrorState({ title = 'Something went wrong', description = 'Please try again.', onRetry }) {
  return (
    <Card className="border-rose-200 bg-rose-50/50">
      <CardContent className="p-6">
        <h3 className="font-display text-lg font-semibold text-rose-900">{title}</h3>
        <p className="mt-1 text-sm text-rose-800/80">{description}</p>
        {onRetry ? <Button className="mt-4" variant="destructive" onClick={onRetry}>Retry</Button> : null}
      </CardContent>
    </Card>
  )
}
