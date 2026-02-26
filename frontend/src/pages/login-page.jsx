import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, LogIn, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const { isAuthenticated, user, login, bootLoading } = useAuth()
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const from = location.state?.from?.pathname
  const [form, setForm] = useState({ email: 'student@campus.local', password: 'Password@123' })
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = useMemo(() => {
    if (from) return from
    if (user?.role && user.role !== 'ROLE_USER') return '/admin/dashboard'
    return '/user/dashboard'
  }, [from, user?.role])

  if (!bootLoading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const session = await login(form.email, form.password)
      toast({ title: 'Logged in', description: `Welcome ${session.user.name}`, variant: 'success' })
      navigate(from || (session.user.role === 'ROLE_USER' ? '/user/dashboard' : '/admin/dashboard'), { replace: true })
    } catch (error) {
      toast({ title: 'Login failed', description: error.message || 'Please check your credentials.', variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/80 p-4">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden rounded-2xl border bg-white p-8 shadow-soft lg:block">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm"><ShieldCheck className="h-5 w-5 text-blue-600" /></div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Campus Complaint Routing</div>
                <div className="text-xs text-slate-500">Frontend ↔ Backend Integrated</div>
              </div>
            </div>
            <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-900">Sign in to continue</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Use the seeded backend accounts to test user, reviewer, resolver, and admin workflows end-to-end.</p>
            <div className="mt-6 space-y-2 text-sm text-slate-600">
              <div><span className="font-medium">Student:</span> `student@campus.local`</div>
              <div><span className="font-medium">Reviewer:</span> `reviewer@campus.local`</div>
              <div><span className="font-medium">Password:</span> `Password@123`</div>
            </div>
          </div>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>JWT login against the Spring Boot backend.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                </div>
                <Button className="w-full" type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  {submitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
