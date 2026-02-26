import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { adminComplaintsApi } from '@/api/complaints'
import { departmentsApi } from '@/api/departments'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { Timeline } from '@/components/common/Timeline'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { formatDate, formatDateTime } from '@/utils/format'
import { extractAiSuggestedDepartmentName } from '@/utils/ai'

export default function AdminComplaintDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [assignDept, setAssignDept] = useState('')
  const [assignNote, setAssignNote] = useState('')
  const [overrideSeverity, setOverrideSeverity] = useState('MEDIUM')
  const [overrideAiDeptId, setOverrideAiDeptId] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [actionTaken, setActionTaken] = useState('')

  const complaintQuery = useQuery({ queryKey: ['admin-complaint', id], queryFn: () => adminComplaintsApi.get(id), enabled: Boolean(id) })
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: departmentsApi.list })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-complaint', id] })
    queryClient.invalidateQueries({ queryKey: ['admin-complaints'] })
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard-kpis'] })
    queryClient.invalidateQueries({ queryKey: ['admin-overdue-list'] })
  }

  const assignMutation = useMutation({
    mutationFn: (payload) => adminComplaintsApi.assignDepartment(id, payload),
    onSuccess: () => { toast.success('Department assigned'); invalidateAll() },
    onError: (e) => toast.error(e?.response?.data?.message || 'Assignment failed'),
  })
  const resendMutation = useMutation({
    mutationFn: () => adminComplaintsApi.resendEmail(id),
    onSuccess: () => { toast.success('Email resent'); invalidateAll() },
    onError: (e) => toast.error(e?.response?.data?.message || 'Resend failed'),
  })
  const manualAckMutation = useMutation({
    mutationFn: () => adminComplaintsApi.acknowledgeManual(id, { message: 'Acknowledgement manually recorded by admin' }),
    onSuccess: () => { toast.success('Acknowledgement recorded'); invalidateAll() },
    onError: (e) => toast.error(e?.response?.data?.message || 'Manual acknowledgement failed'),
  })
  const actionTakenMutation = useMutation({
    mutationFn: (payload) => adminComplaintsApi.markActionTaken(id, payload),
    onSuccess: () => { toast.success('Action taken status updated'); setActionTaken(''); invalidateAll() },
    onError: (e) => toast.error(e?.response?.data?.message || 'Action update failed'),
  })
  const noteMutation = useMutation({
    mutationFn: (payload) => adminComplaintsApi.addInternalNote(id, payload),
    onSuccess: () => { toast.success('Note added'); setInternalNote(''); invalidateAll() },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to add note'),
  })
  const overrideMutation = useMutation({
    mutationFn: (payload) => adminComplaintsApi.overrideAi(id, payload),
    onSuccess: () => { toast.success('AI classification overridden'); invalidateAll() },
    onError: (e) => toast.error(e?.response?.data?.message || 'Override failed'),
  })

  if (complaintQuery.isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
  if (complaintQuery.isError) return <ErrorState description="Failed to load complaint details" onRetry={complaintQuery.refetch} />

  const complaint = complaintQuery.data
  const departments = departmentsQuery.data || []
  const aiSuggestedDepartmentLabel =
    complaint.aiSuggestedDepartment?.name ||
    extractAiSuggestedDepartmentName(complaint.aiRawResponseJson) ||
    'None'

  return (
    <div className="space-y-6">
      <PageHeader
        title={complaint.title}
        description={`${complaint.referenceId} • Student: ${complaint.student?.name} (${complaint.student?.email})`}
        action={<Button variant="outline" onClick={() => navigate('/admin/complaints')}>Back to Queue</Button>}
      />

      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6">
          <div><p className="text-xs text-muted-foreground">Status</p><div className="mt-1"><StatusBadge status={complaint.status} /></div></div>
          <div><p className="text-xs text-muted-foreground">Severity</p><div className="mt-1"><SeverityBadge severity={complaint.aiSeverity} /></div></div>
          <div><p className="text-xs text-muted-foreground">AI Suggestion</p><p className="mt-1 font-semibold">{aiSuggestedDepartmentLabel}</p></div>
          <div><p className="text-xs text-muted-foreground">Assigned Department</p><p className="mt-1 font-semibold">{complaint.assignedDepartment?.name || 'Unassigned'}</p></div>
          <div><p className="text-xs text-muted-foreground">Email Sent</p><p className="mt-1 font-semibold">{formatDateTime(complaint.emailSentAt)}</p></div>
          <div><p className="text-xs text-muted-foreground">SLA Due</p><p className={`mt-1 font-semibold ${complaint.overdue ? 'text-rose-700' : ''}`}>{formatDateTime(complaint.slaDueAt)}</p></div>
        </CardContent>
      </Card>

      <div className="grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="debug">AI Debug</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Complaint Details</CardTitle>
                <CardDescription>Use admin actions to assign department, override AI output, or add notes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><p className="text-xs text-muted-foreground">Area</p><p className="font-medium">{complaint.area}</p></div>
                  <div><p className="text-xs text-muted-foreground">Complaint Date</p><p className="font-medium">{formatDate(complaint.complaintDate)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Created</p><p className="font-medium">{formatDateTime(complaint.createdAt)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Acknowledgement</p><p className="font-medium">{formatDateTime(complaint.ackReceivedAt)}</p></div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="whitespace-pre-wrap text-sm leading-6">{complaint.description}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="images">
            <Card>
              <CardHeader><CardTitle>Complaint Images</CardTitle></CardHeader>
              <CardContent>
                {(complaint.images || []).length ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {complaint.images.map((image) => (
                      <a key={image.id} href={image.imageUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border bg-white">
                        <img src={image.imageUrl} alt="Complaint" className="h-44 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No images attached.</p>}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="debug">
            <Card>
              <CardHeader><CardTitle>AI Raw Response (Debug)</CardTitle></CardHeader>
              <CardContent>
                <pre className="max-h-[380px] overflow-auto rounded-xl border bg-slate-950 p-4 text-xs text-slate-100">
                  {complaint.aiRawResponseJson || 'No raw AI response stored.'}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Assignment & Email</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Assign Department</Label>
                <Select value={assignDept} onChange={(e) => setAssignDept(e.target.value)}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </div>
              <div>
                <Label>Assignment Note</Label>
                <Input value={assignNote} onChange={(e) => setAssignNote(e.target.value)} placeholder="Optional note" />
              </div>
              <Button className="w-full" onClick={() => assignMutation.mutate({ departmentId: assignDept, note: assignNote || null })} disabled={!assignDept || assignMutation.isPending}>
                {assignMutation.isPending ? 'Assigning...' : 'Assign Department'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => resendMutation.mutate()} disabled={resendMutation.isPending}>
                {resendMutation.isPending ? 'Resending...' : 'Resend Department Email'}
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => manualAckMutation.mutate()} disabled={manualAckMutation.isPending}>
                {manualAckMutation.isPending ? 'Saving...' : 'Mark Acknowledgement (Manual)'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Override AI Classification</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Severity</Label>
                <Select value={overrideSeverity} onChange={(e) => setOverrideSeverity(e.target.value)}>
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <div>
                <Label>AI Suggested Department (optional)</Label>
                <Select value={overrideAiDeptId} onChange={(e) => setOverrideAiDeptId(e.target.value)}>
                  <option value="">No AI department suggestion</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </div>
              <Button variant="outline" className="w-full" onClick={() => overrideMutation.mutate({ aiSeverity: overrideSeverity, aiDepartmentId: overrideAiDeptId || null, resendEmailIfAssigned: false })} disabled={overrideMutation.isPending}>
                {overrideMutation.isPending ? 'Updating...' : 'Override AI'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Workflow Notes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Action Taken</Label>
                <Textarea value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} rows={3} placeholder="Department repaired wiring, issue resolved..." />
                <Button className="mt-2 w-full" onClick={() => actionTakenMutation.mutate({ message: actionTaken })} disabled={!actionTaken.trim() || actionTakenMutation.isPending}>
                  {actionTakenMutation.isPending ? 'Saving...' : 'Mark Action Taken'}
                </Button>
              </div>
              <div>
                <Label>Internal Note</Label>
                <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={3} placeholder="Admin note (timeline comment)" />
                <Button variant="outline" className="mt-2 w-full" onClick={() => noteMutation.mutate({ message: internalNote })} disabled={!internalNote.trim() || noteMutation.isPending}>
                  {noteMutation.isPending ? 'Saving...' : 'Add Internal Note'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Timeline events={complaint.timeline} />
        </div>
      </div>
    </div>
  )
}
