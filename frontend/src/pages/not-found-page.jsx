import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'

export default function NotFoundPage() {
  return (
    <div className="space-y-4">
      <EmptyState
        icon={AlertCircle}
        title="Page not found"
        description="The route you opened does not exist in this frontend demo. Use the sidebar to navigate to User or Admin pages."
      />
      <div className="text-center text-sm text-slate-500">
        Go to <Link className="font-medium text-blue-600 hover:underline" to="/user/dashboard">User Dashboard</Link> or{' '}
        <Link className="font-medium text-blue-600 hover:underline" to="/admin/dashboard">Admin Dashboard</Link>.
      </div>
    </div>
  )
}
