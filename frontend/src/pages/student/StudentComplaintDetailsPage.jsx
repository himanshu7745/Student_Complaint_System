import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { studentComplaintsApi } from '@/api/complaints'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { Timeline } from '@/components/common/Timeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorState } from '@/components/common/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatDateTime } from '@/utils/format'
import { extractAiSuggestedDepartmentName } from '@/utils/ai'

export default function StudentComplaintDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const complaintQuery = useQuery({ queryKey: ['student-complaint', id], queryFn: () => studentComplaintsApi.get(id), enabled: Boolean(id) })

  const resolveMutation = useMutation({
    mutationFn: () => studentComplaintsApi.markResolved(id, { message: 'Marked resolved by student from dashboard' }),
    onSuccess: () => {
      toast.success('Complaint marked resolved and closed')
      queryClient.invalidateQueries({ queryKey: ['student-complaint', id] })
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-kpis'] })
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Unable to mark resolved'),
  })

  const escalateMutation = useMutation({
    mutationFn: () => studentComplaintsApi.escalate(id, { reason: 'Escalated by student from complaint details page' }),
    onSuccess: () => {
      toast.success('Complaint escalated to Director')
      queryClient.invalidateQueries({ queryKey: ['student-complaint', id] })
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-kpis'] })
    },
    onError: (error) => toast.error(error?.response?.data?.message || 'Unable to escalate complaint'),
  })

  if (complaintQuery.isLoading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
  }

  if (complaintQuery.isError) {
    return <ErrorState description="Failed to load complaint details" onRetry={complaintQuery.refetch} />
  }

  const complaint = complaintQuery.data
  const canResolve = ['ACK_RECEIVED', 'ACTION_TAKEN'].includes(complaint.status)
  const canEscalate = complaint.overdue || ['ACK_RECEIVED', 'ACTION_TAKEN'].includes(complaint.status)
  const aiSuggestedDepartmentLabel =
    complaint.aiSuggestedDepartment?.name ||
    extractAiSuggestedDepartmentName(complaint.aiRawResponseJson) ||
    'No suggestion returned'

  return (
    <div className="space-y-6">
      <PageHeader
        title={complaint.title}
        description={`${complaint.referenceId} • Created ${formatDateTime(complaint.createdAt)}`}
        action={<Button variant="outline" onClick={() => navigate('/student/complaints')}>Back</Button>}
      />

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5">
          <div><p className="text-xs text-muted-foreground">Status</p><div className="mt-1"><StatusBadge status={complaint.status} /></div></div>
          <div><p className="text-xs text-muted-foreground">Severity</p><div className="mt-1"><SeverityBadge severity={complaint.aiSeverity} /></div></div>
          <div><p className="text-xs text-muted-foreground">Assigned Department</p><p className="mt-1 font-semibold">{complaint.assignedDepartment?.name || 'Pending admin assignment'}</p></div>
          <div><p className="text-xs text-muted-foreground">Email Sent</p><p className="mt-1 font-semibold">{formatDateTime(complaint.emailSentAt)}</p></div>
          <div><p className="text-xs text-muted-foreground">SLA Due</p><p className={`mt-1 font-semibold ${complaint.overdue ? 'text-rose-700' : ''}`}>{formatDateTime(complaint.slaDueAt)}</p></div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Tabs defaultValue="details" className="space-y-0">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="images">Images ({complaint.images?.length || 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <Card>
              <CardHeader><CardTitle>Complaint Description</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Area</p>
                  <p className="font-medium">{complaint.area}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Complaint Date</p>
                  <p className="font-medium">{formatDate(complaint.complaintDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="whitespace-pre-wrap text-sm leading-6">{complaint.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card className="border-sky-200 bg-sky-50/50"><CardContent className="p-4 text-sm"><p className="font-semibold">AI Suggested Department</p><p className="mt-1 text-muted-foreground">{aiSuggestedDepartmentLabel}</p></CardContent></Card>
                  <Card className="border-amber-200 bg-amber-50/50"><CardContent className="p-4 text-sm"><p className="font-semibold">Acknowledgement</p><p className="mt-1 text-muted-foreground">{formatDateTime(complaint.ackReceivedAt)}</p></CardContent></Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="images">
            <Card>
              <CardHeader><CardTitle>Evidence Images</CardTitle></CardHeader>
              <CardContent>
                {(complaint.images || []).length ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {complaint.images.map((image) => (
                      <a key={image.id} href={image.imageUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border bg-white">
                        <img src={image.imageUrl} alt="Complaint evidence" className="h-40 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No images were attached to this complaint.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Student Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => resolveMutation.mutate()} disabled={!canResolve || resolveMutation.isPending}>
                {resolveMutation.isPending ? 'Submitting...' : 'Mark Resolved'}
              </Button>
              <Button variant="destructive" className="w-full" onClick={() => escalateMutation.mutate()} disabled={!canEscalate || escalateMutation.isPending}>
                {escalateMutation.isPending ? 'Submitting...' : 'Escalate to Director'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Escalation appears when complaint is overdue (no acknowledgement within 7 days) or after acknowledgement/action if you are not satisfied.
              </p>
            </CardContent>
          </Card>

          <Timeline events={complaint.timeline} />
        </div>
      </div>
    </div>
  )
}
