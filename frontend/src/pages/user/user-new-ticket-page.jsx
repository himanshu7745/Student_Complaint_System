import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock3 } from 'lucide-react'
import { BUILDINGS, HOSTELS } from '@/lib/constants'
import { useAppStore } from '@/store/app-store'
import { useToast } from '@/components/ui/toast'
import { loadDraft, useDraftStatus } from '@/hooks/use-draft-status'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { AttachmentDropzone } from '@/components/common/attachment-dropzone'
import { Progress } from '@/components/ui/progress'

const DRAFT_KEY = 'complaint-form-draft-v1'

const defaultForm = {
  title: '',
  description: '',
  location: { hostel: '', building: '', room: '' },
  preferredVisitSlot: '',
  anonymous: false,
  attachments: [],
  sendToManualReview: false,
}

const FIELD_LABELS = {
  title: 'Title',
  description: 'Description',
  building: 'Building',
  room: 'Room / Area',
}

export default function UserNewTicketPage() {
  const navigate = useNavigate()
  const { createTicket } = useAppStore()
  const { toast } = useToast()

  const [form, setForm] = useState(() => {
    const draft = loadDraft(DRAFT_KEY, defaultForm)
    return { ...draft, attachments: [] }
  })
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const draftStatus = useDraftStatus(
    {
      ...form,
      attachments: (form.attachments || []).map((f) => ({
        name: f?.name,
        size: f?.size,
        type: f?.type,
      })),
    },
    DRAFT_KEY,
  )

  const errors = useMemo(() => {
    const next = {}
    if (!form.title.trim()) next.title = 'Title is required.'
    if (!form.description.trim()) next.description = 'Description is required.'
    if (form.description.trim().length > 0 && form.description.trim().length < 20) next.description = 'Please provide more detail (min 20 characters).'
    if (!form.location.building.trim()) next.building = 'Building is required.'
    if (!form.location.room.trim()) next.room = 'Room/area is required.'
    return next
  }, [form])

  const isValid = Object.keys(errors).length === 0
  const charCount = form.description.length

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const setLocation = (key, value) => setForm((prev) => ({ ...prev, location: { ...prev.location, [key]: value } }))

  const submit = async (e) => {
    e.preventDefault()
    setTouched({ title: true, description: true, building: true, room: true })
    if (submitting) return
    if (!isValid) {
      const missing = Object.keys(errors)
        .map((key) => FIELD_LABELS[key] || key)
        .join(', ')
      toast({
        title: 'Fill all required details',
        description: missing ? `Please complete: ${missing}.` : 'Please review the form and try again.',
        variant: 'warning',
      })
      return
    }

    setSubmitting(true)
    try {
      const ticket = await createTicket({
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location,
        attachments: form.attachments,
        preferredVisitSlot: form.preferredVisitSlot,
        anonymous: form.anonymous,
      })
      localStorage.removeItem(DRAFT_KEY)
      toast({
        title: 'Complaint submitted',
        description: `Ticket ${ticket.id} created successfully.`,
        variant: 'success',
      })
      navigate(`/user/tickets/${ticket.id}`)
    } catch (error) {
      toast({
        title: 'Unable to submit complaint',
        description: error?.message || 'Please try again.',
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Raise Complaint"
        description="Describe the issue with enough detail for faster routing and resolution. Drafts are saved automatically."
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            {draftStatus === 'saving' ? <Clock3 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
            {draftStatus === 'saving' ? 'Saving draft...' : draftStatus === 'error' ? 'Draft save unavailable' : 'Draft saved'}
          </div>
        }
      />

      <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complaint Details</CardTitle>
              <CardDescription>Required fields are validated inline. Drafts autosave locally.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
                  placeholder="e.g., Sparks from switchboard in hostel room"
                />
                {touched.title && errors.title ? <p className="text-xs text-red-600">{errors.title}</p> : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <span className="text-xs text-slate-500">{charCount}/1200</span>
                </div>
                <Textarea
                  id="description"
                  value={form.description}
                  maxLength={1200}
                  onChange={(e) => setField('description', e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                  placeholder="Describe what happened, where, when, and any safety concerns."
                  className="min-h-[140px]"
                />
                <Progress value={Math.min(100, (charCount / 1200) * 100)} className="h-1" indicatorClassName="bg-slate-300" />
                {touched.description && errors.description ? <p className="text-xs text-red-600">{errors.description}</p> : null}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Hostel (optional)</Label>
                  <Select value={form.location.hostel} onChange={(e) => setLocation('hostel', e.target.value)}>
                    <option value="">Select hostel</option>
                    {HOSTELS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Building</Label>
                  <Select
                    value={form.location.building}
                    onChange={(e) => setLocation('building', e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, building: true }))}
                  >
                    <option value="">Select building</option>
                    {BUILDINGS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                  {touched.building && errors.building ? <p className="text-xs text-red-600">{errors.building}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label>Room / Area</Label>
                  <Input
                    value={form.location.room}
                    onChange={(e) => setLocation('room', e.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, room: true }))}
                    placeholder="204 / Corridor / Lab 2"
                  />
                  {touched.room && errors.room ? <p className="text-xs text-red-600">{errors.room}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Attachments</Label>
                <AttachmentDropzone files={form.attachments} onFilesChange={(files) => setField('attachments', files)} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Preferred Visit Slot (optional)</Label>
                  <Input
                    value={form.preferredVisitSlot}
                    onChange={(e) => setField('preferredVisitSlot', e.target.value)}
                    placeholder="e.g., Today 4–6 PM"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anonymous (optional)</Label>
                  <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-white px-3">
                    <span className="text-sm text-slate-700">Hide my identity from public thread</span>
                    <Switch checked={form.anonymous} onCheckedChange={(value) => setField('anonymous', value)} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-soft backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                <span className="font-medium text-slate-800">Submit State:</span>{' '}
                {isValid ? 'Ready to submit' : 'Complete required fields to continue'}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </Button>
              </div>
            </div>
          </div>
      </form>
    </div>
  )
}
