import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell({ role }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <Sidebar role={role} />
      <div className="min-w-0">
        <Topbar role={role} />
        <main className="mx-auto w-full max-w-7xl p-4 pb-10 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
