import { cn } from '@/lib/utils'

export function Table({ className, ...props }) {
  return <div className={cn('w-full overflow-auto', className)}><table className="w-full text-sm" {...props} /></div>
}

export function TableHeader(props) {
  return <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-wide text-slate-500" {...props} />
}

export function TableBody(props) {
  return <tbody className="divide-y divide-slate-100" {...props} />
}

export function TableRow({ className, ...props }) {
  return <tr className={cn('transition hover:bg-slate-50', className)} {...props} />
}

export function TableHead({ className, ...props }) {
  return <th className={cn('px-4 py-3 font-medium', className)} {...props} />
}

export function TableCell({ className, ...props }) {
  return <td className={cn('px-4 py-3 align-top text-slate-700', className)} {...props} />
}
