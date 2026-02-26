import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { studentComplaintsApi } from '@/api/complaints'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/DataTable'
import { ComplaintCard } from '@/components/common/ComplaintCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatDateTime } from '@/utils/format'
import { STATUS_OPTIONS, SEVERITY_OPTIONS } from '@/utils/complaint'

export default function MyComplaintsPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const queryParams = useMemo(() => ({
    page: Number(params.get('page') || 0),
    size: Number(params.get('size') || 10),
    status: params.get('status') || undefined,
    severity: params.get('severity') || undefined,
    search: params.get('search') || undefined,
  }), [params])

  const complaintsQuery = useQuery({ queryKey: ['student-complaints', queryParams], queryFn: () => studentComplaintsApi.list(queryParams) })

  function patchParam(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.set('page', '0')
    setParams(next)
  }

  const columns = [
    { key: 'referenceId', header: 'Reference' },
    { key: 'title', header: 'Title' },
    { key: 'area', header: 'Area' },
    { key: 'complaintDate', header: 'Date', render: (row) => formatDate(row.complaintDate) },
    { key: 'severity', header: 'Severity', render: (row) => <SeverityBadge severity={row.aiSeverity} /> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'slaDueAt', header: 'SLA Due', render: (row) => formatDateTime(row.slaDueAt) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Complaints"
        description="Filter complaints by status, severity, and keywords."
        action={<Link to="/student/complaints/new"><Button>Raise New</Button></Link>}
      />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <Input
            placeholder="Search title, area..."
            value={params.get('search') || ''}
            onChange={(e) => patchParam('search', e.target.value)}
          />
          <Select value={params.get('status') || ''} onChange={(e) => patchParam('status', e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </Select>
          <Select value={params.get('severity') || ''} onChange={(e) => patchParam('severity', e.target.value)}>
            <option value="">All Severities</option>
            {SEVERITY_OPTIONS.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" className="w-full" onClick={() => setParams(new URLSearchParams())}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {complaintsQuery.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : complaintsQuery.isError ? (
        <ErrorState description="Failed to load complaints" onRetry={complaintsQuery.refetch} />
      ) : !complaintsQuery.data?.items?.length ? (
        <EmptyState title="No complaints match your filters" description="Try changing filters or create a new complaint." />
      ) : (
        <>
          <div className="hidden lg:block">
            <Card>
              <CardContent className="p-0">
                <DataTable
                  columns={columns}
                  rows={complaintsQuery.data.items}
                  onRowClick={(row) => navigate(`/student/complaints/${row.id}`)}
                />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-3 lg:hidden">
            {complaintsQuery.data.items.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} basePath="/student/complaints" />
            ))}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Page {complaintsQuery.data.page + 1} of {Math.max(complaintsQuery.data.totalPages, 1)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={complaintsQuery.data.first} onClick={() => patchParam('page', String(Math.max(0, queryParams.page - 1)))}>Prev</Button>
              <Button variant="outline" size="sm" disabled={complaintsQuery.data.last} onClick={() => patchParam('page', String(queryParams.page + 1))}>Next</Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
