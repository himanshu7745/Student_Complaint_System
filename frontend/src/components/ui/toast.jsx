import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: TriangleAlert,
  info: Info,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(({ title, description, variant = 'info', duration = 2800 }) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { id, title, description, variant }])
    window.setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((item) => {
          const Icon = ICONS[item.variant] || Info
          const variantClasses = {
            success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
            error: 'border-red-200 bg-red-50 text-red-900',
            warning: 'border-amber-200 bg-amber-50 text-amber-900',
            info: 'border-slate-200 bg-white text-slate-900',
          }
          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto fade-in flex items-start gap-3 rounded-xl border px-4 py-3 shadow-soft',
                variantClasses[item.variant],
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                {item.title ? <div className="text-sm font-semibold">{item.title}</div> : null}
                {item.description ? <div className="mt-0.5 text-xs opacity-80">{item.description}</div> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded-md p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
