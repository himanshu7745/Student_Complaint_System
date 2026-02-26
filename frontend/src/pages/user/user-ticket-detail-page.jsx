import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Paperclip, RefreshCcw, Star, Upload } from 'lucide-react'
import { getApiBaseUrl } from '@/api/http'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/common/page-header'
import { CategoryChips, PriorityChip, StatusChip } from '@/components/common/chips'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimelineFeed } from '@/components/common/timeline-feed'
import { MessageThread } from '@/components/common/message-thread'
import { AttachmentDropzone } from '@/components/common/attachment-dropzone'
import { EmptyState } from '@/components/common/empty-state'
import { formatDateTime } from '@/lib/format'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

export default function UserTicketDetailPage() {
  const { id } = useParams()
  const {
    bootLoading,
    loading,
    getTicketById,
    loadTicketDetail,
    addMessage,
    addAttachment,
    reopenTicket,
    rateResolution,
  } = useAppStore()
  const { toast } = useToast()
  const ticket = getTicketById(id)
  const [uploadDraft, setUploadDraft] = useState([])
  const [ratingOpen, setRatingOpen] = useState(false)

  const openAttachment = (file) => {
    const rawUrl = file?.url
    if (!rawUrl) {
      toast({ title: 'Preview unavailable', description: 'No file URL is available for this attachment.', variant: 'warning' })
      return
    }
    const url = /^https?:\/\//i.test(rawUrl)
      ? rawUrl
      : `${getApiBaseUrl()}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    if (!id) return
    loadTicketDetail(id).catch((error) => {
      toast({
        title: 'Failed to load ticket',
        description: error?.message || 'Please try again.',
        variant: 'error',
      })
    })
  }, [id, loadTicketDetail, toast])

  const canReopen = ticket && ['Resolved', 'Closed'].includes(ticket.status)
  const needsInfo = ticket?.status === 'Needs Info'

  const actions = useMemo(() => {
    if (!ticket) return null
    return (
      <div className="flex flex-wrap gap-2">
        {needsInfo ? (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await addMessage(ticket.id, {
                  text: 'Shared the requested information. Please check attachments/messages.',
                  senderType: 'student',
                  senderName: ticket.anonymous ? 'Anonymous' : 'Current User',
                })
                toast({ title: 'Response sent', description: 'Authority has been notified with your update.', variant: 'success' })
              } catch (error) {
                toast({ title: 'Unable to send response', description: error?.message || 'Please retry.', variant: 'error' })
              }
            }}
          >
            Respond to Needs Info
          </Button>
        ) : null}
        {canReopen ? (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await reopenTicket(ticket.id)
                toast({ title: 'Ticket reopened', description: `${ticket.id} has been reopened for further action.`, variant: 'warning' })
              } catch (error) {
                toast({ title: 'Unable to reopen ticket', description: error?.message || 'Please retry.', variant: 'error' })
              }
            }}
          >
            <RefreshCcw className="h-4 w-4" />
            Reopen
          </Button>
        ) : null}
        {ticket.resolution ? (
          <Button variant="outline" onClick={() => setRatingOpen(true)}>
            <Star className="h-4 w-4" />
            Rate Resolution
          </Button>
        ) : null}
      </div>
    )
  }, [ticket, needsInfo, canReopen, addMessage, reopenTicket, toast])

  if (bootLoading || (loading.ticketDetail && !ticket)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!ticket) {
    return <EmptyState title="Ticket not found" description="The requested ticket may have been deleted or moved." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Ticket ${ticket.id}`}
        description={ticket.title}
        actions={actions}
      />

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={ticket.status} />
                <PriorityChip priority={ticket.priority} />
                <CategoryChips categories={ticket.categories} />
              </div>
              <div className="text-sm text-slate-600">Assigned to <span className="font-medium text-slate-800">{ticket.assignees?.owner?.name || 'Unassigned'}</span> {ticket.assignees?.owner?.role ? `(${ticket.assignees.owner.role})` : ''}</div>
              {ticket.assignees?.collaborators?.length ? (
                <div className="text-sm text-slate-600">Collaborators: <span className="text-slate-800">{ticket.assignees.collaborators.map((c) => c.name).join(', ')}</span></div>
              ) : null}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="text-slate-500">Created</div>
              <div className="mt-1 font-medium text-slate-800">{formatDateTime(ticket.createdAt)}</div>
              <div className="mt-2 text-slate-500">Last Updated</div>
              <div className="mt-1 font-medium text-slate-800">{formatDateTime(ticket.updatedAt)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="resolution">Resolution</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <TimelineFeed items={ticket.timeline} />
        </TabsContent>

        <TabsContent value="messages">
          <MessageThread
            messages={ticket.messages}
            onSend={async (payload) => {
              try {
                await addMessage(ticket.id, {
                  text: payload.text,
                  senderType: 'student',
                  senderName: ticket.anonymous ? 'Anonymous' : 'Current User',
                })
                toast({ title: 'Comment added', description: 'Your message has been posted to the ticket thread.', variant: 'success' })
              } catch (error) {
                toast({ title: 'Failed to add comment', description: error?.message || 'Please retry.', variant: 'error' })
                throw error
              }
            }}
            placeholder={needsInfo ? 'Provide the requested information...' : 'Add a comment or update...'}
          />
        </TabsContent>

        <TabsContent value="attachments">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card>
              <CardHeader>
                <CardTitle>Current Attachments</CardTitle>
                <CardDescription>Files shared with the ticket thread.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.attachments?.length ? ticket.attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-800"><Paperclip className="h-4 w-4 text-slate-400" />{file.name}</div>
                      <div className="text-xs text-slate-500">{file.by} • {Math.max(1, Math.round((file.sizeKb || 1)))} KB</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => openAttachment(file)} disabled={!file.url}>
                      View
                    </Button>
                  </div>
                )) : <EmptyState title="No attachments yet" description="Upload photos, PDFs, or videos to support your complaint." />}
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                  <CardTitle>Add Attachments</CardTitle>
                  <CardDescription>Upload additional files to support your ticket.</CardDescription>
                </CardHeader>
              <CardContent className="space-y-3">
                <AttachmentDropzone files={uploadDraft} onFilesChange={setUploadDraft} compact />
                <Button
                  className="w-full"
                  disabled={!uploadDraft.length}
                  onClick={async () => {
                    try {
                      await addAttachment(ticket.id, uploadDraft)
                      setUploadDraft([])
                      toast({ title: 'Attachment uploaded', description: 'Files were added to the ticket.', variant: 'success' })
                    } catch (error) {
                      toast({ title: 'Upload failed', description: error?.message || 'Please retry.', variant: 'error' })
                    }
                  }}
                >
                  <Upload className="h-4 w-4" />
                  Upload to Ticket
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resolution">
          {ticket.resolution ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Card>
                <CardHeader>
                  <CardTitle>Resolution Summary</CardTitle>
                  <CardDescription>Authority-provided fix details and proof attachments.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-700">{ticket.resolution.note}</p>
                  <div className="mt-4 text-xs text-slate-500">Resolved on {formatDateTime(ticket.resolution.resolvedAt || ticket.updatedAt)}</div>
                  {ticket.resolution.attachments?.length ? (
                    <div className="mt-4 space-y-2">
                      {ticket.resolution.attachments.map((file) => (
                        <div key={file.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{file.name}</div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Resolution Rating</CardTitle>
                  <CardDescription>Help improve routing and handling quality.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-slate-600">Current rating: <span className="font-semibold text-slate-900">{ticket.userRating ? `${ticket.userRating}/5` : 'Not rated'}</span></div>
                  <Button variant="outline" onClick={() => setRatingOpen(true)} className="w-full">
                    <Star className="h-4 w-4" />
                    {ticket.userRating ? 'Update Rating' : 'Rate Resolution'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <EmptyState title="No resolution yet" description="Resolution details will appear here after the authority marks the ticket as resolved." />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogHeader>
          <div>
            <DialogTitle>Rate Resolution</DialogTitle>
            <DialogDescription>Share your experience with the resolution quality and speed.</DialogDescription>
          </div>
          <DialogClose onClick={() => setRatingOpen(false)} />
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={async () => {
                    try {
                      await rateResolution(ticket.id, n)
                      setRatingOpen(false)
                      toast({ title: 'Rating saved', description: `You rated this resolution ${n}/5.`, variant: 'success' })
                    } catch (error) {
                      toast({ title: 'Unable to save rating', description: error?.message || 'Please retry.', variant: 'error' })
                    }
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${ticket.userRating === n ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-1"><Star className="h-4 w-4" />{n}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">Ratings are sent to the backend and reflected in ticket details.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
