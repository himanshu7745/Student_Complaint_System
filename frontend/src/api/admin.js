import { httpRequest } from '@/api/http'
import { mapComplaintTicket, mapListTicket, mapPagedResponse, mapReviewQueueItem } from '@/api/mappers'

export async function getAdminInboxApi(params = {}) {
  const page = await httpRequest('/api/admin/inbox', { query: params })
  const normalized = mapPagedResponse(page)
  return {
    ...normalized,
    items: normalized.items.map(mapListTicket),
  }
}

export async function getAdminComplaintDetailApi(id) {
  const data = await httpRequest(`/api/admin/complaints/${id}`)
  return mapComplaintTicket(data)
}

export async function assignComplaintApi(id, payload) {
  return httpRequest(`/api/admin/complaints/${id}/assign`, { method: 'POST', body: payload })
}

export async function updateComplaintStatusApi(id, payload) {
  return httpRequest(`/api/admin/complaints/${id}/status`, { method: 'POST', body: payload })
}

export async function escalateComplaintApi(id, payload) {
  return httpRequest(`/api/admin/complaints/${id}/escalate`, { method: 'POST', body: payload })
}

export async function resolveComplaintApi(id, payload) {
  return httpRequest(`/api/admin/complaints/${id}/resolve`, { method: 'POST', body: payload })
}

export async function getReviewQueueApi(params = {}) {
  const page = await httpRequest('/api/admin/review-queue', { query: params })
  const normalized = mapPagedResponse(page)
  return {
    ...normalized,
    items: normalized.items.map(mapReviewQueueItem),
  }
}

export async function approveReviewApi(id, payload = {}) {
  return httpRequest(`/api/admin/review-queue/${id}/approve`, { method: 'POST', body: payload })
}

export async function editReviewApi(id, payload) {
  return httpRequest(`/api/admin/review-queue/${id}/edit`, { method: 'POST', body: payload })
}

export async function getAnalyticsSummaryApi() {
  return httpRequest('/api/admin/analytics/summary')
}

export async function getAnalyticsTrendsApi(days = 7) {
  return httpRequest('/api/admin/analytics/trends', { query: { days } })
}

export async function getAnalyticsByCategoryApi() {
  return httpRequest('/api/admin/analytics/by-category')
}
