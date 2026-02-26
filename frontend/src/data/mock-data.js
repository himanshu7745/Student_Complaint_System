import { USERS } from '@/lib/constants'

const now = new Date('2026-02-26T11:30:00')

function minutesAgo(min) {
  return new Date(now.getTime() - min * 60_000).toISOString()
}

function hoursAgo(h) {
  return minutesAgo(h * 60)
}

function daysAgo(d) {
  return hoursAgo(d * 24)
}

function attachment(id, name, sizeKb, by, uploadedAt, type = 'image') {
  return { id, name, sizeKb, by, uploadedAt, type, url: '#' }
}

function message(id, senderType, senderName, text, createdAt, internal = false) {
  return { id, senderType, senderName, text, createdAt, internal }
}

function timeline(id, type, actor, action, timestamp, detail) {
  return { id, type, actor, action, timestamp, detail }
}

function audit(id, actor, field, from, to, timestamp) {
  return { id, actor, field, from, to, timestamp }
}

function createTicket(partial) {
  return {
    id: partial.id,
    title: partial.title,
    description: partial.description,
    createdAt: partial.createdAt,
    updatedAt: partial.updatedAt,
    status: partial.status,
    priority: partial.priority,
    categories: partial.categories,
    confidence: partial.confidence,
    location: partial.location,
    assignees: partial.assignees,
    messages: partial.messages || [],
    attachments: partial.attachments || [],
    timeline: partial.timeline || [],
    resolution: partial.resolution || null,
    auditLog: partial.auditLog || [],
    preferredVisitSlot: partial.preferredVisitSlot || null,
    anonymous: partial.anonymous || false,
    needsManualReview: Boolean(partial.needsManualReview),
    slaDueAt: partial.slaDueAt,
    userRating: partial.userRating || null,
  }
}

export const mockTickets = [
  createTicket({
    id: 'CMP-2026-1001',
    title: 'Sparks from switchboard in hostel room',
    description:
      'When turning on the study lamp, sparks came from the switchboard near bed. The socket also feels warm. This is in Maple Hall Block B room 204.',
    createdAt: hoursAgo(22),
    updatedAt: minutesAgo(25),
    status: 'In Progress',
    priority: 'Critical',
    categories: ['Electrical', 'Hostel'],
    confidence: {
      overall: 94,
      threshold: 72,
      belowThreshold: false,
      labels: [
        { label: 'Electrical', score: 97 },
        { label: 'Hostel', score: 91 },
      ],
    },
    location: { hostel: 'Maple Hall', building: 'Block B', room: '204' },
    assignees: { owner: USERS.authorities[0], collaborators: [USERS.authorities[1]] },
    attachments: [attachment('a1', 'switchboard-photo.jpg', 832, 'Aarav Sharma', hoursAgo(22))],
    messages: [
      message('m1', 'student', 'Aarav Sharma', 'Please prioritize. I have switched off the mains for now.', hoursAgo(21)),
      message('m2', 'admin', 'Rahul Verma', 'Electrician assigned. Please avoid using the socket until inspection.', hoursAgo(20)),
    ],
    timeline: [
      timeline('t1', 'created', 'Aarav Sharma', 'Complaint submitted', hoursAgo(22), 'AI classified as Electrical + Hostel'),
      timeline('t2', 'status', 'System', 'Status changed to Acknowledged', hoursAgo(21.8), ''),
      timeline('t3', 'assign', 'System', 'Assigned to Rahul Verma', hoursAgo(21.7), 'Collaborator: Meera Nair'),
      timeline('t4', 'status', 'Rahul Verma', 'Status changed to In Progress', hoursAgo(20), 'Technician visit scheduled'),
    ],
    auditLog: [
      audit('u1', 'System', 'category', 'Unclassified', 'Electrical, Hostel', hoursAgo(22)),
      audit('u2', 'System', 'priority', 'Medium', 'Critical', hoursAgo(22)),
      audit('u3', 'Rahul Verma', 'status', 'Acknowledged', 'In Progress', hoursAgo(20)),
    ],
    preferredVisitSlot: 'Today 3:00 PM - 5:00 PM',
    slaDueAt: hoursAgo(-2),
  }),
  createTicket({
    id: 'CMP-2026-1002',
    title: 'Wi-Fi drops every evening in Pine Hostel',
    description:
      'Internet disconnects around 8 PM daily in Pine Hostel Block A room 118. Multiple students are facing the same issue.',
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(6),
    status: 'Needs Info',
    priority: 'High',
    categories: ['Internet', 'Hostel'],
    confidence: {
      overall: 89,
      threshold: 72,
      belowThreshold: false,
      labels: [
        { label: 'Internet', score: 93 },
        { label: 'Hostel', score: 85 },
      ],
    },
    location: { hostel: 'Pine Hostel', building: 'Block A', room: '118' },
    assignees: { owner: USERS.authorities[3], collaborators: [USERS.authorities[1]] },
    messages: [
      message('m3', 'admin', 'Campus IT Desk', 'Can you share a screenshot of the login page when it disconnects?', hoursAgo(6)),
    ],
    timeline: [
      timeline('t5', 'created', 'Aarav Sharma', 'Complaint submitted', daysAgo(2), 'Detected Internet + Hostel'),
      timeline('t6', 'status', 'Campus IT Desk', 'Requested more information', hoursAgo(6), 'Logs and screenshot required'),
    ],
    auditLog: [audit('u4', 'System', 'assignee', 'Unassigned', 'Campus IT Desk', daysAgo(2))],
    slaDueAt: hoursAgo(10),
  }),
  createTicket({
    id: 'CMP-2026-1003',
    title: 'Water leakage near washroom ceiling',
    description: 'Continuous leakage from ceiling outside washroom in Oak Residence Block C floor 2 corridor.',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    status: 'Resolved',
    priority: 'High',
    categories: ['Plumbing', 'Hostel'],
    confidence: {
      overall: 91,
      threshold: 72,
      belowThreshold: false,
      labels: [
        { label: 'Plumbing', score: 95 },
        { label: 'Hostel', score: 87 },
      ],
    },
    location: { hostel: 'Oak Residence', building: 'Block C', room: 'Corridor - Floor 2' },
    assignees: { owner: USERS.authorities[2], collaborators: [USERS.authorities[1]] },
    messages: [
      message('m4', 'admin', 'S. Iqbal', 'Leak source identified from upper floor line. Repair complete.', daysAgo(1.2)),
    ],
    attachments: [attachment('a2', 'leak-video.mp4', 4850, 'Aarav Sharma', daysAgo(5), 'video')],
    timeline: [
      timeline('t7', 'created', 'Aarav Sharma', 'Complaint submitted', daysAgo(5), 'AI classified Plumbing + Hostel'),
      timeline('t8', 'status', 'S. Iqbal', 'Status changed to In Progress', daysAgo(4.8), 'Plumber assigned'),
      timeline('t9', 'status', 'S. Iqbal', 'Status changed to Resolved', daysAgo(1.2), 'Pipe coupling replaced'),
    ],
    resolution: {
      note: 'Replaced cracked coupling and sealed ceiling patch. Monitoring advised for 24 hours.',
      attachments: [attachment('a3', 'repair-photo.jpg', 650, 'S. Iqbal', daysAgo(1.1))],
      resolvedAt: daysAgo(1.2),
    },
    auditLog: [
      audit('u5', 'System', 'priority', 'Medium', 'High', daysAgo(5)),
      audit('u6', 'S. Iqbal', 'status', 'In Progress', 'Resolved', daysAgo(1.2)),
    ],
    userRating: 5,
    slaDueAt: daysAgo(2),
  }),
  createTicket({
    id: 'CMP-2026-1004',
    title: 'Unhygienic mess dining area after dinner',
    description: 'Tables remain dirty and food waste is left for hours after dinner in hostel mess.',
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(12),
    status: 'Acknowledged',
    priority: 'Medium',
    categories: ['Mess', 'Sanitation', 'Hostel'],
    confidence: {
      overall: 77,
      threshold: 72,
      belowThreshold: false,
      labels: [
        { label: 'Mess', score: 84 },
        { label: 'Sanitation', score: 73 },
        { label: 'Hostel', score: 74 },
      ],
    },
    location: { hostel: 'Cedar Block', building: 'Mess Hall', room: 'Ground Floor' },
    assignees: { owner: USERS.authorities[2], collaborators: [USERS.authorities[1]] },
    messages: [],
    timeline: [timeline('t10', 'created', 'Aarav Sharma', 'Complaint submitted', daysAgo(3), 'Auto-routed to Facilities')],
    auditLog: [],
    slaDueAt: hoursAgo(14),
  }),
  createTicket({
    id: 'CMP-2026-1005',
    title: 'No projector in Classroom 4B working',
    description: 'Projector flickers and shuts down during lecture in Main Academic Classroom 4B.',
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(4),
    status: 'New',
    priority: 'Medium',
    categories: ['Classroom', 'Electrical'],
    confidence: {
      overall: 68,
      threshold: 72,
      belowThreshold: true,
      labels: [
        { label: 'Classroom', score: 74 },
        { label: 'Electrical', score: 62 },
      ],
    },
    location: { hostel: '', building: 'Main Academic', room: 'Classroom 4B' },
    assignees: { owner: USERS.authorities[2], collaborators: [USERS.authorities[0]] },
    messages: [],
    timeline: [timeline('t11', 'created', 'Faculty Office', 'Complaint submitted', daysAgo(1), 'Low confidence flagged for review')],
    auditLog: [audit('u7', 'System', 'reviewFlag', 'false', 'true', daysAgo(1))],
    needsManualReview: true,
    slaDueAt: hoursAgo(-6),
  }),
  createTicket({
    id: 'CMP-2026-1006',
    title: 'Lost laptop reported near library reading hall',
    description: 'Suspected theft. CCTV near library reading hall should be checked. Happened around 7 PM.',
    createdAt: hoursAgo(18),
    updatedAt: hoursAgo(2),
    status: 'In Progress',
    priority: 'High',
    categories: ['Security', 'Library'],
    confidence: {
      overall: 86,
      threshold: 72,
      belowThreshold: false,
      labels: [
        { label: 'Security', score: 92 },
        { label: 'Library', score: 80 },
      ],
    },
    location: { hostel: '', building: 'Library Wing', room: 'Reading Hall' },
    assignees: { owner: USERS.authorities[4], collaborators: [USERS.authorities[5]] },
    messages: [message('m5', 'admin', 'Security Office', 'Please share laptop model and serial number.', hoursAgo(2))],
    attachments: [],
    timeline: [
      timeline('t12', 'created', 'Aarav Sharma', 'Complaint submitted', hoursAgo(18), 'Possible theft'),
      timeline('t13', 'assign', 'System', 'Assigned to Security Office', hoursAgo(17.9), ''),
      timeline('t14', 'status', 'Security Office', 'Status changed to In Progress', hoursAgo(2), 'CCTV review started'),
    ],
    auditLog: [],
    slaDueAt: hoursAgo(6),
  }),
  createTicket({
    id: 'CMP-2026-1007',
    title: 'Fee receipt missing on student portal',
    description: 'Paid fee but receipt is not visible in portal. Need it for scholarship submission.',
    createdAt: hoursAgo(30),
    updatedAt: hoursAgo(3),
    status: 'Resolved',
    priority: 'Medium',
    categories: ['Administration'],
    confidence: {
      overall: 83,
      threshold: 72,
      belowThreshold: false,
      labels: [{ label: 'Administration', score: 83 }],
    },
    location: { hostel: '', building: 'Admin Office', room: 'Portal Support' },
    assignees: { owner: USERS.authorities[5], collaborators: [] },
    messages: [message('m6', 'admin', 'Student Affairs', 'Issue fixed. Receipt is now available in portal downloads.', hoursAgo(3))],
    attachments: [],
    timeline: [timeline('t15', 'status', 'Student Affairs', 'Status changed to Resolved', hoursAgo(3), 'Portal cache refreshed')],
    resolution: {
      note: 'Receipt regenerated and linked to payment record.',
      attachments: [],
      resolvedAt: hoursAgo(3),
    },
    auditLog: [],
    userRating: 4,
    slaDueAt: hoursAgo(8),
  }),
  createTicket({
    id: 'CMP-2026-1008',
    title: 'Bad smell and garbage near hostel staircase',
    description: 'Garbage bags left near Block C staircase for two days causing odor and insects.',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(2),
    status: 'Closed',
    priority: 'Low',
    categories: ['Sanitation', 'Hostel'],
    confidence: {
      overall: 84,
      threshold: 72,
      belowThreshold: false,
      labels: [
        { label: 'Sanitation', score: 88 },
        { label: 'Hostel', score: 80 },
      ],
    },
    location: { hostel: 'Maple Hall', building: 'Block C', room: 'Staircase Landing' },
    assignees: { owner: USERS.authorities[2], collaborators: [USERS.authorities[1]] },
    messages: [],
    attachments: [attachment('a4', 'garbage-photo.jpg', 410, 'Aarav Sharma', daysAgo(4))],
    timeline: [timeline('t16', 'status', 'System', 'Status changed to Closed', daysAgo(2), 'Auto-closed after resolution confirmation')],
    resolution: { note: 'Area cleaned and pickup schedule adjusted.', attachments: [], resolvedAt: daysAgo(2.2) },
    auditLog: [],
    userRating: 5,
    slaDueAt: daysAgo(3),
  }),
  createTicket({
    id: 'CMP-2026-1009',
    title: 'Ragging complaint near hostel common area',
    description: 'Senior students verbally harassed first-year students in the common area at night.',
    createdAt: hoursAgo(9),
    updatedAt: hoursAgo(1),
    status: 'Acknowledged',
    priority: 'Critical',
    categories: ['Harassment', 'Hostel', 'Security'],
    confidence: {
      overall: 90,
      threshold: 72,
      belowThreshold: false,
      labels: [
        { label: 'Harassment', score: 96 },
        { label: 'Security', score: 88 },
        { label: 'Hostel', score: 86 },
      ],
    },
    location: { hostel: 'Cedar Block', building: 'Block A', room: 'Common Area' },
    assignees: { owner: USERS.authorities[4], collaborators: [USERS.authorities[5], USERS.authorities[1]] },
    messages: [message('m7', 'admin', 'Security Office', 'Reported to disciplinary committee. Please share names privately if available.', hoursAgo(1))],
    attachments: [],
    timeline: [timeline('t17', 'created', 'Anonymous', 'Complaint submitted', hoursAgo(9), 'Anonymous mode enabled')],
    auditLog: [audit('u8', 'System', 'priority', 'High', 'Critical', hoursAgo(9))],
    anonymous: true,
    slaDueAt: hoursAgo(-1),
  }),
  createTicket({
    id: 'CMP-2026-1010',
    title: 'Campus shuttle bus late on exam day',
    description: 'Morning shuttle arrived 30 minutes late causing students to miss reporting time.',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(5),
    status: 'Reopened',
    priority: 'Medium',
    categories: ['Transport', 'Administration'],
    confidence: {
      overall: 76,
      threshold: 72,
      belowThreshold: false,
      labels: [
        { label: 'Transport', score: 82 },
        { label: 'Administration', score: 70 },
      ],
    },
    location: { hostel: '', building: 'Transport Office', room: 'Route 2' },
    assignees: { owner: USERS.authorities[5], collaborators: [] },
    messages: [],
    attachments: [],
    timeline: [
      timeline('t18', 'status', 'System', 'Status changed to Resolved', daysAgo(6), 'Operator warned'),
      timeline('t19', 'status', 'Aarav Sharma', 'Ticket reopened', daysAgo(5), 'Issue repeated next day'),
    ],
    auditLog: [audit('u9', 'Aarav Sharma', 'status', 'Resolved', 'Reopened', daysAgo(5))],
    slaDueAt: daysAgo(4),
  }),
]

export const mockManualReviewQueue = [
  {
    id: 'MR-001',
    ticketId: 'CMP-2026-1005',
    highlightedKeywords: ['projector', 'flickers', 'Classroom 4B'],
    internalNotes: '',
    spam: false,
  },
  {
    id: 'MR-002',
    ticketId: 'CMP-2026-1011',
    draftTicket: createTicket({
      id: 'CMP-2026-1011',
      title: 'Lights and internet both failing in lab room',
      description:
        'In computer lab 2, some lights are off and the internet is unstable. Not sure who should handle this. Happening since morning.',
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(3.5),
      status: 'New',
      priority: 'Medium',
      categories: ['Classroom', 'Internet', 'Electrical'],
      confidence: {
        overall: 64,
        threshold: 72,
        belowThreshold: true,
        labels: [
          { label: 'Classroom', score: 71 },
          { label: 'Internet', score: 64 },
          { label: 'Electrical', score: 58 },
        ],
      },
      location: { hostel: '', building: 'Main Academic', room: 'Computer Lab 2' },
      assignees: { owner: USERS.authorities[2], collaborators: [USERS.authorities[3]] },
      messages: [],
      attachments: [],
      timeline: [timeline('t20', 'created', 'Student', 'Complaint submitted', hoursAgo(4), 'Auto-routed to manual review')],
      auditLog: [audit('u10', 'System', 'reviewFlag', 'false', 'true', hoursAgo(4))],
      needsManualReview: true,
      slaDueAt: hoursAgo(-12),
    }),
    highlightedKeywords: ['lights', 'internet', 'lab'],
    internalNotes: '',
    spam: false,
  },
]

export const mockAnalyticsSeed = {
  trend: [
    { day: 'Mon', tickets: 18, resolved: 14 },
    { day: 'Tue', tickets: 22, resolved: 16 },
    { day: 'Wed', tickets: 27, resolved: 21 },
    { day: 'Thu', tickets: 24, resolved: 20 },
    { day: 'Fri', tickets: 31, resolved: 23 },
    { day: 'Sat', tickets: 16, resolved: 13 },
    { day: 'Sun', tickets: 12, resolved: 10 },
  ],
  categories: [
    { name: 'Hostel', value: 28 },
    { name: 'Electrical', value: 18 },
    { name: 'Internet', value: 14 },
    { name: 'Sanitation', value: 10 },
    { name: 'Security', value: 8 },
    { name: 'Admin', value: 12 },
  ],
}
