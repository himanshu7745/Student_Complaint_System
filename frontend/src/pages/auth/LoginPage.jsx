import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import AuthLayout from './AuthLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

const schema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(values) {
    try {
      const response = await login(values)
      toast.success('Logged in successfully')
      const destination = response.user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'
      navigate(location.state?.from?.pathname || destination, { replace: true })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Login failed')
    }
  }

  return (
    <AuthLayout
      title="Login"
      description="Sign in to continue"
      footer={<span>New user? <Link to="/signup" className="font-semibold text-primary underline">Create account</Link></span>}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="student@college.edu" {...register('email')} />
          {errors.email ? <p className="mt-1 text-xs text-rose-700">{errors.email.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
          {errors.password ? <p className="mt-1 text-xs text-rose-700">{errors.password.message}</p> : null}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Login'}</Button>
      </form>
    </AuthLayout>
  )
}
