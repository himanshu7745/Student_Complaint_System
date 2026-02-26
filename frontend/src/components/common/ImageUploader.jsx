import { useMemo, useState, useRef } from 'react'
import { Upload, X, ImageIcon, ImagePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadsApi } from '@/api/uploads'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function ImageUploader({ value = [], onChange, max = 5 }) {
  const [localFiles, setLocalFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const inputRef = useRef(null)

  const previews = useMemo(() => localFiles.map((file) => ({
    name: file.name,
    url: URL.createObjectURL(file),
    local: true,
  })), [localFiles])

  const merged = [...value.map((img) => ({ ...img, local: false })), ...previews]

  async function handleUpload() {
    if (!localFiles.length) return
    try {
      setIsUploading(true)
      const response = await uploadsApi.uploadImages(localFiles)
      const uploadedImages = response?.images || []
      if (!Array.isArray(uploadedImages) || uploadedImages.length === 0) {
        throw new Error('Upload completed but no image URLs were returned')
      }
      onChange?.([...(value || []), ...uploadedImages])
      toast.success(`${localFiles.length} image(s) uploaded successfully!`)
      setLocalFiles([])
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      const validationErrors = error?.response?.data?.data
      const validationDetail = validationErrors && typeof validationErrors === 'object'
        ? Object.values(validationErrors).join(', ')
        : null
      toast.error(apiMessage || validationDetail || error?.message || 'Image upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleFiles(filesArray) {
    const validFiles = filesArray.filter(file => file.type.startsWith('image/'))
    if (validFiles.length !== filesArray.length) {
      toast.error('Only image files are allowed')
    }
    const total = (value?.length || 0) + localFiles.length + validFiles.length
    if (total > max) {
      toast.error(`Maximum ${max} images allowed`)
      return
    }
    setLocalFiles((prev) => [...prev, ...validFiles])
  }

  function handleFileSelect(event) {
    handleFiles(Array.from(event.target.files || []))
    // Reset input to allow selecting the same file again if it was removed
    if (inputRef.current) inputRef.current.value = ''
  }

  function onDragOver(e) {
    e.preventDefault()
    setIsDragActive(true)
  }

  function onDragLeave(e) {
    e.preventDefault()
    setIsDragActive(false)
  }

  function onDrop(e) {
    e.preventDefault()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
      e.dataTransfer.clearData()
    }
  }

  function removeUploaded(index) {
    const next = [...value]
    next.splice(index, 1)
    onChange?.(next)
  }

  function removeLocal(index) {
    setLocalFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn(
          "overflow-hidden border-2 border-dashed transition-all duration-300 ease-out",
          isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border bg-white/40 hover:bg-white/60 hover:border-primary/50",
          "backdrop-blur-xl shadow-sm hover:shadow-md"
        )}>
          <CardContent className="p-0">
            <label 
              className="flex cursor-pointer flex-col items-center justify-center gap-4 p-8 text-center min-h-[220px]"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <motion.div 
                className={cn(
                  "rounded-full p-4 transition-colors duration-300",
                  isDragActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}
                animate={{ scale: isDragActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {isDragActive ? <ImagePlus className="h-8 w-8" /> : <Upload className="h-8 w-8" />}
              </motion.div>
              
              <div className="space-y-1">
                <p className="text-lg font-semibold tracking-tight">
                  {isDragActive ? "Drop images here" : "Click or drag images to upload"}
                </p>
                <p className="text-sm text-muted-foreground w-64 mx-auto balance-text">
                  Supports JPG, PNG, and WEBP. You can upload up to <span className="font-medium text-foreground">{max}</span> images.
                </p>
              </div>
              <input 
                ref={inputRef} 
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                multiple 
                className="hidden" 
                onChange={handleFileSelect} 
              />
            </label>
            
            <AnimatePresence>
              {localFiles.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-between items-center bg-muted/60 px-6 py-4 border-t"
                >
                  <span className="text-sm font-medium">
                    {localFiles.length} file(s) ready
                  </span>
                  <Button 
                    type="button" 
                    onClick={handleUpload} 
                    disabled={isUploading}
                    className="relative overflow-hidden shadow-md transition-all hover:shadow-lg"
                  >
                    <AnimatePresence mode="wait">
                      {isUploading ? (
                        <motion.div 
                          key="uploading"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center gap-2"
                        >
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="upload"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          Upload Selected
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {merged.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
          >
            {merged.map((item, index) => (
              <motion.div 
                key={`${item.url || item.name}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 25, delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {item.url ? (
                  <img 
                    src={item.url} 
                    alt={item.name || `Upload ${index + 1}`} 
                    className={cn(
                      "h-32 w-full object-cover transition-transform duration-500",
                      item.local ? "opacity-70 grayscale-[30%]" : "group-hover:scale-110"
                    )} 
                  />
                ) : (
                  <div className="grid h-32 place-items-center bg-muted/30">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                
                {item.local && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="truncate text-xs text-white/90">Ready to upload</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    item.local ? removeLocal(index - (value?.length || 0)) : removeUploaded(index)
                  }}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-md opacity-0 transition-all hover:bg-destructive hover:scale-110 focus:opacity-100 group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
