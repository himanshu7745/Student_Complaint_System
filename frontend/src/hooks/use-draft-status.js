import { useEffect, useRef, useState } from 'react'

export function useDraftStatus(value, storageKey) {
  const [status, setStatus] = useState('idle')
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!storageKey) return
    setStatus('saving')
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value))
        setStatus('saved')
      } catch {
        setStatus('error')
      }
    }, 450)
    return () => window.clearTimeout(timeoutRef.current)
  }, [storageKey, value])

  return status
}

export function loadDraft(storageKey, fallback) {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}
