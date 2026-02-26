import { CONFIDENCE_THRESHOLD, USERS } from '@/lib/constants'

const CATEGORY_RULES = [
  { label: 'Electrical', keywords: ['light', 'switch', 'power', 'socket', 'electric', 'fan', 'ac'] },
  { label: 'Plumbing', keywords: ['water', 'leak', 'tap', 'drain', 'toilet', 'washroom'] },
  { label: 'Hostel', keywords: ['hostel', 'room', 'warden', 'residence', 'block'] },
  { label: 'Internet', keywords: ['wifi', 'internet', 'network', 'router'] },
  { label: 'Security', keywords: ['security', 'theft', 'gate', 'guard', 'unsafe'] },
  { label: 'Sanitation', keywords: ['clean', 'garbage', 'odor', 'dirty', 'sanitation'] },
  { label: 'Classroom', keywords: ['classroom', 'projector', 'desk', 'lecture', 'lab'] },
  { label: 'Library', keywords: ['library', 'reading hall'] },
  { label: 'Mess', keywords: ['mess', 'food', 'canteen', 'dining'] },
  { label: 'Transport', keywords: ['bus', 'transport', 'shuttle'] },
  { label: 'Administration', keywords: ['certificate', 'fee', 'portal', 'office'] },
  { label: 'Harassment', keywords: ['harass', 'abuse', 'threat', 'ragging'] },
]

function scoreText(text, keywords) {
  const hay = text.toLowerCase()
  return keywords.reduce((score, k) => (hay.includes(k) ? score + 18 : score), 0)
}

function inferPriority(text, labels) {
  const hay = text.toLowerCase()
  if (hay.includes('sparks') || hay.includes('fire') || hay.includes('unsafe') || labels.includes('Harassment')) {
    return { level: 'Critical', why: 'Safety-sensitive language detected and immediate risk may be present.' }
  }
  if (hay.includes('urgent') || hay.includes('no water') || hay.includes('power outage') || hay.includes('theft')) {
    return { level: 'High', why: 'Complaint suggests service disruption or time-sensitive issue.' }
  }
  if (labels.includes('Administration') || labels.includes('Mess')) {
    return { level: 'Medium', why: 'Operational issue detected; likely requires standard processing.' }
  }
  return { level: 'Low', why: 'Issue appears localized and non-critical from provided text.' }
}

function inferRouting(labels) {
  let owner = USERS.authorities[2]
  let collaborators = []

  if (labels.includes('Electrical')) {
    owner = USERS.authorities[0]
    collaborators = labels.includes('Hostel') ? [USERS.authorities[1]] : [USERS.authorities[2]]
  } else if (labels.includes('Internet')) {
    owner = USERS.authorities[3]
    collaborators = labels.includes('Hostel') ? [USERS.authorities[1]] : []
  } else if (labels.includes('Security') || labels.includes('Harassment')) {
    owner = USERS.authorities[4]
    collaborators = [USERS.authorities[5]]
  } else if (labels.includes('Administration')) {
    owner = USERS.authorities[5]
  } else if (labels.includes('Hostel')) {
    owner = USERS.authorities[1]
    collaborators = [USERS.authorities[2]]
  }

  return { owner, collaborators }
}

export function predictComplaint({ title = '', description = '', location = {} }) {
  const text = `${title} ${description} ${location.hostel || ''} ${location.building || ''} ${location.room || ''}`.trim()
  const scores = CATEGORY_RULES.map((rule) => ({
    label: rule.label,
    score: Math.min(97, Math.max(18, scoreText(text, rule.keywords) + (Math.random() * 16 + 8))),
  }))
    .sort((a, b) => b.score - a.score)

  let labels = scores.filter((s) => s.score >= 55).slice(0, 3)
  if (!labels.length) labels = scores.slice(0, 2).map((s) => ({ ...s, score: Math.min(s.score, 54) }))

  const chosenLabels = labels.map((l) => l.label)
  if ((location.hostel || '').toLowerCase().includes('hall') && !chosenLabels.includes('Hostel')) {
    chosenLabels.push('Hostel')
    labels = [...labels, { label: 'Hostel', score: 62 }]
  }

  const overall = Math.round(labels.reduce((acc, item) => acc + item.score, 0) / labels.length)
  const priority = inferPriority(text, chosenLabels)
  const routing = inferRouting(chosenLabels)

  return {
    categories: chosenLabels,
    priority,
    assignees: routing,
    confidence: {
      overall,
      threshold: CONFIDENCE_THRESHOLD,
      labels: labels.map((l) => ({ label: l.label, score: Math.round(l.score) })),
      belowThreshold: overall < CONFIDENCE_THRESHOLD,
    },
  }
}
