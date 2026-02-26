export const STUDENT_NAV = [
  { label: 'Dashboard', to: '/student/dashboard' },
  { label: 'Raise Complaint', to: '/student/complaints/new' },
  { label: 'My Complaints', to: '/student/complaints' },
]

export const ADMIN_NAV = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Complaints', to: '/admin/complaints' },
  { label: 'Departments', to: '/admin/departments' },
]

export const STATUS_OPTIONS = [
  'NEW',
  'AI_CLASSIFIED',
  'PENDING_ADMIN_ASSIGNMENT',
  'ASSIGNED_TO_DEPARTMENT',
  'EMAIL_SENT',
  'ACK_RECEIVED',
  'ACTION_TAKEN',
  'RESOLVED_BY_STUDENT',
  'ESCALATED_TO_DIRECTOR',
  'CLOSED',
]

export const SEVERITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
