import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Plus, ShieldAlert, Sparkles } from 'lucide-react'
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS, STATUS_OPTIONS, USERS } from '@/lib/constants'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TicketTable } from '@/components/common/ticket-table'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CategoryChips, PriorityChip, StatusChip } from '@/components/common/chips'
import { Progress } from '@/components/ui/progress'
import { formatDateTime } from '@/lib/format'
import { TimelineFeed } from '@/components/common/timeline-feed'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/empty-state'

function elevatePriority(priority) {
  const order = ['Low', 'Medium', 'High', 'Critical']
  const idx = order.indexOf(priority)
  return order[Math.min(order.length - 1, Math.max(0, idx + 1))]
}

export default function AdminInboxPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    adminInboxTickets,
    adminInboxPage,
    loading,
    loadAdminInbox,
    loadTicketDetail,
    getTicketById,
    assignTicket,
    changeStatus,
    escalateTicket,
  } = useAppStore()

  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    priority: 'All',
    location: '',
    assignedTo: 'All',
    confidence: 'All',
    needsReview: false,
    categories: [],
  })
  const [selectedIds, setSelectedIds] = useState([])
  const [drawerTicketId, setDrawerTicketId] = useState(null)
  const [page, setPage] = useState(0)
  const [bulkOwner, setBulkOwner] = useState(String(USERS.authorities[2].id))
  const [bulkStatus, setBulkStatus] = useState('Acknowledged')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAdminInbox({
        search: filters.search,
        status: filters.status === 'All' ? undefined : filters.status,
        priority: filters.priority === 'All' ? undefined : filters.priority,
        location: filters.location || undefined,
        assignedTo: filters.assignedTo === 'All' ? undefined : filters.assignedTo,
        confidence: filters.confidence === 'All' ? undefined : filters.confidence,
        needsReview: filters.needsReview || undefined,
        categories: filters.categories.length ? filters.categories : undefined,
        page,
        size: 10,
      }).catch((error) => {
        toast({
          title: 'Failed to load inbox',
          description: error?.message || 'Please retry.',
          variant: 'error',
        })
      })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [filters, loadAdminInbox, page, toast])

  useEffect(() => {
    setPage(0)
    setSelectedIds([])
  }, [filters.search, filters.status, filters.priority, filters.location, filters.assignedTo, filters.confidence, filters.needsReview, filters.categories])

  const filtered = useMemo(
    () => [...(adminInboxTickets || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [adminInboxTickets],
  )

  const drawerTicket = useMemo(() => (drawerTicketId ? getTicketById(drawerTicketId) : null), [getTicketById, drawerTicketId])

  const toggleSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const applyBulkAssign = async () => {
    const owner = USERS.authorities.find((u) => String(u.id) === String(bulkOwner))
    if (!owner || !selectedIds.length) return
    const results = await Promise.allSettled(selectedIds.map((id) => assignTicket(id, owner, [])))
    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failCount = results.length - successCount
    toast({
      title: failCount ? 'Bulk assign partially applied' : 'Bulk assign applied',
      description: `${successCount} ticket(s) assigned to ${owner.name}${failCount ? `, ${failCount} failed` : ''}.`,
      variant: failCount ? 'warning' : 'success',
    })
    setSelectedIds([])
  }

  const applyBulkStatus = async () => {
    if (!selectedIds.length) return
    const results = await Promise.allSettled(selectedIds.map((id) => changeStatus(id, bulkStatus, 'Bulk Action')))
    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failCount = results.length - successCount
    toast({
      title: failCount ? 'Status update partially applied' : 'Status updated',
      description: `${successCount} ticket(s) moved to ${bulkStatus}${failCount ? `, ${failCount} failed` : ''}.`,
      variant: failCount ? 'warning' : 'success',
    })
    setSelectedIds([])
  }

  const applyBulkEscalate = async () => {
    if (!selectedIds.length) return
    const results = await Promise.allSettled(
      selectedIds.map((id) => escalateTicket(id, { reason: 'Escalated from inbox bulk action' })),
    )
    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failCount = results.length - successCount
    toast({
      title: failCount ? 'Escalation partially applied' : 'Tickets escalated',
      description: `${successCount} ticket(s) escalated${failCount ? `, ${failCount} failed` : ''}.`,
      variant: 'warning',
    })
    setSelectedIds([])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticket Inbox"
        description="Filter, triage, and bulk-process complaint queues with AI confidence visibility and SLA context."
        actions={<Button onClick={() => navigate('/admin/review')}>Open Manual Review Queue</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Filter className="h-4 w-4" />Filters</CardTitle>
              <CardDescription>Refine queue by status, routing, AI confidence, and review risk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Search ID or keyword" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
              <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
              </Select>
              <Select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
              </Select>
              <Input placeholder="Location (hostel/building/room)" value={filters.location} onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))} />
              <Select value={filters.assignedTo} onChange={(e) => setFilters((f) => ({ ...f, assignedTo: e.target.value }))}>
                <option value="All">All Assignees</option>
                <option value="Unassigned">Unassigned</option>
                {USERS.authorities.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
              </Select>
              <Select value={filters.confidence} onChange={(e) => setFilters((f) => ({ ...f, confidence: e.target.value }))}>
                <option value="All">All Confidence</option>
                <option value="High">High (≥85%)</option>
                <option value="Low">Low (&lt;72%)</option>
              </Select>
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <Checkbox checked={filters.needsReview} onCheckedChange={(checked) => setFilters((f) => ({ ...f, needsReview: Boolean(checked) }))} />
                Needs Review only
              </label>
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Categories (multi-select)</div>
                <div className="grid gap-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 text-sm text-slate-700">
                      <Checkbox
                        checked={filters.categories.includes(cat)}
                        onCheckedChange={(checked) =>
                          setFilters((f) => ({
                            ...f,
                            categories: checked ? [...f.categories, cat] : f.categories.filter((c) => c !== cat),
                          }))
                        }
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  setFilters({ search: '', status: 'All', priority: 'All', location: '', assignedTo: 'All', confidence: 'All', needsReview: false, categories: [] })
                }
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">{adminInboxPage.totalElements}</span> tickets in queue • <span className="font-medium text-slate-900">{selectedIds.length}</span> selected
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto_auto] sm:items-center">
                <Select value={bulkOwner} onChange={(e) => setBulkOwner(e.target.value)}>
                  {USERS.authorities.map((u) => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
                </Select>
                <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                  {STATUS_OPTIONS.filter((s) => s !== 'All').map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Button variant="outline" disabled={!selectedIds.length} onClick={applyBulkAssign}>Assign</Button>
                <Button variant="outline" disabled={!selectedIds.length} onClick={applyBulkStatus}>Change Status</Button>
                <Button variant="outline" disabled={!selectedIds.length} onClick={applyBulkEscalate}>Escalate</Button>
              </div>
            </CardContent>
          </Card>

          <TicketTable
            tickets={filtered}
            loading={loading.adminInbox}
            mode="admin"
            selectable
            selectedIds={selectedIds}
            onToggleSelect={toggleSelected}
            onRowClick={async (ticket) => {
              setDrawerTicketId(ticket.id)
              try {
                await loadTicketDetail(ticket.id, { admin: true })
              } catch (error) {
                toast({ title: 'Failed to load ticket detail', description: error?.message || 'Please retry.', variant: 'error' })
              }
            }}
          />

          <Card>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                Page <span className="font-medium text-slate-900">{adminInboxPage.page + 1}</span> of{' '}
                <span className="font-medium text-slate-900">{Math.max(1, adminInboxPage.totalPages)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" disabled={loading.adminInbox || adminInboxPage.first} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  Previous
                </Button>
                <Button variant="outline" disabled={loading.adminInbox || adminInboxPage.last} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={Boolean(drawerTicket)} onOpenChange={(open) => !open && setDrawerTicketId(null)} side="right">
        {drawerTicket ? (
          <>
            <SheetHeader>
              <div>
                <SheetTitle>{drawerTicket.id}</SheetTitle>
                <SheetDescription>{drawerTicket.title}</SheetDescription>
              </div>
              <SheetClose onClick={() => setDrawerTicketId(null)} />
            </SheetHeader>
            <SheetContent className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip status={drawerTicket.status} />
                  <PriorityChip priority={drawerTicket.priority} />
                  <Badge variant={drawerTicket.needsManualReview ? 'warning' : 'success'}>{drawerTicket.needsManualReview ? 'Needs Review' : 'AI Routed'}</Badge>
                </div>
                <CategoryChips categories={drawerTicket.categories} className="mt-3" />
                <div className="mt-3 text-sm text-slate-600">Owner: <span className="font-medium text-slate-900">{drawerTicket.assignees?.owner?.name || 'Unassigned'}</span></div>
                <div className="mt-1 text-xs text-slate-500">Created {formatDateTime(drawerTicket.createdAt)}</div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">AI Confidence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500"><span>Overall</span><span>{drawerTicket.confidence?.overall || 0}%</span></div>
                    <Progress value={drawerTicket.confidence?.overall || 0} indicatorClassName={drawerTicket.confidence?.belowThreshold ? 'bg-amber-500' : 'bg-emerald-500'} />
                  </div>
                  {(drawerTicket.confidence?.labels || []).map((label) => (
                    <div key={label.label}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500"><span>{label.label}</span><span>{label.score}%</span></div>
                      <Progress value={label.score} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await changeStatus(drawerTicket.id, 'Acknowledged', 'Inbox Reviewer')
                        await loadTicketDetail(drawerTicket.id, { admin: true })
                        toast({ title: 'Ticket acknowledged', description: `${drawerTicket.id} moved to Acknowledged.`, variant: 'success' })
                      } catch (error) {
                        toast({ title: 'Status update failed', description: error?.message || 'Please retry.', variant: 'error' })
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />Acknowledge
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await assignTicket(drawerTicket.id, USERS.authorities[2], [USERS.authorities[1]], 'Inbox Reviewer')
                        await loadTicketDetail(drawerTicket.id, { admin: true })
                        toast({ title: 'Assigned', description: `${drawerTicket.id} assigned to ${USERS.authorities[2].name}.`, variant: 'success' })
                      } catch (error) {
                        toast({ title: 'Assignment failed', description: error?.message || 'Please retry.', variant: 'error' })
                      }
                    }}
                  >
                    <Sparkles className="h-4 w-4" />Assign Facilities Team
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await escalateTicket(drawerTicket.id, { reason: 'Escalated from inbox quick action' })
                        await loadTicketDetail(drawerTicket.id, { admin: true })
                        toast({ title: 'Escalated', description: `${drawerTicket.id} escalation recorded.`, variant: 'warning' })
                      } catch (error) {
                        toast({ title: 'Escalation failed', description: error?.message || 'Please retry.', variant: 'error' })
                      }
                    }}
                  >
                    <ShieldAlert className="h-4 w-4" />Escalate Priority
                  </Button>
                  <Button onClick={() => navigate(`/admin/tickets/${drawerTicket.id}`)}>Open Full Detail</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  {drawerTicket.timeline?.length ? (
                    <TimelineFeed items={drawerTicket.timeline.slice(-3)} />
                  ) : (
                    <EmptyState title="No activity" description="Timeline entries will appear as actions are performed." />
                  )}
                </CardContent>
              </Card>
            </SheetContent>
          </>
        ) : null}
      </Sheet>
    </div>
  )
}
