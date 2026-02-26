import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { studentComplaintsApi } from '@/api/complaints'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { ImageUploader } from '@/components/common/ImageUploader'

const schema = z.object({
  title: z.string().min(5, 'Title is required').max(300),
  description: z.string().min(10, 'Description is required').max(5000),
  area: z.string().min(2, 'Area is required').max(255),
  complaintDate: z.string().min(1, 'Date is required'),
  images: z.array(z.object({
    url: z.string().url(),
    deleteHash: z.string().optional().nullable()
  })).default([]),
})

export default function RaiseComplaintPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [uploadState, setUploadState] = useState([])

  const { control, register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      area: '',
      complaintDate: new Date().toISOString().slice(0, 10),
      images: [],
    },
  })

  const createMutation = useMutation({ mutationFn: studentComplaintsApi.create })
  const uploadedImages = watch('images') || []

  async function onSubmit(values) {
    try {
      const payload = {
        title: values.title,
        description: values.description,
        area: values.area,
        complaintDate: values.complaintDate,
        images: values.images.map(img => ({
          url: img.url.startsWith('/') ? `${window.location.origin}${img.url}` : img.url,
          deleteHash: img.deleteHash || null
        })),
      }
      const complaint = await createMutation.mutateAsync(payload)
      queryClient.setQueryData(['student-complaint', complaint.id], complaint)
      queryClient.invalidateQueries({ queryKey: ['student-complaints'] })
      queryClient.invalidateQueries({ queryKey: ['student-dashboard-kpis'] })
      toast.success('Complaint created successfully')
      navigate(`/student/complaints/${complaint.id}`)
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create complaint')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Raise Complaint" description="Submit complaint details and upload evidence images through the secure backend media endpoint." />
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Complaint Details</CardTitle>
            <CardDescription>AI will classify severity and may suggest a department.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g. Water leakage in hostel corridor" {...register('title')} />
              {errors.title ? <p className="mt-1 text-xs text-rose-700">{errors.title.message}</p> : null}
            </div>
            <div>
              <Label htmlFor="area">Area</Label>
              <Input id="area" placeholder="Hostel A, Block 2" {...register('area')} />
              {errors.area ? <p className="mt-1 text-xs text-rose-700">{errors.area.message}</p> : null}
            </div>
            <div>
              <Label htmlFor="complaintDate">Complaint Date</Label>
              <Controller
                control={control}
                name="complaintDate"
                render={({ field }) => <DatePicker {...field} />}
              />
              {errors.complaintDate ? <p className="mt-1 text-xs text-rose-700">{errors.complaintDate.message}</p> : null}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={6} placeholder="Describe the issue, impact, and urgency." {...register('description')} />
              {errors.description ? <p className="mt-1 text-xs text-rose-700">{errors.description.message}</p> : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Images</CardTitle>
              <CardDescription>Upload images first. Stored URLs will be attached to your complaint.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                value={uploadedImages}
                onChange={(images) => {
                  setUploadState([...images])
                  setValue('images', images.map(img => ({
                    url: img.url,
                    deleteHash: img.deleteHash || null
                  })), { shouldValidate: true })
                }}
              />
              {errors.images && <p className="mt-1 text-xs text-rose-700">{errors.images.message}</p>}
            </CardContent>
          </Card>

          <Card className="border-teal-200 bg-teal-50/40">
            <CardContent className="p-4 text-sm">
              <p className="font-semibold">Submission flow</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
                <li>Complaint saved</li>
                <li>AI severity classification runs</li>
                <li>Department auto-assignment (if suggested) or admin assignment</li>
                <li>Email + 7-day SLA starts after department email is sent</li>
              </ol>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/student/complaints')}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
              {isSubmitting || createMutation.isPending ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
