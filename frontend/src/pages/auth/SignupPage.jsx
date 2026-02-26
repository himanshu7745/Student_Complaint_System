import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import AuthLayout from './AuthLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['STUDENT', 'ADMIN']),
})

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'STUDENT' },
  })

  async function onSubmit(values) {
    try {
      const response = await signup(values)
      toast.success('Account created')
      navigate(response.user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard', { replace: true })
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Signup failed')
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      description="Register as Student or Admin"
      footer={<span>Already have an account? <Link to="/login" className="font-semibold text-primary underline">Login</Link></span>}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Your full name" {...register('name')} />
          {errors.name ? <p className="mt-1 text-xs text-rose-700">{errors.name.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@college.edu" {...register('email')} />
          {errors.email ? <p className="mt-1 text-xs text-rose-700">{errors.email.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select id="role" {...register('role')}>
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Admin</option>
          </Select>
          {errors.role ? <p className="mt-1 text-xs text-rose-700">{errors.role.message}</p> : null}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="At least 8 characters" {...register('password')} />
          {errors.password ? <p className="mt-1 text-xs text-rose-700">{errors.password.message}</p> : null}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Signup'}</Button>
      </form>
    </AuthLayout>
  )
}
