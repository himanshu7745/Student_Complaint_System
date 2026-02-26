import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">404</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Page not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">The page you requested does not exist.</p>
          <Link to="/login" className="mt-4 inline-block">
            <Button>Go to Login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
