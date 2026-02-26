import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  addMessageApi,
  createComplaintApi,
  getComplaintApi,
  listComplaintsApi,
  reopenComplaintApi,
  sendFeedbackApi,
  uploadComplaintAttachmentsApi,
} from '@/api/complaints'
import {
  approveReviewApi,
  assignComplaintApi,
  editReviewApi,
  escalateComplaintApi,
  getAdminComplaintDetailApi,
  getAdminInboxApi,
  getAnalyticsByCategoryApi,
  getAnalyticsSummaryApi,
  getAnalyticsTrendsApi,
  getReviewQueueApi,
  resolveComplaintApi,
  updateComplaintStatusApi,
} from '@/api/admin'
import { useAuth } from '@/auth/auth-context'

const AppStoreContext = createContext(null)

function toBackendStatus(status) {
  return String(status || 'NEW').trim().toUpperCase().replace(/\s+/g, '_')
}

function toBackendPriority(priority) {
  return String(priority || 'MEDIUM').trim().toUpperCase()
}

function toBackendCategory(category) {
  return String(category || '').trim().toUpperCase().replace(/\s+/g, '_')
}

function fileListFromInput(files) {
  return (files || []).map((f) => (f instanceof File ? f : f?.file instanceof File ? f.file : null)).filter(Boolean)
}

function mergeTicketMap(prev, ticket) {
  if (!ticket?.id) return prev
  return { ...prev, [ticket.id]: { ...(prev[ticket.id] || {}), ...ticket } }
}

function deriveUserMetrics(tickets) {
  return {
    open: tickets.filter((t) => ['New', 'Acknowledged', 'Reopened'].includes(t.status)).length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    resolved: tickets.filter((t) => ['Resolved', 'Closed'].includes(t.status)).length,
    needsInfo: tickets.filter((t) => t.status === 'Needs Info').length,
  }
}

export function AppStoreProvider({ children }) {
  const { isAuthenticated, user, role, isAdmin, bootLoading: authBootLoading } = useAuth()

  const [bootLoading, setBootLoading] = useState(true)
  const [ticketMap, setTicketMap] = useState({})
  const [userTicketsPage, setUserTicketsPage] = useState({ items: [], page: 0, size: 20, totalPages: 1, totalElements: 0, first: true, last: true })
  const [adminInboxPage, setAdminInboxPage] = useState({ items: [], page: 0, size: 20, totalPages: 1, totalElements: 0, first: true, last: true })
  const [manualReviewPage, setManualReviewPage] = useState({ items: [], page: 0, size: 20, totalPages: 1, totalElements: 0, first: true, last: true })
  const [analytics, setAnalytics] = useState({ summary: null, trends: [], categories: [], criticalAlerts: [] })
  const [loading, setLoading] = useState({
    userTickets: false,
    ticketDetail: false,
    adminInbox: false,
    reviewQueue: false,
    analytics: false,
  })
  const [lastUserFilters, setLastUserFilters] = useState({})
  const [lastAdminFilters, setLastAdminFilters] = useState({})
  const [reviewNotes, setReviewNotes] = useState({})
  const reviewNotesRef = useRef({})

  useEffect(() => {
    reviewNotesRef.current = reviewNotes
  }, [reviewNotes])

  useEffect(() => {
    if (authBootLoading) return
    if (!isAuthenticated) {
      setTicketMap({})
      setUserTicketsPage({ items: [], page: 0, size: 20, totalPages: 1, totalElements: 0, first: true, last: true })
      setAdminInboxPage({ items: [], page: 0, size: 20, totalPages: 1, totalElements: 0, first: true, last: true })
      setManualReviewPage({ items: [], page: 0, size: 20, totalPages: 1, totalElements: 0, first: true, last: true })
      setAnalytics({ summary: null, trends: [], categories: [], criticalAlerts: [] })
    }
    setBootLoading(false)
  }, [authBootLoading, isAuthenticated])

  const mergeTickets = useCallback((tickets) => {
    setTicketMap((prev) => tickets.reduce((acc, t) => mergeTicketMap(acc, t), prev))
  }, [])

  const syncTicketAcrossPages = useCallback((ticket) => {
    if (!ticket?.id) return
    setUserTicketsPage((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === ticket.id ? { ...item, ...ticket } : item)),
    }))
    setAdminInboxPage((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === ticket.id ? { ...item, ...ticket } : item)),
    }))
  }, [])

  const getTicketById = useCallback((id) => ticketMap[id] || null, [ticketMap])

  const loadTicketDetail = useCallback(async (id, { admin = false } = {}) => {
    if (!isAuthenticated || !id) return null
    setLoading((prev) => ({ ...prev, ticketDetail: true }))
    try {
      const ticket = admin ? await getAdminComplaintDetailApi(id) : await getComplaintApi(id)
      setTicketMap((prev) => mergeTicketMap(prev, ticket))
      syncTicketAcrossPages(ticket)
      return ticket
    } finally {
      setLoading((prev) => ({ ...prev, ticketDetail: false }))
    }
  }, [isAuthenticated, syncTicketAcrossPages])

  const loadUserTickets = useCallback(async (filters = {}) => {
    if (!isAuthenticated) return null
    setLoading((prev) => ({ ...prev, userTickets: true }))
    setLastUserFilters(filters)
    try {
      const page = await listComplaintsApi({
        mine: true,
        status: filters.status,
        category: filters.category,
        q: filters.q,
        from: filters.from,
        to: filters.to,
        page: filters.page ?? 0,
        size: filters.size ?? 20,
      })
      mergeTickets(page.items)
      setUserTicketsPage(page)
      return page
    } finally {
      setLoading((prev) => ({ ...prev, userTickets: false }))
    }
  }, [isAuthenticated, mergeTickets])

  const loadAdminInbox = useCallback(async (filters = {}) => {
    if (!isAuthenticated) return null
    setLoading((prev) => ({ ...prev, adminInbox: true }))
    setLastAdminFilters(filters)
    try {
      const page = await getAdminInboxApi({
        status: filters.status,
        category: filters.categories || filters.category,
        priority: filters.priority,
        confidenceLevel: filters.confidenceLevel || filters.confidence,
        assignedTo: filters.assignedTo,
        location: filters.location,
        needsReview: filters.needsReview,
        q: filters.q || filters.search,
        page: filters.page ?? 0,
        size: filters.size ?? 20,
      })
      mergeTickets(page.items)
      setAdminInboxPage(page)
      return page
    } finally {
      setLoading((prev) => ({ ...prev, adminInbox: false }))
    }
  }, [isAuthenticated, mergeTickets])

  const loadReviewQueue = useCallback(async ({ page = 0, size = 20 } = {}) => {
    if (!isAuthenticated) return null
    setLoading((prev) => ({ ...prev, reviewQueue: true }))
    try {
      const result = await getReviewQueueApi({ page, size })
      const itemsWithNotes = result.items.map((item) => ({
        ...item,
        internalNotes: reviewNotesRef.current[item.id] || item.internalNotes || '',
      }))
      mergeTickets(itemsWithNotes.map((i) => i.draftTicket).filter(Boolean))
      setManualReviewPage({ ...result, items: itemsWithNotes })
      return { ...result, items: itemsWithNotes }
    } finally {
      setLoading((prev) => ({ ...prev, reviewQueue: false }))
    }
  }, [isAuthenticated, mergeTickets])

  const loadAnalytics = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return null
    setLoading((prev) => ({ ...prev, analytics: true }))
    try {
      const [summary, trendsRaw, byCategoryRaw, criticalPage] = await Promise.all([
        getAnalyticsSummaryApi(),
        getAnalyticsTrendsApi(7),
        getAnalyticsByCategoryApi(),
        getAdminInboxApi({ priority: 'CRITICAL', page: 0, size: 5 }),
      ])
      mergeTickets(criticalPage.items)
      const next = {
        summary: {
          open: summary.open,
          unassigned: summary.unassigned,
          breaches: summary.slaBreaches,
          avgResolutionTimeHours: summary.avgResolutionHours,
          manualReviewCount: summary.manualReviewCount,
        },
        trends: (trendsRaw || []).map((p) => ({ day: p.bucket, tickets: p.createdCount, resolved: p.resolvedCount })),
        categories: (byCategoryRaw || []).map((c) => ({ name: c.category.replace(/_/g, ' '), value: c.count })),
        criticalAlerts: criticalPage.items,
      }
      setAnalytics(next)
      return next
    } finally {
      setLoading((prev) => ({ ...prev, analytics: false }))
    }
  }, [isAdmin, isAuthenticated, mergeTickets])

  const refreshTicket = useCallback(async (id) => {
    return loadTicketDetail(id, { admin: isAdmin })
  }, [isAdmin, loadTicketDetail])

  const createTicket = useCallback(async (payload) => {
    const created = await createComplaintApi({
      title: payload.title,
      description: payload.description,
      hostel: payload.location?.hostel || undefined,
      building: payload.location?.building,
      room: payload.location?.room,
      preferredVisitSlot: payload.preferredVisitSlot || undefined,
      anonymous: Boolean(payload.anonymous),
    })

    let finalTicket = created
    const files = fileListFromInput(payload.attachments)
    if (files.length) {
      await uploadComplaintAttachmentsApi(created.id, files, { rerunPrediction: true })
      finalTicket = await getComplaintApi(created.id)
    }

    setTicketMap((prev) => mergeTicketMap(prev, finalTicket))
    syncTicketAcrossPages(finalTicket)
    if (userTicketsPage.items.length) {
      void loadUserTickets(lastUserFilters)
    }
    return finalTicket
  }, [lastUserFilters, loadUserTickets, syncTicketAcrossPages, userTicketsPage.items.length])

  const patchTicket = useCallback((id, patcher) => {
    const current = ticketMap[id]
    if (!current) return
    const nextBase = typeof patcher === 'function' ? patcher(current) : { ...current, ...patcher }
    const next = { ...nextBase, updatedAt: new Date().toISOString() }
    setTicketMap((prev) => mergeTicketMap(prev, next))
    syncTicketAcrossPages(next)
  }, [syncTicketAcrossPages, ticketMap])

  const addMessage = useCallback(async (ticketId, msg) => {
    await addMessageApi(ticketId, { message: msg.text, internal: Boolean(msg.internal) })
    const ticket = await refreshTicket(ticketId)
    return ticket?.messages?.[ticket.messages.length - 1] || null
  }, [refreshTicket])

  const addAttachment = useCallback(async (ticketId, files = []) => {
    const uploaded = await uploadComplaintAttachmentsApi(ticketId, fileListFromInput(files), { rerunPrediction: false })
    await refreshTicket(ticketId)
    return uploaded
  }, [refreshTicket])

  const changeStatus = useCallback(async (ticketId, status, actor = 'Admin', comment) => {
    await updateComplaintStatusApi(ticketId, { status: toBackendStatus(status), comment: comment || actor })
    return refreshTicket(ticketId)
  }, [refreshTicket])

  const assignTicket = useCallback(async (ticketId, owner, collaborators = [], reason = 'Assignment updated') => {
    await assignComplaintApi(ticketId, {
      ownerUserId: Number(owner?.id),
      collaboratorUserIds: (collaborators || []).map((c) => Number(c.id)).filter(Boolean),
      reason,
    })
    return refreshTicket(ticketId)
  }, [refreshTicket])

  const updateCategoriesPriority = useCallback(async (ticketId, categories, priority, actor = 'Admin') => {
    const ticket = ticketMap[ticketId]
    if (ticket?.needsManualReview) {
      await editReviewApi(ticketId, {
        categories: categories.map(toBackendCategory),
        primaryCategory: toBackendCategory(categories[0]),
        priority: toBackendPriority(priority),
        ownerUserId: ticket.assignees?.owner?.id ? Number(ticket.assignees.owner.id) : undefined,
        collaboratorUserIds: (ticket.assignees?.collaborators || []).map((c) => Number(c.id)),
        internalNotes: `${actor}: classification updated`,
      })
      await Promise.all([refreshTicket(ticketId), loadReviewQueue({ page: manualReviewPage.page, size: manualReviewPage.size })])
      return
    }
    // Backend endpoint for general classification edits is not yet exposed; keep UI responsive locally.
    patchTicket(ticketId, { categories, priority })
  }, [loadReviewQueue, manualReviewPage.page, manualReviewPage.size, patchTicket, refreshTicket, ticketMap])

  const resolveTicket = useCallback(async (ticketId, resolutionNote, attachments = []) => {
    await resolveComplaintApi(ticketId, { resolutionNote, attachmentIds: [] })
    const files = fileListFromInput(attachments)
    if (files.length) {
      await uploadComplaintAttachmentsApi(ticketId, files, { rerunPrediction: false })
    }
    return refreshTicket(ticketId)
  }, [refreshTicket])

  const rateResolution = useCallback(async (ticketId, rating, comment = '') => {
    const ticket = await sendFeedbackApi(ticketId, { rating, comment })
    setTicketMap((prev) => mergeTicketMap(prev, ticket))
    syncTicketAcrossPages(ticket)
    return ticket
  }, [syncTicketAcrossPages])

  const reopenTicket = useCallback(async (ticketId, reason = 'Reopened by user') => {
    const ticket = await reopenComplaintApi(ticketId, reason)
    setTicketMap((prev) => mergeTicketMap(prev, ticket))
    syncTicketAcrossPages(ticket)
    return ticket
  }, [syncTicketAcrossPages])

  const updateReviewItem = useCallback((reviewId, patch) => {
    setReviewNotes((prev) => ({ ...prev, [reviewId]: patch.internalNotes ?? prev[reviewId] ?? '' }))
    setManualReviewPage((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === reviewId ? { ...item, ...patch } : item)),
    }))
  }, [])

  const removeReviewItem = useCallback((reviewId) => {
    setManualReviewPage((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== reviewId) }))
  }, [])

  const approveReview = useCallback(async (reviewId, { categories, priority, owner, collaborators, internalNotes, markSpam = false }) => {
    if (markSpam) {
      // Spam workflow endpoint is not implemented in backend; degrade gracefully by escalating local state only.
      throw new Error('Mark spam is not supported by the backend API yet')
    }

    const hasEdits = Boolean(categories?.length || priority || owner)
    if (hasEdits) {
      await editReviewApi(reviewId, {
        categories: (categories || []).map(toBackendCategory),
        primaryCategory: toBackendCategory(categories?.[0]),
        priority: toBackendPriority(priority),
        ownerUserId: owner?.id ? Number(owner.id) : undefined,
        collaboratorUserIds: (collaborators || []).map((c) => Number(c.id)).filter(Boolean),
        internalNotes: internalNotes || undefined,
      })
    }

    await approveReviewApi(reviewId, { internalNotes: internalNotes || undefined })

    await Promise.allSettled([
      loadReviewQueue({ page: manualReviewPage.page, size: manualReviewPage.size }),
      loadAdminInbox(lastAdminFilters),
      refreshTicket(reviewId),
    ])

    return { ticketId: reviewId, spam: false }
  }, [lastAdminFilters, loadAdminInbox, loadReviewQueue, manualReviewPage.page, manualReviewPage.size, refreshTicket])

  const escalateTicket = useCallback(async (ticketId, { level = 'RESOLVE_OVERDUE', escalatedToRole = 'ROLE_SUPER_ADMIN', reason }) => {
    await escalateComplaintApi(ticketId, { level, escalatedToRole, reason })
    return refreshTicket(ticketId)
  }, [refreshTicket])

  const loadBootstrapData = useCallback(async () => {
    if (!isAuthenticated) return
    if (role === 'ROLE_USER') {
      await loadUserTickets({ page: 0, size: 20 })
    } else {
      await Promise.allSettled([
        loadAdminInbox({ page: 0, size: 20 }),
        loadReviewQueue({ page: 0, size: 20 }),
        loadAnalytics(),
      ])
    }
  }, [isAuthenticated, loadAdminInbox, loadAnalytics, loadReviewQueue, loadUserTickets, role])

  useEffect(() => {
    if (authBootLoading || !isAuthenticated) return
    void loadBootstrapData()
  }, [authBootLoading, isAuthenticated, loadBootstrapData])

  const tickets = useMemo(() => Object.values(ticketMap).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)), [ticketMap])
  const manualReviewQueue = manualReviewPage.items
  const userMetrics = useMemo(() => deriveUserMetrics(userTicketsPage.items), [userTicketsPage.items])

  const adminMetrics = useMemo(() => (
    analytics.summary || {
      open: 0,
      unassigned: 0,
      breaches: 0,
      avgResolutionTimeHours: 0,
      manualReviewCount: manualReviewQueue.length,
    }
  ), [analytics.summary, manualReviewQueue.length])

  const categoryDistribution = analytics.categories
  const trendData = analytics.trends
  const criticalAlerts = analytics.criticalAlerts

  const value = useMemo(() => ({
    bootLoading: bootLoading || authBootLoading,
    loading,
    currentUser: user,
    tickets,
    userTickets: userTicketsPage.items,
    userTicketsPage,
    adminInboxTickets: adminInboxPage.items,
    adminInboxPage,
    manualReviewQueue,
    manualReviewPage,
    userMetrics,
    adminMetrics,
    categoryDistribution,
    trendData,
    criticalAlerts,
    getTicketById,
    loadBootstrapData,
    loadTicketDetail,
    loadUserTickets,
    loadAdminInbox,
    loadReviewQueue,
    loadAnalytics,
    refreshTicket,
    createTicket,
    patchTicket,
    addMessage,
    addAttachment,
    changeStatus,
    assignTicket,
    updateCategoriesPriority,
    resolveTicket,
    rateResolution,
    reopenTicket,
    updateReviewItem,
    approveReview,
    removeReviewItem,
    escalateTicket,
    setTickets: (updater) => {
      if (typeof updater === 'function') {
        setTicketMap((prev) => {
          const nextTickets = updater(Object.values(prev))
          return (nextTickets || []).reduce((acc, t) => mergeTicketMap(acc, t), {})
        })
      }
    },
  }), [
    addAttachment,
    addMessage,
    adminInboxPage,
    adminMetrics,
    analytics,
    approveReview,
    assignTicket,
    authBootLoading,
    bootLoading,
    categoryDistribution,
    changeStatus,
    createTicket,
    criticalAlerts,
    escalateTicket,
    getTicketById,
    loadAdminInbox,
    loadAnalytics,
    loadBootstrapData,
    loadReviewQueue,
    loadTicketDetail,
    loadUserTickets,
    loading,
    manualReviewPage,
    manualReviewQueue,
    patchTicket,
    rateResolution,
    reopenTicket,
    refreshTicket,
    removeReviewItem,
    resolveTicket,
    tickets,
    trendData,
    updateCategoriesPriority,
    updateReviewItem,
    user,
    userMetrics,
    userTicketsPage,
  ])

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const context = useContext(AppStoreContext)
  if (!context) throw new Error('useAppStore must be used within AppStoreProvider')
  return context
}
