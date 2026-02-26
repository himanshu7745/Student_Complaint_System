import { Input } from './input'

export function DatePicker({ value, onChange, ...props }) {
  return <Input type="date" value={value || ''} onChange={(e) => onChange?.(e.target.value)} {...props} />
}
