import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { studentComplaintsApi } from '@/api/complaints'
import { PageHeader } from '@/components/common/PageHeader'
import { KpiCard } from '@/components/common/KpiCard'
import { ComplaintCard } from '@/components/common/ComplaintCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function StudentDashboardPage() {
  const kpisQuery = useQuery({ queryKey: ['student-dashboard-kpis'], queryFn: studentComplaintsApi.dashboardKpis })
  const recentQuery = useQuery({
    queryKey: ['student-complaints', 'recent'],
    queryFn: () => studentComplaintsApi.list({ page: 0, size: 5 }),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Dashboard"
        description="Track complaint progress, SLA status, and raise new issues with image evidence."
        action={<Link to="/student/complaints/new"><Button>Raise Complaint</Button></Link>}
      />

      {kpisQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : kpisQuery.isError ? (
        <ErrorState description="Failed to load dashboard KPIs." onRetry={kpisQuery.refetch} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Total" value={kpisQuery.data.total} accent="slate" />
          <KpiCard label="Pending" value={kpisQuery.data.pending} accent="amber" />
          <KpiCard label="Assigned" value={kpisQuery.data.assigned} accent="teal" />
          <KpiCard label="Resolved" value={kpisQuery.data.resolved} accent="teal" />
          <KpiCard label="Overdue" value={kpisQuery.data.overdue} accent="rose" />
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent Complaints</h2>
          <Link to="/student/complaints"><Button variant="outline">View All</Button></Link>
        </div>
        {recentQuery.isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
        ) : recentQuery.isError ? (
          <ErrorState description="Failed to load recent complaints." onRetry={recentQuery.refetch} />
        ) : recentQuery.data?.items?.length ? (
          <div className="space-y-3">
            {recentQuery.data.items.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} basePath="/student/complaints" />
            ))}
          </div>
        ) : (
          <EmptyState title="No complaints yet" description="Create your first complaint to start tracking progress and SLA timelines." />
        )}
      </section>
    </div>
  )
}
