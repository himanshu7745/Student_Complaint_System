export const STATUS_FLOW = ['New', 'Acknowledged', 'In Progress', 'Needs Info', 'Resolved', 'Closed', 'Reopened']

export const STATUS_OPTIONS = ['All', ...STATUS_FLOW]

export const PRIORITY_OPTIONS = ['All', 'Critical', 'High', 'Medium', 'Low']

export const CATEGORY_OPTIONS = [
  'Hostel',
  'Electrical',
  'Internet',
  'Sanitation',
  'Classroom',
  'Security',
  'Administration',
  'Plumbing',
  'Harassment',
  'Transport',
  'Others',
]

export const HOSTELS = ['Maple Hall', 'Oak Residence', 'Pine Hostel', 'Cedar Block']
export const BUILDINGS = ['Block A', 'Block B', 'Block C', 'Main Academic', 'Library Wing', 'Sports Complex']

export const USERS = {
  student: { id: 1, name: 'Student User', role: 'Student' },
  authorities: [
    { id: 2, name: 'Electrical Supervisor', role: 'Electrical Supervisor' },
    { id: 3, name: 'Hostel Warden', role: 'Hostel Warden' },
    { id: 4, name: 'Facilities Manager', role: 'Facilities Manager' },
    { id: 5, name: 'IT Support', role: 'IT Support' },
    { id: 6, name: 'Security Office', role: 'Security Office' },
    { id: 7, name: 'Manual Reviewer', role: 'Manual Reviewer' },
    { id: 8, name: 'Super Admin', role: 'Super Admin' },
  ],
}

export const CONFIDENCE_THRESHOLD = 72
