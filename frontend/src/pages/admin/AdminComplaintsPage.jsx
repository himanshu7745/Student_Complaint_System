import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { adminComplaintsApi } from '@/api/complaints'
import { departmentsApi } from '@/api/departments'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/common/DataTable'
import { ComplaintCard } from '@/components/common/ComplaintCard'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/utils/format'
import { STATUS_OPTIONS, SEVERITY_OPTIONS } from '@/utils/complaint'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function AdminComplaintsPage() {
  const [params, setParams] = useSearchParams()
  const [assignmentTarget, setAssignmentTarget] = useState(null)
  const [assignmentDepartmentId, setAssignmentDepartmentId] = useState('')
  const [assignmentNote, setAssignmentNote] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const queryParams = useMemo(() => ({
    page: Number(params.get('page') || 0),
    size: Number(params.get('size') || 10),
    status: params.get('status') || undefined,
    severity: params.get('severity') || undefined,
    departmentId: params.get('departmentId') || undefined,
    search: params.get('search') || undefined,
  }), [params])

  const complaintsQuery = useQuery({ queryKey: ['admin-complaints', queryParams], queryFn: () => adminComplaintsApi.list(queryParams) })
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: departmentsApi.list })

  const assignMutation = useMutation({
    mutationFn: ({ id, payload }) => adminComplaintsApi.assignDepartment(id, payload),
    onSuccess: () => {
      toast.success('Department assigned and email workflow attempted')
      setAssignmentTarget(null)
      setAssignmentDepartmentId('')
      setAssignmentNote('')
      queryClient.invalidateQueries({ queryKey: ['admin-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-kpis'] })
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Failed to assign department'),
  })

  function patchParam(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.set('page', '0')
    setParams(next)
  }

  const columns = [
    { key: 'referenceId', header: 'Reference' },
    { key: 'student', header: 'Student', render: (row) => <div><p className="font-medium">{row.student?.name}</p><p className="text-xs text-muted-foreground">{row.student?.email}</p></div> },
    { key: 'title', header: 'Title' },
    { key: 'aiSeverity', header: 'Severity', render: (row) => <SeverityBadge severity={row.aiSeverity} /> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'assignedDepartment', header: 'Department', render: (row) => row.assignedDepartment?.name || 'Unassigned' },
    { key: 'slaDueAt', header: 'SLA Due', render: (row) => formatDateTime(row.slaDueAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/complaints/${row.id}`)}>Open</Button>
          <Button size="sm" onClick={() => { setAssignmentTarget(row); setAssignmentDepartmentId(row.assignedDepartment?.id || ''); }}>Assign</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Complaint Queue" description="Search, filter, triage, and assign complaints. Email SLA begins when department email is sent." />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
          <Input placeholder="Search title/student/area" value={params.get('search') || ''} onChange={(e) => patchParam('search', e.target.value)} />
          <Select value={params.get('status') || ''} onChange={(e) => patchParam('status', e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={params.get('severity') || ''} onChange={(e) => patchParam('severity', e.target.value)}>
            <option value="">All Severities</option>
            {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={params.get('departmentId') || ''} onChange={(e) => patchParam('departmentId', e.target.value)}>
            <option value="">All Departments</option>
            {(departmentsQuery.data || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>Reset Filters</Button>
        </CardContent>
      </Card>

      {complaintsQuery.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : complaintsQuery.isError ? (
        <ErrorState description="Failed to load admin complaint queue" onRetry={complaintsQuery.refetch} />
      ) : !complaintsQuery.data?.items?.length ? (
        <EmptyState title="No complaints found" description="Try removing filters or wait for new submissions." />
      ) : (
        <>
          <div className="hidden lg:block">
            <Card><CardContent className="p-0"><DataTable columns={columns} rows={complaintsQuery.data.items} /></CardContent></Card>
          </div>
          <div className="space-y-3 lg:hidden">
            {complaintsQuery.data.items.map((complaint) => <ComplaintCard key={complaint.id} complaint={complaint} basePath="/admin/complaints" />)}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Page {complaintsQuery.data.page + 1} of {Math.max(complaintsQuery.data.totalPages, 1)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={complaintsQuery.data.first} onClick={() => patchParam('page', String(Math.max(queryParams.page - 1, 0)))}>Prev</Button>
              <Button variant="outline" size="sm" disabled={complaintsQuery.data.last} onClick={() => patchParam('page', String(queryParams.page + 1))}>Next</Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={Boolean(assignmentTarget)} onOpenChange={(open) => !open && setAssignmentTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Department</DialogTitle>
            <DialogDescription>Assign complaint {assignmentTarget?.referenceId} and trigger department email + 7-day SLA.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Department</Label>
              <Select value={assignmentDepartmentId} onChange={(e) => setAssignmentDepartmentId(e.target.value)}>
                <option value="">Select department</option>
                {(departmentsQuery.data || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Input value={assignmentNote} onChange={(e) => setAssignmentNote(e.target.value)} placeholder="Assignment note" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentTarget(null)}>Cancel</Button>
            <Button
              onClick={() => assignMutation.mutate({ id: assignmentTarget.id, payload: { departmentId: assignmentDepartmentId, note: assignmentNote || null } })}
              disabled={!assignmentDepartmentId || assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign & Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
