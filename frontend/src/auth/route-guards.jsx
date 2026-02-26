import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/auth-context'
import { Skeleton } from '@/components/ui/skeleton'

function FullPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md space-y-3 rounded-2xl border bg-white p-6 shadow-soft">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}

export function RequireAuth({ children }) {
  const { bootLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (bootLoading) return <FullPageLoading />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

export function RequireUserRole({ children }) {
  const { role } = useAuth()
  if (role !== 'ROLE_USER') {
    return <Navigate to="/admin/dashboard" replace />
  }
  return children
}

export function RequireAdminRole({ children }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) {
    return <Navigate to="/user/dashboard" replace />
  }
  return children
}
