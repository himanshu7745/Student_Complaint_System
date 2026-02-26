import { useMemo, useRef, useState } from 'react'
import { Paperclip, Upload, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AttachmentDropzone({ files = [], onFilesChange, compact = false, accept = 'image/*,.pdf,video/*' }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const normalizedFiles = useMemo(
    () => files.map((f, idx) => ({ id: f.id || `${f.name}-${idx}`, name: f.name, size: f.size || f.sizeKb * 1024 || 0, ...f })),
    [files],
  )

  const pushFiles = (list) => {
    const parsed = Array.from(list || []).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      type: file.type || 'file',
      file,
    }))
    if (!parsed.length) return
    const merged = [...(files || []), ...parsed]
    const deduped = merged.filter((file, index, arr) => arr.findIndex((f) => f.id === file.id) === index)
    onFilesChange?.(deduped)
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeFile = (id) => onFilesChange?.(normalizedFiles.filter((file) => file.id !== id))

  return (
    <div className="space-y-3">
      <Card
        className={cn(
          'border-dashed p-4 transition',
          dragging ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-slate-50/40',
          compact ? 'rounded-xl' : 'rounded-2xl',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false) }}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          pushFiles(e.dataTransfer.files)
        }}
      >
        <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
          <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <Upload className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-800">Drag & drop attachments</div>
            <div className="mt-1 text-xs text-slate-500">PNG, JPG, PDF, MP4 up to 10MB</div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <Paperclip className="h-4 w-4" />
            Browse Files
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            className="hidden"
            onChange={(e) => {
              pushFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </Card>
      {normalizedFiles.length ? (
        <div className="space-y-2">
          {normalizedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-800">{file.name}</div>
                <div className="text-xs text-slate-500">{Math.max(1, Math.round((file.size || 0) / 1024))} KB</div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
