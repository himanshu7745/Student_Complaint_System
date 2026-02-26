import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutList, ListChecks, Search, SquareDashedKanban, TimerReset } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/common/page-header'
import { KpiCard } from '@/components/common/kpi-card'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { TicketTable } from '@/components/common/ticket-table'
import { TicketCard } from '@/components/common/ticket-card'
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from '@/lib/constants'

function getFromDate(days) {
  if (!days || days === 'All') return undefined
  const n = Number(days)
  if (!Number.isFinite(n)) return undefined
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export default function UserDashboardPage() {
  const { userMetrics, userTicketsPage, loadUserTickets, loading, bootLoading } = useAppStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [category, setCategory] = useState('All')
  const [dateRange, setDateRange] = useState('30')
  const [page, setPage] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadUserTickets({
        q: search.trim() || undefined,
        status: status === 'All' ? undefined : status,
        category: category === 'All' ? undefined : category,
        from: getFromDate(dateRange),
        page,
        size: 10,
      }).catch((error) => {
        toast({
          title: 'Failed to load tickets',
          description: error?.message || 'Please retry.',
          variant: 'error',
        })
      })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [category, dateRange, loadUserTickets, page, search, status, toast])

  useEffect(() => {
    setPage(0)
  }, [search, status, category, dateRange])

  const filtered = useMemo(
    () => [...(userTicketsPage.items || [])].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [userTicketsPage.items],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Dashboard"
        description="Track complaint progress, respond quickly to requests for more information, and raise new issues in seconds."
        actions={<Button onClick={() => navigate('/user/new')}>Raise Complaint</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Open" value={userMetrics.open} icon={SquareDashedKanban} subtext="New + acknowledged + reopened" />
        <KpiCard label="In Progress" value={userMetrics.inProgress} icon={TimerReset} subtext="Active authority handling" />
        <KpiCard label="Resolved" value={userMetrics.resolved} icon={ListChecks} subtext="Resolved or closed tickets" />
        <KpiCard label="Needs Info" value={userMetrics.needsInfo} icon={LayoutList} subtext="Awaiting your response" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID or keyword" className="pl-9" />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item === 'All' ? 'All Statuses' : item}</option>)}
            </Select>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="All">All Categories</option>
              {CATEGORY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="All">All Dates</option>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setStatus('All'); setCategory('All'); setDateRange('30') }}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 lg:hidden">
        {filtered.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} onClick={() => navigate(`/user/tickets/${ticket.id}`)} compact />
        ))}
        {!loading.userTickets && !bootLoading && filtered.length === 0 ? <div className="text-sm text-slate-500">No matching tickets.</div> : null}
      </div>

      <div className="hidden lg:block">
        <TicketTable
          tickets={filtered}
          loading={loading.userTickets || bootLoading}
          onRowClick={(ticket) => navigate(`/user/tickets/${ticket.id}`)}
          mode="user"
        />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            Showing page <span className="font-medium text-slate-900">{userTicketsPage.page + 1}</span> of{' '}
            <span className="font-medium text-slate-900">{Math.max(1, userTicketsPage.totalPages)}</span>
            {' '}({userTicketsPage.totalElements} tickets)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={loading.userTickets || userTicketsPage.first}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={loading.userTickets || userTicketsPage.last}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
