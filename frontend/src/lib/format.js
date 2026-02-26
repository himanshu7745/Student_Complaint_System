import { format, formatDistanceToNow } from 'date-fns'

export function formatDateTime(value) {
  try {
    return format(new Date(value), 'dd MMM yyyy, p')
  } catch {
    return value
  }
}

export function formatDate(value) {
  try {
    return format(new Date(value), 'dd MMM yyyy')
  } catch {
    return value
  }
}

export function formatRelative(value) {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true })
  } catch {
    return value
  }
}

export function toShortId(id) {
  return id?.replace('CMP-2026-', '#') || id
}
