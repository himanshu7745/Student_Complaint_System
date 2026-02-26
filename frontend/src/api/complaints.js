import { httpRequest } from '@/api/http'
import { mapComplaintTicket, mapListTicket, mapPagedResponse } from '@/api/mappers'

export async function listComplaintsApi(params = {}) {
  const page = await httpRequest('/api/complaints', { query: params })
  const normalized = mapPagedResponse(page)
  return {
    ...normalized,
    items: normalized.items.map(mapListTicket),
  }
}

export async function getComplaintApi(id) {
  const data = await httpRequest(`/api/complaints/${id}`)
  return mapComplaintTicket(data)
}

export async function createComplaintApi(payload) {
  const data = await httpRequest('/api/complaints', { method: 'POST', body: payload })
  return mapComplaintTicket(data)
}

export async function updateComplaintApi(id, payload) {
  const data = await httpRequest(`/api/complaints/${id}`, { method: 'PATCH', body: payload })
  return mapComplaintTicket(data)
}

export async function listMessagesApi(id) {
  const data = await httpRequest(`/api/complaints/${id}/messages`)
  return (data || []).map((m) => ({
    id: String(m.id),
    senderType: m.sender?.role === 'ROLE_USER' ? 'student' : 'admin',
    senderName: m.sender?.name || 'System',
    text: m.message,
    createdAt: m.createdAt,
    internal: Boolean(m.internal),
  }))
}

export async function addMessageApi(id, payload) {
  const data = await httpRequest(`/api/complaints/${id}/messages`, { method: 'POST', body: payload })
  return {
    id: String(data.id),
    senderType: data.sender?.role === 'ROLE_USER' ? 'student' : 'admin',
    senderName: data.sender?.name || 'System',
    text: data.message,
    createdAt: data.createdAt,
    internal: Boolean(data.internal),
  }
}

export async function getTimelineApi(id) {
  const data = await httpRequest(`/api/complaints/${id}/timeline`)
  return (data || []).map((event) => ({
    id: String(event.id),
    type: (event.eventType || 'UPDATED').toLowerCase(),
    actor: event.actor?.name || 'System',
    action: event.detail || (event.eventType || 'UPDATED').replace(/_/g, ' '),
    timestamp: event.createdAt,
    detail: [event.oldValue, event.newValue].filter(Boolean).join(' -> '),
  }))
}

export async function uploadComplaintAttachmentsApi(id, files, { rerunPrediction = false } = {}) {
  const formData = new FormData()
  files.forEach((f) => {
    const file = f instanceof File ? f : f.file || null
    if (file instanceof File) formData.append('files', file)
  })
  const data = await httpRequest(`/api/complaints/${id}/attachments`, {
    method: 'POST',
    formData,
    query: { rerunPrediction },
  })
  return (data || []).map((file) => ({
    id: String(file.id),
    name: file.fileName,
    mimeType: file.mimeType,
    sizeKb: Math.max(1, Math.round((file.size || 0) / 1024)),
    by: file.uploaderName || 'User',
    uploadedAt: file.createdAt,
    type: file.mimeType?.startsWith('image/') ? 'image' : 'file',
    url: file.url,
  }))
}

export async function reopenComplaintApi(id, reason) {
  const data = await httpRequest(`/api/complaints/${id}/reopen`, {
    method: 'POST',
    body: { reason },
  })
  return mapComplaintTicket(data)
}

export async function sendFeedbackApi(id, payload) {
  const data = await httpRequest(`/api/complaints/${id}/feedback`, { method: 'POST', body: payload })
  return mapComplaintTicket(data)
}
