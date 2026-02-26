import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Paperclip, ShieldAlert } from 'lucide-react'
import { getApiBaseUrl } from '@/api/http'
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS, STATUS_FLOW, USERS } from '@/lib/constants'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/common/page-header'
import { CategoryChips, PriorityChip, StatusChip } from '@/components/common/chips'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TimelineFeed } from '@/components/common/timeline-feed'
import { MessageThread } from '@/components/common/message-thread'
import { AttachmentDropzone } from '@/components/common/attachment-dropzone'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/common/empty-state'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import { Checkbox } from '@/components/ui/checkbox'

function elevatePriority(priority) {
  const order = ['Low', 'Medium', 'High', 'Critical']
  const idx = order.indexOf(priority)
  return order[Math.min(order.length - 1, Math.max(0, idx + 1))]
}

export default function AdminTicketDetailPage() {
  const { id } = useParams()
  const { toast } = useToast()
  const {
    bootLoading,
    loading,
    getTicketById,
    loadTicketDetail,
    addMessage,
    addAttachment,
    changeStatus,
    assignTicket,
    updateCategoriesPriority,
    resolveTicket,
    escalateTicket,
  } = useAppStore()

  const ticket = getTicketById(id)
  const [statusValue, setStatusValue] = useState('New')
  const [ownerId, setOwnerId] = useState(String(USERS.authorities[2].id))
  const [collaboratorIds, setCollaboratorIds] = useState([])
  const [categoriesEdit, setCategoriesEdit] = useState([])
  const [priorityEdit, setPriorityEdit] = useState('Medium')
  const [resolveNote, setResolveNote] = useState('')
  const [resolveFiles, setResolveFiles] = useState([])
  const [uploadFiles, setUploadFiles] = useState([])

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
    loadTicketDetail(id, { admin: true }).catch((error) => {
      toast({
        title: 'Failed to load ticket',
        description: error?.message || 'Please retry.',
        variant: 'error',
      })
    })
  }, [id, loadTicketDetail, toast])

  useEffect(() => {
    if (!ticket) return
    setStatusValue(ticket.status)
    setOwnerId(String(ticket.assignees?.owner?.id || USERS.authorities[2].id))
    setCollaboratorIds((ticket.assignees?.collaborators || []).map((c) => c.id))
    setCategoriesEdit(ticket.categories)
    setPriorityEdit(ticket.priority)
  }, [ticket])

  const owner = USERS.authorities.find((u) => String(u.id) === String(ownerId)) || USERS.authorities[2]
  const collaborators = USERS.authorities.filter((u) => collaboratorIds.includes(u.id))

  const canResolve = Boolean(resolveNote.trim())

  const headerActions = useMemo(() => {
    if (!ticket) return null
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            ;(async () => {
              try {
                await escalateTicket(ticket.id, { reason: 'Escalated from ticket detail header action' })
                await loadTicketDetail(ticket.id, { admin: true })
                toast({ title: 'Priority escalated', description: `${ticket.id} escalation recorded.`, variant: 'warning' })
              } catch (error) {
                toast({ title: 'Escalation failed', description: error?.message || 'Please retry.', variant: 'error' })
              }
            })()
          }}
        >
          <ShieldAlert className="h-4 w-4" />Escalate
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            ;(async () => {
              try {
                await changeStatus(ticket.id, 'In Progress', 'Admin')
                toast({ title: 'Status updated', description: `${ticket.id} moved to In Progress.`, variant: 'success' })
              } catch (error) {
                toast({ title: 'Status update failed', description: error?.message || 'Please retry.', variant: 'error' })
              }
            })()
          }}
        >
          Mark In Progress
        </Button>
      </div>
    )
  }, [ticket, escalateTicket, loadTicketDetail, changeStatus, toast])

  if (bootLoading || (loading.ticketDetail && !ticket)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-[520px] w-full" />
      </div>
    )
  }

  if (!ticket) {
    return <EmptyState title="Ticket not found" description="The requested admin ticket is unavailable." />
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Admin Ticket Detail • ${ticket.id}`} description={ticket.title} actions={headerActions} />

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={ticket.status} />
                <PriorityChip priority={ticket.priority} />
                <CategoryChips categories={ticket.categories} />
              </div>
              <div className="text-sm text-slate-600">Owner: <span className="font-medium text-slate-900">{ticket.assignees?.owner?.name || 'Unassigned'}</span></div>
              {ticket.assignees?.collaborators?.length ? <div className="text-sm text-slate-600">Collaborators: {ticket.assignees.collaborators.map((c) => c.name).join(', ')}</div> : null}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="text-slate-500">Created</div>
              <div className="mt-1 font-medium text-slate-800">{formatDateTime(ticket.createdAt)}</div>
              <div className="mt-2 text-slate-500">Updated</div>
              <div className="mt-1 font-medium text-slate-800">{formatDateTime(ticket.updatedAt)}</div>
              <div className="mt-2 text-slate-500">Location</div>
              <div className="mt-1 font-medium text-slate-800">{[ticket.location?.hostel, ticket.location?.building, ticket.location?.room].filter(Boolean).join(' / ')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Tabs defaultValue="messages">
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
              <TabsTrigger value="resolution">Resolution</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              <TimelineFeed items={ticket.timeline} />
            </TabsContent>

            <TabsContent value="messages">
              <MessageThread
                messages={ticket.messages}
                allowInternal
                onSend={async (payload) => {
                  try {
                    await addMessage(ticket.id, {
                      text: payload.text,
                      internal: payload.internal,
                      senderType: 'admin',
                      senderName: payload.internal ? 'Admin (Internal)' : 'Admin',
                    })
                    toast({ title: payload.internal ? 'Internal note added' : 'Reply sent', description: `${ticket.id} updated.`, variant: 'success' })
                  } catch (error) {
                    toast({ title: 'Message send failed', description: error?.message || 'Please retry.', variant: 'error' })
                    throw error
                  }
                }}
                placeholder="Reply to student or add an internal note..."
              />
            </TabsContent>

            <TabsContent value="attachments">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                <Card>
                  <CardHeader>
                    <CardTitle>Ticket Attachments</CardTitle>
                    <CardDescription>Evidence and supporting files shared by users/admins.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {ticket.attachments?.length ? (
                      ticket.attachments.map((file) => (
                        <div key={file.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-800"><Paperclip className="h-4 w-4 text-slate-400" />{file.name}</div>
                            <div className="text-xs text-slate-500">{file.by} • {Math.max(1, Math.round(file.sizeKb || 1))} KB</div>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => openAttachment(file)} disabled={!file.url}>
                            View
                          </Button>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No attachments" description="Attach photos, reports, or proofs to document resolution work." />
                    )}
                  </CardContent>
                </Card>

                <Card>
                <CardHeader>
                  <CardTitle>Add Attachment</CardTitle>
                  <CardDescription>Upload evidence or proof files to the ticket.</CardDescription>
                </CardHeader>
                  <CardContent className="space-y-3">
                    <AttachmentDropzone files={uploadFiles} onFilesChange={setUploadFiles} compact />
                    <Button
                      className="w-full"
                      disabled={!uploadFiles.length}
                      onClick={async () => {
                        try {
                          await addAttachment(ticket.id, uploadFiles)
                          setUploadFiles([])
                          toast({ title: 'Attachment added', description: 'Files attached to ticket.', variant: 'success' })
                        } catch (error) {
                          toast({ title: 'Attachment upload failed', description: error?.message || 'Please retry.', variant: 'error' })
                        }
                      }}
                    >
                      Upload Attachment
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="resolution">
              {ticket.resolution ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Resolution Details</CardTitle>
                    <CardDescription>Resolution notes and attachments required for closure transparency.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm leading-6 text-slate-700">{ticket.resolution.note}</p>
                    <div className="text-xs text-slate-500">Resolved on {formatDateTime(ticket.resolution.resolvedAt || ticket.updatedAt)}</div>
                    {ticket.resolution.attachments?.length ? (
                      <div className="space-y-2">
                        {ticket.resolution.attachments.map((f) => (
                          <div key={f.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{f.name}</div>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : (
                <EmptyState title="Not resolved yet" description="Use the resolve flow in the right panel to submit a resolution note and attachments." />
              )}
            </TabsContent>

            <TabsContent value="audit">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Log</CardTitle>
                  <CardDescription>Who changed what and when.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(ticket.auditLog || []).length ? (
                    ticket.auditLog.map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-medium text-slate-900">{entry.actor}</span>
                          <span className="text-slate-400">updated</span>
                          <span className="font-medium text-slate-700">{entry.field}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-600">{entry.from} → {entry.to}</div>
                        <div className="mt-1 text-[11px] text-slate-400">{formatDateTime(entry.timestamp)}</div>
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No audit entries" description="Audit entries will be recorded as admins update this ticket." />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Routing & Status Actions</CardTitle>
              <CardDescription>Update assignee, status, and escalation controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">Status</div>
                <Select value={statusValue} onChange={(e) => setStatusValue(e.target.value)}>
                  {STATUS_FLOW.map((status) => <option key={status} value={status}>{status}</option>)}
                </Select>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      await changeStatus(ticket.id, statusValue, 'Admin')
                      toast({ title: 'Status saved', description: `${ticket.id} moved to ${statusValue}.`, variant: 'success' })
                    } catch (error) {
                      toast({ title: 'Status save failed', description: error?.message || 'Please retry.', variant: 'error' })
                    }
                  }}
                >
                  Save Status
                </Button>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">Owner</div>
                <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
                  {USERS.authorities.map((u) => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
                </Select>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Collaborators</div>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {USERS.authorities.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <Checkbox
                        checked={collaboratorIds.includes(u.id)}
                        onCheckedChange={(checked) =>
                          setCollaboratorIds((prev) =>
                            checked ? [...new Set([...prev, u.id])] : prev.filter((id) => id !== u.id),
                          )
                        }
                      />
                      {u.name}
                    </label>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      await assignTicket(ticket.id, owner, collaborators, 'Admin')
                      await loadTicketDetail(ticket.id, { admin: true })
                      toast({ title: 'Routing updated', description: `${ticket.id} assigned to ${owner.name}.`, variant: 'success' })
                    } catch (error) {
                      toast({ title: 'Routing update failed', description: error?.message || 'Please retry.', variant: 'error' })
                    }
                  }}
                >
                  Save Assignment
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Classification & Confidence</CardTitle>
              <CardDescription>Editable categories, priority, and AI confidence details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">Editable Category Chips</div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const selected = categoriesEdit.includes(cat)
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setCategoriesEdit((prev) =>
                            selected ? prev.filter((c) => c !== cat) : [...prev, cat],
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${selected ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">Priority</div>
                <Select value={priorityEdit} onChange={(e) => setPriorityEdit(e.target.value)}>
                  {PRIORITY_OPTIONS.filter((p) => p !== 'All').map((p) => <option key={p} value={p}>{p}</option>)}
                </Select>
              </div>
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs text-slate-500"><span>Overall AI confidence</span><span>{ticket.confidence?.overall || 0}%</span></div>
                <Progress value={ticket.confidence?.overall || 0} indicatorClassName={ticket.confidence?.belowThreshold ? 'bg-amber-500' : 'bg-emerald-500'} />
                {(ticket.confidence?.labels || []).map((label) => (
                  <div key={label.label}>
                    <div className="mb-1 mt-2 flex items-center justify-between text-xs text-slate-500"><span>{label.label}</span><span>{label.score}%</span></div>
                    <Progress value={label.score} className="h-1.5" />
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                disabled={!categoriesEdit.length}
                onClick={async () => {
                  try {
                    await updateCategoriesPriority(ticket.id, categoriesEdit, priorityEdit, 'Admin')
                    await loadTicketDetail(ticket.id, { admin: true })
                    toast({ title: 'Classification updated', description: 'Categories and priority changes saved.', variant: 'success' })
                  } catch (error) {
                    toast({ title: 'Classification update failed', description: error?.message || 'Please retry.', variant: 'error' })
                  }
                }}
              >
                <CheckCircle2 className="h-4 w-4" />Save Classification
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resolve Flow</CardTitle>
              <CardDescription>Resolution note is required before resolving. Attach proof optionally.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="Describe the fix, actions taken, and any follow-up guidance..."
                className="min-h-[120px]"
              />
              {!resolveNote.trim() ? <p className="text-xs text-red-600">Resolution note is required to resolve the ticket.</p> : null}
              <AttachmentDropzone files={resolveFiles} onFilesChange={setResolveFiles} compact />
              <Button
                className="w-full"
                disabled={!canResolve}
                onClick={async () => {
                  try {
                    await resolveTicket(ticket.id, resolveNote.trim(), resolveFiles)
                    setResolveNote('')
                    setResolveFiles([])
                    await loadTicketDetail(ticket.id, { admin: true })
                    toast({ title: 'Ticket resolved', description: `${ticket.id} marked as Resolved with resolution note.`, variant: 'success' })
                  } catch (error) {
                    toast({ title: 'Resolve failed', description: error?.message || 'Please retry.', variant: 'error' })
                  }
                }}
              >
                Resolve Ticket
              </Button>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-3.5 w-3.5" />Resolution notes improve trust and auditability for AI-routed complaints.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
