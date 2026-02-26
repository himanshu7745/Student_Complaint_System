import { CONFIDENCE_THRESHOLD } from '@/lib/constants'

function titleCaseWord(word) {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export function mapStatus(status) {
  if (!status) return 'New'
  return status
    .split('_')
    .map(titleCaseWord)
    .join(' ')
}

export function mapPriority(priority) {
  if (!priority) return 'Medium'
  return titleCaseWord(priority)
}

export function mapCategory(category) {
  if (!category) return category
  const normalized = String(category).trim().toUpperCase()
  if (normalized === 'LIBRARY' || normalized === 'MESS' || normalized === 'OTHER' || normalized === 'OTHERS') {
    return 'Others'
  }
  return category
    .split('_')
    .map(titleCaseWord)
    .join(' ')
}

function asPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return 0
  const n = Number(value)
  const normalized = n <= 1 ? n * 100 : n
  return Math.round(Math.max(0, Math.min(100, normalized)))
}

function mapUser(user) {
  if (!user) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
  }
}

function mapAssignments(assignments) {
  return {
    owner: mapUser(assignments?.owner),
    collaborators: (assignments?.collaborators || []).map(mapUser),
  }
}

function mapPrediction(prediction, categories = []) {
  const labels = (prediction?.labels || []).map((label) => ({
    label: mapCategory(label.label),
    score: asPercent(label.confidence),
  }))
  const categoryLabels = labels.length
    ? labels
    : (categories || []).map((c) => ({ label: mapCategory(c.category || c), score: asPercent(c.confidence || 0) }))
  const overall = asPercent(prediction?.overallConfidence)
  return {
    overall,
    labels: categoryLabels,
    belowThreshold: overall > 0 && overall < CONFIDENCE_THRESHOLD,
    severityScore: prediction?.severityScore ?? null,
    failureReason: prediction?.failureReason || null,
    predictionFailed: Boolean(prediction?.predictionFailed),
    predictedAt: prediction?.predictedAt || null,
  }
}

function mapMessages(messages = []) {
  return messages.map((msg) => ({
    id: String(msg.id),
    senderType: msg.sender?.role === 'ROLE_USER' ? 'student' : 'admin',
    senderName: msg.sender?.name || 'System',
    text: msg.message,
    createdAt: msg.createdAt,
    internal: Boolean(msg.internal),
  }))
}

function timelineAction(event) {
  const type = event.eventType || event.type
  const newValue = event.newValue
  switch (type) {
    case 'STATUS_CHANGED': return `Status changed to ${mapStatus(newValue)}`
    case 'ASSIGNED': return 'Assignment updated'
    case 'CREATED': return 'Complaint submitted'
    case 'MESSAGE_ADDED': return 'Message added'
    case 'ATTACHMENT_ADDED': return 'Attachment added'
    case 'PREDICTION_COMPLETED': return 'Prediction completed'
    case 'PREDICTION_FAILED': return 'Prediction failed'
    case 'REVIEW_REQUIRED': return 'Sent to manual review'
    case 'REVIEW_APPROVED': return 'Manual review approved'
    case 'ESCALATED': return 'Escalated'
    case 'RESOLVED': return 'Marked resolved'
    case 'CLOSED': return 'Closed'
    case 'REOPENED': return 'Reopened'
    case 'FEEDBACK_ADDED': return 'Feedback added'
    default: return mapStatus((type || 'Updated').replace(/_/g, ' '))
  }
}

function mapTimeline(events = []) {
  return events.map((event) => ({
    id: String(event.id),
    type: (event.eventType || 'UPDATED').toLowerCase(),
    actor: event.actor?.name || 'System',
    action: timelineAction(event),
    timestamp: event.createdAt,
    detail: event.detail || [event.oldValue, event.newValue].filter(Boolean).join(' -> ') || '',
  }))
}

function mapAudit(events = []) {
  return events.map((event) => ({
    id: String(event.id),
    actor: event.actor?.name || 'System',
    field: (event.eventType || 'UPDATE').replace(/_/g, ' ').toLowerCase(),
    from: event.oldValue || '-',
    to: event.newValue || '-',
    timestamp: event.createdAt,
  }))
}

function mapAttachments(attachments = []) {
  return attachments.map((file) => ({
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

function deriveResolution(detail) {
  const resolved = ['Resolved', 'Closed'].includes(mapStatus(detail.status))
  if (!resolved) return null
  const publicMessages = (detail.messages || []).filter((m) => !m.internal)
  const latest = [...publicMessages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
  return {
    note: latest?.message || detail.feedbackComment || 'Resolution completed.',
    attachments: [],
    resolvedAt: detail.resolvedAt || detail.updatedAt,
  }
}

export function mapComplaintTicket(item) {
  const categoriesDetailed = (item.categories || []).map((cat) => ({
    category: mapCategory(cat.category || cat),
    primary: Boolean(cat.primary || cat.isPrimary),
    confidence: cat.confidence ?? null,
  }))
  const categories = categoriesDetailed.map((c) => c.category)
  const prediction = mapPrediction(item.prediction, item.categories)
  const status = mapStatus(item.status)
  const priority = mapPriority(item.priority)
  const detailMessages = mapMessages(item.messages || [])
  const detailTimeline = mapTimeline(item.timeline || [])
  const detailAudit = mapAudit(item.auditLog || [])

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    status,
    priority,
    categories,
    categoryDetails: categoriesDetailed,
    confidence: prediction,
    location: {
      hostel: item.location?.hostel || null,
      building: item.location?.building || null,
      room: item.location?.room || null,
    },
    assignees: mapAssignments(item.assignments),
    messages: detailMessages,
    attachments: mapAttachments(item.attachments || []),
    timeline: detailTimeline,
    auditLog: detailAudit,
    resolution: deriveResolution(item),
    preferredVisitSlot: item.preferredVisitSlot || null,
    anonymous: Boolean(item.anonymous),
    needsManualReview: Boolean(item.needsReview),
    needsReview: Boolean(item.needsReview),
    reviewReason: item.reviewReason || null,
    slaDueAt: item.sla?.resolveDueAt || item.sla?.acknowledgeDueAt || null,
    acknowledgeDueAt: item.sla?.acknowledgeDueAt || null,
    resolveDueAt: item.sla?.resolveDueAt || null,
    feedbackRating: item.feedbackRating ?? null,
    feedbackComment: item.feedbackComment ?? null,
    userRating: item.feedbackRating ?? null,
    resolvedAt: item.resolvedAt || null,
    closedAt: item.closedAt || null,
  }
}

export function mapListTicket(item) {
  return mapComplaintTicket(item)
}

export function mapReviewQueueItem(item) {
  const fakeDetail = {
    id: item.complaintId,
    title: item.title,
    description: item.description,
    status: item.status,
    priority: item.priority,
    needsReview: item.needsReview,
    reviewReason: item.reviewReason,
    location: item.location || {},
    categories: (item.labels || []).map((l, idx) => ({ category: l.label, primary: idx === 0, confidence: l.score })),
    prediction: {
      overallConfidence: item.overallConfidence,
      severityScore: item.severityScore,
      labels: (item.labels || []).map((l) => ({ label: l.label, confidence: l.score })),
      predictionFailed: false,
      failureReason: null,
    },
    assignments: {
      owner: item.suggestedRouting?.owner,
      collaborators: item.suggestedRouting?.collaborators || [],
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    attachments: [],
    messages: [],
    timeline: [],
    auditLog: [],
    anonymous: false,
  }
  return {
    id: item.complaintId,
    ticketId: item.complaintId,
    highlightedKeywords: item.highlightedKeywords || [],
    internalNotes: '',
    spam: false,
    draftTicket: mapComplaintTicket(fakeDetail),
  }
}

export function mapPagedResponse(page) {
  return {
    items: (page?.content || []),
    page: page?.page ?? 0,
    size: page?.size ?? 20,
    totalElements: page?.totalElements ?? 0,
    totalPages: page?.totalPages ?? 1,
    first: page?.first ?? true,
    last: page?.last ?? true,
  }
}
