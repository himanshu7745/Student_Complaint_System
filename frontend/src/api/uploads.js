import { api, unwrap } from './client'

export const uploadsApi = {
  uploadImages(files) {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    // Let the browser/axios set the multipart boundary automatically.
    return api.post('/api/uploads/images', formData).then(unwrap)
  },
}
