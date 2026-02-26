import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/app-shell'
import UserDashboardPage from '@/pages/user/user-dashboard-page'
import UserNewTicketPage from '@/pages/user/user-new-ticket-page'
import UserTicketDetailPage from '@/pages/user/user-ticket-detail-page'
import AdminDashboardPage from '@/pages/admin/admin-dashboard-page'
import AdminInboxPage from '@/pages/admin/admin-inbox-page'
import AdminReviewPage from '@/pages/admin/admin-review-page'
import AdminTicketDetailPage from '@/pages/admin/admin-ticket-detail-page'
import NotFoundPage from '@/pages/not-found-page'
import LoginPage from '@/pages/login-page'
import { RequireAdminRole, RequireAuth, RequireUserRole } from '@/auth/route-guards'
import { useAuth } from '@/auth/auth-context'

function HomeRedirect() {
  const { bootLoading, isAuthenticated, role } = useAuth()
  if (bootLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={role === 'ROLE_USER' ? '/user/dashboard' : '/admin/dashboard'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/user/dashboard" element={<RequireUserRole><UserDashboardPage /></RequireUserRole>} />
        <Route path="/user/new" element={<RequireUserRole><UserNewTicketPage /></RequireUserRole>} />
        <Route path="/user/tickets/:id" element={<RequireUserRole><UserTicketDetailPage /></RequireUserRole>} />

        <Route path="/admin/dashboard" element={<RequireAdminRole><AdminDashboardPage /></RequireAdminRole>} />
        <Route path="/admin/inbox" element={<RequireAdminRole><AdminInboxPage /></RequireAdminRole>} />
        <Route path="/admin/review" element={<RequireAdminRole><AdminReviewPage /></RequireAdminRole>} />
        <Route path="/admin/tickets/:id" element={<RequireAdminRole><AdminTicketDetailPage /></RequireAdminRole>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
