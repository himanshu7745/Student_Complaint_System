import { NavLink } from 'react-router-dom'
import { AlertTriangle, Building2, ClipboardList, Home, LogOut, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

const STUDENT_ITEMS = [
  { to: '/student/dashboard', label: 'Dashboard', icon: Home },
  { to: '/student/complaints/new', label: 'Raise Complaint', icon: PlusCircle },
  { to: '/student/complaints', label: 'My Complaints', icon: ClipboardList },
]

const ADMIN_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { to: '/admin/complaints', label: 'Complaints', icon: AlertTriangle },
  { to: '/admin/departments', label: 'Departments', icon: Building2 },
]

export function Sidebar({ role }) {
  const { user, logout } = useAuth()
  const items = role === 'ADMIN' ? ADMIN_ITEMS : STUDENT_ITEMS

  return (
    <aside className="sticky top-0 hidden h-screen border-r bg-white/70 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="p-5">
        <div className="rounded-2xl border bg-gradient-to-br from-teal-600 to-cyan-700 p-4 text-white shadow-soft">
          <p className="font-display text-lg font-bold">SCMS</p>
          <p className="text-xs uppercase tracking-[0.16em] text-white/80">Student Complaint Management</p>
        </div>
      </div>
      <div className="px-4 pb-4">
        <p className="px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{role}</p>
        <nav className="mt-2 space-y-1">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                  isActive ? 'bg-primary text-primary-foreground shadow-glow' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="rounded-xl bg-muted/60 p-3 text-sm">
          <p className="font-semibold text-foreground">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button type="button" variant="outline" className="mt-3 w-full justify-start" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
