import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { Skeleton } from '@/components/ui/skeleton'
import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import StudentDashboardPage from '@/pages/student/StudentDashboardPage'
import RaiseComplaintPage from '@/pages/student/RaiseComplaintPage'
import MyComplaintsPage from '@/pages/student/MyComplaintsPage'
import StudentComplaintDetailsPage from '@/pages/student/StudentComplaintDetailsPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminComplaintsPage from '@/pages/admin/AdminComplaintsPage'
import AdminComplaintDetailsPage from '@/pages/admin/AdminComplaintDetailsPage'
import DepartmentsPage from '@/pages/admin/DepartmentsPage'
import NotFoundPage from '@/pages/NotFoundPage'

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md space-y-3">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

function ProtectedRoute({ roles, children }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth()
  const location = useLocation()

  if (isBootstrapping) return <FullScreenLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'} replace />
  }

  return children
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth()
  if (isBootstrapping) return <FullScreenLoader />
  if (isAuthenticated) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'} replace />
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />

      <Route
        path="/student/*"
        element={
          <ProtectedRoute roles={['STUDENT']}>
            <AppShell role="STUDENT" />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="complaints/new" element={<RaiseComplaintPage />} />
        <Route path="complaints" element={<MyComplaintsPage />} />
        <Route path="complaints/:id" element={<StudentComplaintDetailsPage />} />
      </Route>

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AppShell role="ADMIN" />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="complaints" element={<AdminComplaintsPage />} />
        <Route path="complaints/:id" element={<AdminComplaintDetailsPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
