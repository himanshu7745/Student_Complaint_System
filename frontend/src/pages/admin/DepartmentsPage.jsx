import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { departmentsApi } from '@/api/departments'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'

const emptyForm = { name: '', authorityEmail: '' }

export default function DepartmentsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const queryClient = useQueryClient()

  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: departmentsApi.list })

  const createMutation = useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => {
      toast.success('Department created')
      setOpen(false)
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Create failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => departmentsApi.update(id, payload),
    onSuccess: () => {
      toast.success('Department updated')
      setOpen(false)
      setEditing(null)
      setForm(emptyForm)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Update failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: departmentsApi.remove,
    onSuccess: () => {
      toast.success('Department deleted')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Delete failed (it may be referenced by complaints)'),
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(dep) {
    setEditing(dep)
    setForm({ name: dep.name, authorityEmail: dep.authorityEmail })
    setOpen(true)
  }

  function submit() {
    const payload = { name: form.name.trim(), authorityEmail: form.authorityEmail.trim() }
    if (!payload.name || !payload.authorityEmail) {
      toast.error('Name and authority email are required')
      return
    }
    if (editing) updateMutation.mutate({ id: editing.id, payload })
    else createMutation.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Department Management" description="Configure departments and authority email addresses used for complaint assignment emails." action={<Button onClick={openCreate}>Add Department</Button>} />

      {departmentsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : departmentsQuery.isError ? (
        <ErrorState description="Failed to load departments" onRetry={departmentsQuery.refetch} />
      ) : !departmentsQuery.data?.length ? (
        <EmptyState title="No departments configured" description="Add departments so AI/admin assignments can send emails to authority addresses." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departmentsQuery.data.map((dep) => (
            <Card key={dep.id} className="animate-fade-up">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span>{dep.name}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{dep.id.slice(0, 8)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Authority Email</p>
                  <p className="break-all text-sm font-medium">{dep.authorityEmail}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="w-full" onClick={() => openEdit(dep)}>Edit</Button>
                  <Button variant="destructive" className="w-full" onClick={() => deleteMutation.mutate(dep.id)} disabled={deleteMutation.isPending}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Department' : 'Create Department'}</DialogTitle>
            <DialogDescription>Configure name and department authority email used for complaint notification workflow.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Electrical" />
            </div>
            <div>
              <Label>Authority Email</Label>
              <Input type="email" value={form.authorityEmail} onChange={(e) => setForm((prev) => ({ ...prev, authorityEmail: e.target.value }))} placeholder="electrical.authority@college.edu" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editing ? 'Update Department' : 'Create Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
