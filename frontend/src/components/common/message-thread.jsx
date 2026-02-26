import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/format'
import { useState } from 'react'

export function MessageThread({ messages = [], onSend, placeholder = 'Type a message...', allowInternal = false }) {
  const [draft, setDraft] = useState('')
  const [internal, setInternal] = useState(false)
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (!draft.trim() || sending) return
    const nextText = draft.trim()
    setSending(true)
    try {
      await onSend?.({ text: nextText, internal })
      setDraft('')
      setInternal(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 ? <div className="text-sm text-slate-500">No messages yet.</div> : null}
          {messages.map((msg) => {
            const mine = msg.senderType === 'student'
            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-2xl border px-3 py-2 ${mine ? 'border-slate-200 bg-white' : 'border-blue-100 bg-blue-50'}`}>
                  <div className="text-xs font-medium text-slate-700">{msg.senderName}{msg.internal ? ' (Internal)' : ''}</div>
                  <p className="mt-1 text-sm text-slate-700">{msg.text}</p>
                  <div className="mt-1 text-[11px] text-slate-400">{formatDateTime(msg.createdAt)}</div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 space-y-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), void submit())}
            placeholder={placeholder}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {allowInternal ? (
              <label className="inline-flex items-center gap-2 text-xs text-slate-500">
                <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
                Internal note
              </label>
            ) : <span />}
            <Button size="sm" onClick={() => void submit()} disabled={!draft.trim() || sending}>
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
