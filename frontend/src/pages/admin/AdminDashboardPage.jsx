import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminComplaintsApi } from '@/api/complaints'
import { PageHeader } from '@/components/common/PageHeader'
import { KpiCard } from '@/components/common/KpiCard'
import { ComplaintCard } from '@/components/common/ComplaintCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminDashboardPage() {
  const kpisQuery = useQuery({ queryKey: ['admin-dashboard-kpis'], queryFn: adminComplaintsApi.dashboardKpis })
  const overdueQuery = useQuery({ queryKey: ['admin-overdue-list'], queryFn: adminComplaintsApi.overdueList })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Monitor intake, assignment backlog, overdue SLA cases, and closure rate."
        action={<Link to="/admin/complaints"><Button>Open Complaint Queue</Button></Link>}
      />

      {kpisQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : kpisQuery.isError ? (
        <ErrorState description="Failed to load admin KPIs" onRetry={kpisQuery.refetch} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Total" value={kpisQuery.data.total} accent="slate" />
          <KpiCard label="New" value={kpisQuery.data.newCount} accent="amber" />
          <KpiCard label="Pending Assign" value={kpisQuery.data.pendingAssignment} accent="amber" />
          <KpiCard label="Overdue" value={kpisQuery.data.overdue} accent="rose" />
          <KpiCard label="Closed" value={kpisQuery.data.closed} accent="teal" />
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Overdue Complaints</h2>
          <Link to="/admin/complaints?status=EMAIL_SENT"><Button variant="outline">Filter Queue</Button></Link>
        </div>

        {overdueQuery.isLoading ? (
          <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
        ) : overdueQuery.isError ? (
          <ErrorState description="Failed to load overdue complaints" onRetry={overdueQuery.refetch} />
        ) : overdueQuery.data?.length ? (
          <div className="space-y-3">
            {overdueQuery.data.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} basePath="/admin/complaints" />
            ))}
          </div>
        ) : (
          <EmptyState title="No overdue complaints" description="All EMAIL_SENT complaints are currently within SLA or already acknowledged." />
        )}
      </section>
    </div>
  )
}
