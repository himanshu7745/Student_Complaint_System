import { useEffect } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Clock3,
  Info,
  ShieldAlert,
  Ticket,
  UserMinus,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/components/ui/toast'
import { PageHeader } from '@/components/common/page-header'
import { KpiCard } from '@/components/common/kpi-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TicketCard } from '@/components/common/ticket-card'
import { EmptyState } from '@/components/common/empty-state'
import { formatRelative } from '@/lib/format'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b', '#06b6d4', '#84cc16']

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { adminMetrics, categoryDistribution, trendData, criticalAlerts, loadAnalytics, loading, bootLoading } = useAppStore()

  const hasCategoryAnalytics =
    (categoryDistribution || []).filter((item) => Number(item?.value || 0) > 0).length >= 1
  const hasTrendAnalytics =
    (trendData || []).filter((point) => Number(point?.tickets || 0) > 0 || Number(point?.resolved || 0) > 0).length >= 2
  const showAnalyticsSkeletons = loading.analytics || bootLoading
  const showCategoryCard = showAnalyticsSkeletons || hasCategoryAnalytics
  const showTrendCard = showAnalyticsSkeletons || hasTrendAnalytics
  const showAnyAnalyticsCard = showCategoryCard || showTrendCard

  useEffect(() => {
    loadAnalytics().catch((error) => {
      toast({
        title: 'Failed to load analytics',
        description: error?.message || 'Please retry.',
        variant: 'error',
      })
    })
  }, [loadAnalytics, toast])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Overview Dashboard"
        description="Monitor queue health, SLA risk, and trust signals across AI-classified campus complaints."
        actions={<Button onClick={() => navigate('/admin/inbox')}>Open Ticket Inbox</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Open" value={adminMetrics.open} icon={Ticket} subtext="Actionable tickets" />
        <KpiCard label="Unassigned" value={adminMetrics.unassigned} icon={UserMinus} subtext="Needs owner" />
        <KpiCard label="SLA Breaches" value={adminMetrics.breaches} icon={AlertTriangle} subtext="Immediate review" />
        <KpiCard label="Avg Resolution Time" value={`${adminMetrics.avgResolutionTimeHours}h`} icon={Clock3} subtext="Resolved + closed tickets" />
        <KpiCard label="Manual Review Queue" value={adminMetrics.manualReviewCount} icon={ShieldAlert} subtext="Human-in-the-loop" />
      </div>

      {showAnyAnalyticsCard ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {showCategoryCard ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Complaints by Category</CardTitle>
                <CardDescription>Distribution of classified complaints across major campus service categories.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {showAnalyticsSkeletons ? (
                  <div className="h-full animate-pulse rounded-xl bg-slate-100" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryDistribution} dataKey="value" nameKey="name" cx="45%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={2}>
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          ) : null}

          {showTrendCard ? (
            <Card>
              <CardHeader>
                <CardTitle>Tickets Trend Over Time</CardTitle>
                <CardDescription>Incoming vs resolved tickets for the past week.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {showAnalyticsSkeletons ? (
                  <div className="h-full animate-pulse rounded-xl bg-slate-100" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="tickets" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="resolved" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <Info className="h-4 w-4 text-slate-400" />
          Analytics charts are hidden until more ticket activity is available.
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Critical Alerts</CardTitle>
            <CardDescription>High-risk complaints that need immediate follow-up or escalation.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/inbox')}>Review Queue</Button>
        </CardHeader>
        <CardContent>
          {criticalAlerts.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {criticalAlerts.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                  footer={<div className="text-xs text-slate-500">Last updated {formatRelative(ticket.updatedAt)}</div>}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No critical alerts" description="No active critical-priority tickets right now." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
