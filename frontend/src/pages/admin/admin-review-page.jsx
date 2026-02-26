import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Flag, ShieldAlert, Sparkles } from 'lucide-react'
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS, USERS } from '@/lib/constants'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ManualCategoryPicker } from '@/components/common/manual-category-picker'
import { CategoryChips, PriorityChip, StatusChip } from '@/components/common/chips'
import { EmptyState } from '@/components/common/empty-state'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDateTime } from '@/lib/format'

function highlightText(text, keywords = []) {
  if (!text) return text
  if (!keywords.length) return text
  const escaped = keywords.filter(Boolean).sort((a, b) => b.length - a.length).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!escaped.length) return text
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
  return text.split(regex).map((part, idx) => {
    const matched = keywords.some((k) => k.toLowerCase() === part.toLowerCase())
    return matched ? <mark key={idx} className="rounded bg-amber-100 px-0.5 text-amber-900">{part}</mark> : <span key={idx}>{part}</span>
  })
}

export default function AdminReviewPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { manualReviewQueue, manualReviewPage, loading, loadReviewQueue, getTicketById, approveReview, updateReviewItem } = useAppStore()
  const [edits, setEdits] = useState({})
  const [page, setPage] = useState(0)

  useEffect(() => {
    loadReviewQueue({ page, size: 10 }).catch((error) => {
      toast({
        title: 'Failed to load review queue',
        description: error?.message || 'Please retry.',
        variant: 'error',
      })
    })
  }, [loadReviewQueue, page, toast])

  const queue = useMemo(
    () => manualReviewQueue.map((item) => ({ ...item, ticket: item.draftTicket || getTicketById(item.ticketId) })).filter((item) => item.ticket),
    [manualReviewQueue, getTicketById],
  )

  const getEdit = (item) => {
    const ticket = item.ticket
      return edits[item.id] || {
        categories: ticket.categories,
        priority: ticket.priority,
        ownerId: String(ticket.assignees?.owner?.id || USERS.authorities[2].id),
        collaboratorIds: (ticket.assignees?.collaborators || []).map((c) => c.id),
        internalNotes: item.internalNotes || '',
        editMode: false,
    }
  }

  const setEdit = (reviewId, patch) => {
    setEdits((prev) => {
      const item = queue.find((q) => q.id === reviewId)
      const base =
        prev[reviewId] ||
        (item
          ? {
              categories: item.ticket.categories,
              priority: item.ticket.priority,
              ownerId: String(item.ticket.assignees?.owner?.id || USERS.authorities[2].id),
              collaboratorIds: (item.ticket.assignees?.collaborators || []).map((c) => c.id),
              internalNotes: item.internalNotes || '',
              editMode: false,
            }
          : {})
      return { ...prev, [reviewId]: { ...base, ...patch } }
    })
  }

  const handleApprove = async (item, useEdited = false) => {
    const ticket = item.ticket
    const edit = getEdit(item)
    const owner = USERS.authorities.find((u) => String(u.id) === String(useEdited ? edit.ownerId : ticket.assignees?.owner?.id)) || USERS.authorities[2]
    const collaborators = USERS.authorities.filter((u) => (useEdited ? edit.collaboratorIds : (ticket.assignees?.collaborators || []).map((c) => c.id)).includes(u.id))
    try {
      const result = await approveReview(item.id, {
        categories: useEdited ? edit.categories : ticket.categories,
        priority: useEdited ? edit.priority : ticket.priority,
        owner,
        collaborators,
        internalNotes: edit.internalNotes,
      })
      if (result?.ticketId) {
        toast({ title: 'Review approved', description: `${result.ticketId} routed and acknowledged.`, variant: 'success' })
        navigate(`/admin/tickets/${result.ticketId}`)
      }
    } catch (error) {
      toast({ title: 'Review approval failed', description: error?.message || 'Please retry.', variant: 'error' })
    }
  }

  const handleSpam = async (item) => {
    try {
      await approveReview(item.id, {
        categories: item.ticket.categories,
        priority: item.ticket.priority,
        owner: item.ticket.assignees?.owner || USERS.authorities[2],
        collaborators: item.ticket.assignees?.collaborators || [],
        internalNotes: getEdit(item).internalNotes,
        markSpam: true,
      })
      toast({ title: 'Marked as spam', description: `${item.ticket.id} removed from manual review queue.`, variant: 'warning' })
    } catch (error) {
      toast({ title: 'Mark spam unavailable', description: error?.message || 'Backend does not support this action yet.', variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manual Review Queue"
        description="Human-in-the-loop verification for low-confidence or ambiguous AI classifications before routing."
        actions={<Badge variant="warning">{queue.length} Pending Review</Badge>}
      />

      {loading.reviewQueue ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-48 animate-pulse rounded-2xl border bg-slate-100" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <EmptyState title="Manual review queue is empty" description="Low-confidence tickets will appear here when AI needs human confirmation." />
      ) : (
        <div className="space-y-5">
          {queue.map((item) => {
            const ticket = item.ticket
            const edit = getEdit(item)
            const currentOwner = USERS.authorities.find((u) => String(u.id) === String(edit.ownerId)) || USERS.authorities[2]
            const auditPreview = [
              `Status: ${ticket.status} -> Acknowledged`,
              edit.categories.join(', ') !== ticket.categories.join(', ') ? `Categories: ${ticket.categories.join(', ')} -> ${edit.categories.join(', ')}` : null,
              edit.priority !== ticket.priority ? `Priority: ${ticket.priority} -> ${edit.priority}` : null,
              (currentOwner?.name || '') !== (ticket.assignees?.owner?.name || '') ? `Owner: ${ticket.assignees?.owner?.name || 'Unassigned'} -> ${currentOwner?.name}` : null,
            ].filter(Boolean)

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="border-b bg-gradient-to-b from-slate-50 to-white">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                        {ticket.id} • {ticket.title}
                      </CardTitle>
                      <CardDescription className="mt-1">Submitted {formatDateTime(ticket.createdAt)} • {ticket.location?.building || 'Unknown location'} / {ticket.location?.room || '-'}</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip status={ticket.status} />
                      <PriorityChip priority={ticket.priority} />
                      <Badge variant="warning">{item.id}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-5 p-5 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Description (keywords highlighted)</div>
                      <p className="text-sm leading-6 text-slate-700">{highlightText(ticket.description, item.highlightedKeywords)}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">AI Suggestions</div>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 text-xs text-slate-500">Predicted labels</div>
                          <CategoryChips categories={ticket.categories} />
                        </div>
                        <div className="flex items-center gap-2">
                          <PriorityChip priority={ticket.priority} />
                          <span className="text-xs text-slate-500">Suggested routing: {ticket.assignees?.owner?.name || 'Unassigned'}</span>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-500"><span>Overall confidence</span><span>{ticket.confidence?.overall || 0}%</span></div>
                          <Progress value={ticket.confidence?.overall || 0} indicatorClassName="bg-amber-500" />
                          <div className="mt-3 space-y-2">
                            {(ticket.confidence?.labels || []).map((label) => (
                              <div key={label.label}>
                                <div className="mb-1 flex items-center justify-between text-xs text-slate-500"><span>{label.label}</span><span>{label.score}%</span></div>
                                <Progress value={label.score} className="h-1.5" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {edit.editMode ? (
                      <div className="space-y-4">
                        <ManualCategoryPicker value={edit.categories} onChange={(categories) => setEdit(item.id, { categories })} />
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-slate-700">Adjust Priority</div>
                            <Select value={edit.priority} onChange={(e) => setEdit(item.id, { priority: e.target.value })}>
                              {PRIORITY_OPTIONS.filter((p) => p !== 'All').map((p) => <option key={p} value={p}>{p}</option>)}
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-slate-700">Route / Assign</div>
                            <Select value={edit.ownerId} onChange={(e) => setEdit(item.id, { ownerId: e.target.value })}>
                              {USERS.authorities.map((u) => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
                            </Select>
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 text-sm font-medium text-slate-700">Collaborators</div>
                          <div className="grid gap-2 md:grid-cols-2">
                            {USERS.authorities.map((u) => (
                              <label key={u.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                <Checkbox
                                  checked={edit.collaboratorIds.includes(u.id)}
                                  onCheckedChange={(checked) =>
                                    setEdit(item.id, {
                                      collaboratorIds: checked
                                        ? [...new Set([...edit.collaboratorIds, u.id])]
                                        : edit.collaboratorIds.filter((id) => id !== u.id),
                                    })
                                  }
                                />
                                {u.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Actions</CardTitle>
                        <CardDescription>Approve AI directly or override labels/priority/routing before assigning.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-2">
                        <Button onClick={() => void handleApprove(item, false)}>
                          <CheckCircle2 className="h-4 w-4" />Approve AI
                        </Button>
                        <Button variant="outline" onClick={() => setEdit(item.id, { editMode: !edit.editMode })}>
                          <Sparkles className="h-4 w-4" />{edit.editMode ? 'Hide Editing' : 'Edit Labels'}
                        </Button>
                        <Button variant="outline" onClick={() => setEdit(item.id, { editMode: true })}>
                          <Flag className="h-4 w-4" />Adjust Priority / Route
                        </Button>
                        <Button variant="secondary" disabled={!edit.editMode} onClick={() => void handleApprove(item, true)}>
                          Route / Assign (Edited)
                        </Button>
                        <Button variant="destructive" onClick={() => void handleSpam(item)}>
                          <AlertTriangle className="h-4 w-4" />Mark Spam
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Internal Notes</CardTitle>
                        <CardDescription>Captured in audit trail preview before route approval.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Textarea
                          value={edit.internalNotes}
                          onChange={(e) => {
                            setEdit(item.id, { internalNotes: e.target.value })
                            updateReviewItem(item.id, { internalNotes: e.target.value })
                          }}
                          placeholder="Add triage notes, ambiguity notes, or reviewer rationale..."
                          className="min-h-[110px]"
                        />
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                          Notes will be appended as an internal timeline/comment entry when the review is approved.
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Audit Preview</CardTitle>
                        <CardDescription>What will be recorded when you approve routing.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {auditPreview.map((line, idx) => (
                            <div key={idx} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{line}</div>
                          ))}
                          {edit.internalNotes ? <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">Internal note added by reviewer</div> : null}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            Page <span className="font-medium text-slate-900">{manualReviewPage.page + 1}</span> of{' '}
            <span className="font-medium text-slate-900">{Math.max(1, manualReviewPage.totalPages)}</span>
            {' '}({manualReviewPage.totalElements} tickets)
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={loading.reviewQueue || manualReviewPage.first} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" disabled={loading.reviewQueue || manualReviewPage.last} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
