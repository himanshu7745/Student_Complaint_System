import { CATEGORY_OPTIONS } from '@/lib/constants'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function ManualCategoryPicker({ value = [], onChange, className }) {
  const toggle = (cat, checked) => {
    if (checked) onChange?.([...new Set([...value, cat])])
    else onChange?.(value.filter((item) => item !== cat))
  }

  return (
    <div className={cn('rounded-xl border border-amber-200 bg-amber-50/50 p-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-amber-900">Manual Category Review</h4>
          <p className="mt-1 text-xs text-amber-800/80">AI confidence is low. Confirm one or more categories before submission.</p>
        </div>
        <Badge variant="warning">Human Override</Badge>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {CATEGORY_OPTIONS.map((cat) => (
          <label key={cat} className="flex items-center gap-2 rounded-lg border border-amber-100 bg-white px-3 py-2 text-sm text-slate-700">
            <Checkbox checked={value.includes(cat)} onCheckedChange={(checked) => toggle(cat, checked)} />
            {cat}
          </label>
        ))}
      </div>
    </div>
  )
}
