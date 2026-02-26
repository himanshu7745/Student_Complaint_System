import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { cn } from '@/lib/utils'

export function Calendar({ className, ...props }) {
  return (
    <div className={cn('rounded-xl border bg-white p-3', className)}>
      <DayPicker {...props} />
    </div>
  )
}
