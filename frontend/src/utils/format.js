import { format, formatDistanceToNowStrict, parseISO } from 'date-fns'

export function formatDate(value) {
  if (!value) return '—'
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, 'dd MMM yyyy')
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, 'dd MMM yyyy, hh:mm a')
}

export function relativeTime(value) {
  if (!value) return '—'
  const date = typeof value === 'string' ? parseISO(value) : value
  return formatDistanceToNowStrict(date, { addSuffix: true })
}
