import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthLayout({ title, description, footer, children }) {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-cyan-950 to-teal-950 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(45,212,191,0.25),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(251,146,60,0.25),transparent_35%)]" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Campus Ops</p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight">Student Complaint Management System</h1>
            <p className="mt-4 max-w-lg text-sm text-cyan-50/80">
              Raise complaints with image evidence, AI severity classification, department assignment workflow, email acknowledgement, and SLA-driven escalation.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-cyan-100/70">Roles</p>
                <p className="mt-1 font-semibold">Student / Admin</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-cyan-100/70">SLA</p>
                <p className="mt-1 font-semibold">7-day email-based tracking</p>
              </div>
            </div>
          </div>
        </div>
        <Card className="self-center">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {children}
            <div className="border-t pt-4 text-sm text-muted-foreground">{footer}</div>
            <div className="text-xs text-muted-foreground">
              API docs after backend start: <Link className="text-primary underline" to="#">/swagger-ui.html</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
