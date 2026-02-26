import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Search,
  Shield,
  Sparkles,
  Users,
  X,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/auth/auth-context'

const navGroups = [
  {
    label: 'Student / User',
    icon: Users,
    items: [
      { to: '/user/dashboard', label: 'User Dashboard', icon: LayoutDashboard },
      { to: '/user/new', label: 'Raise Complaint', icon: Sparkles },
    ],
  },
  {
    label: 'Admin / Authority',
    icon: Shield,
    items: [
      { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
      { to: '/admin/inbox', label: 'Ticket Inbox', icon: ClipboardList },
      { to: '/admin/review', label: 'Manual Review', icon: Sparkles },
    ],
  },
]

function SidebarContent({ onNavigate, isAdmin, isUser }) {
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => (item.to.startsWith('/admin') ? isAdmin : isUser)),
    }))
    .filter((group) => group.items.length)
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <Sparkles className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">AI Complaint Routing</div>
          <div className="text-xs text-slate-500">Campus Service Desk</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {visibleGroups.map((group) => {
          const GroupIcon = group.icon
          return (
            <div key={group.label} className="mb-5">
              <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <GroupIcon className="h-3.5 w-3.5" />
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition',
                          isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        )
                      }
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-60" />
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <div className="border-t p-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-semibold text-slate-700">Trust & Transparency</div>
          <p className="mt-1 text-xs text-slate-500">Campus complaints are routed quickly with clear tracking and authority oversight.</p>
        </div>
      </div>
    </div>
  )
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isAdminView = location.pathname.startsWith('/admin')
  const { user, role, logout } = useAuth()
  const isAdmin = ['ROLE_REVIEWER', 'ROLE_RESOLVER', 'ROLE_DEPT_ADMIN', 'ROLE_SUPER_ADMIN'].includes(role)
  const isUser = role === 'ROLE_USER'

  const heading = useMemo(() => {
    const path = location.pathname
    if (path.startsWith('/user/dashboard')) return { title: 'User Dashboard', section: 'Student Portal' }
    if (path.startsWith('/user/new')) return { title: 'Raise Complaint', section: 'Student Portal' }
    if (path.startsWith('/user/tickets/')) return { title: 'Ticket Details', section: 'Student Portal' }
    if (path.startsWith('/admin/dashboard')) return { title: 'Admin Overview', section: 'Authority Console' }
    if (path.startsWith('/admin/inbox')) return { title: 'Ticket Inbox', section: 'Authority Console' }
    if (path.startsWith('/admin/review')) return { title: 'Manual Review Queue', section: 'Authority Console' }
    if (path.startsWith('/admin/tickets/')) return { title: 'Admin Ticket Detail', section: 'Authority Console' }
    return { title: 'Complaint Routing', section: 'Workspace' }
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-slate-50/40">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r bg-white lg:block">
          <SidebarContent isAdmin={isAdmin} isUser={isUser} />
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/30" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-72 border-r bg-white shadow-2xl">
              <div className="flex items-center justify-end p-3">
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} isAdmin={isAdmin} isUser={isUser} />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 md:px-6">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{heading.section}</div>
                <div className="truncate text-sm font-semibold text-slate-900">{heading.title}</div>
              </div>
              <div className="hidden w-full max-w-sm md:block">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input placeholder="Search tickets, IDs, keywords..." className="pl-9" />
                </div>
              </div>
              {isAdminView ? <Badge variant="default" className="hidden sm:inline-flex">AI Assist Live</Badge> : null}
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
              </Button>
              <div className="hidden md:flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-700">{user?.name || 'User'}</div>
                  <div className="text-[11px] text-slate-400">{role || 'ROLE_USER'}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(isAdmin ? '/admin/inbox' : '/user/new')}>
                  {isAdmin ? 'Open Inbox' : 'Raise Complaint'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    logout()
                    navigate('/login', { replace: true })
                  }}
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
