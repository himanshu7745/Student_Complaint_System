import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ADMIN_NAV, STUDENT_NAV } from '@/utils/complaint'

const TITLES = {
  '/student/dashboard': 'Student Dashboard',
  '/student/complaints/new': 'Raise Complaint',
  '/student/complaints': 'My Complaints',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/complaints': 'Complaint Queue',
  '/admin/departments': 'Department Management',
}

export function Topbar({ role }) {
  const location = useLocation()
  const { logout, user } = useAuth()
  const navItems = role === 'ADMIN' ? ADMIN_NAV : STUDENT_NAV

  const title = useMemo(() => {
    const matched = Object.entries(TITLES).find(([path]) => location.pathname === path || location.pathname.startsWith(`${path}/`))
    return matched?.[1] || (role === 'ADMIN' ? 'Admin' : 'Student')
  }, [location.pathname, role])

  return (
    <header className="sticky top-0 z-20 border-b bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to} className="w-full">{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div>
            <p className="font-display text-xl font-bold tracking-tight">{title}</p>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={role === 'ADMIN' ? '/admin/complaints?status=PENDING_ADMIN_ASSIGNMENT' : '/student/complaints'}>
            <Button variant="secondary" className="hidden sm:inline-flex">Quick View</Button>
          </Link>
          <Button type="button" variant="outline" size="icon" className="sm:hidden" onClick={logout} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" className="hidden sm:inline-flex" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <span className="hidden sm:inline">{user?.role}</span>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-xs text-white">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <button type="button" className="w-full" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
