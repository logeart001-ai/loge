import { createClient } from '@/lib/supabase'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
  fileName?: string
  fileSize?: number
}

export class FileUploadService {
  private supabase = createClient()

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File,
    bucket: string,
    path: string,
    options?: {
      upsert?: boolean
      cacheControl?: string
    }
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${path}/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert || false
        })

      if (error) {
        console.error('Upload error:', error)
        return { success: false, error: error.message }
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return {
        success: true,
        url: urlData.publicUrl,
        fileName: fileName,
        fileSize: file.size
      }
    } catch (error) {
      console.error('Upload service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      }
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    bucket: string,
    path: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadFile(files[i], bucket, path)
      results.push(result)
      
      if (onProgress) {
        onProgress(i + 1, files.length)
      }
    }
    
    return results
  }

  /**
   * Upload submission media files
   */
  async uploadSubmissionMedia(
    submissionId: string,
    files: {
      images: File[]
      videos: File[]
      audio: File[]
      documents: File[]
    },
    onProgress?: (type: string, completed: number, total: number) => void
  ): Promise<{
    images: UploadResult[]
    videos: UploadResult[]
    audio: UploadResult[]
    documents: UploadResult[]
  }> {
    const results = {
      images: [] as UploadResult[],
      videos: [] as UploadResult[],
      audio: [] as UploadResult[],
      documents: [] as UploadResult[]
    }

    // Upload images
    if (files.images.length > 0) {
      results.images = await this.uploadMultipleFiles(
        files.images,
        'submission-media',
        `${submissionId}/images`,
        (completed, total) => onProgress?.('images', completed, total)
      )
    }

    // Upload videos
    if (files.videos.length > 0) {
      results.videos = await this.uploadMultipleFiles(
        files.videos,
        'submission-media',
        `${submissionId}/videos`,
        (completed, total) => onProgress?.('videos', completed, total)
      )
    }

    // Upload audio
    if (files.audio.length > 0) {
      results.audio = await this.uploadMultipleFiles(
        files.audio,
        'submission-media',
        `${submissionId}/audio`,
        (completed, total) => onProgress?.('audio', completed, total)
      )
    }

    // Upload documents
    if (files.documents.length > 0) {
      results.documents = await this.uploadMultipleFiles(
        files.documents,
        'submission-media',
        `${submissionId}/documents`,
        (completed, total) => onProgress?.('documents', completed, total)
      )
    }

    return results
  }

  /**
   * Save media records to database
   */
  async saveMediaRecords(
    submissionId: string,
    uploadResults: {
      images: UploadResult[]
      videos: UploadResult[]
      audio: UploadResult[]
      documents: UploadResult[]
    }
  ): Promise<boolean> {
    try {
      const mediaRecords = []

      // Process images
      uploadResults.images.forEach((result, index) => {
        if (result.success && result.url) {
          mediaRecords.push({
            submission_id: submissionId,
            file_type: 'image',
            file_category: `frame_${index + 1}`,
            file_url: result.url,
            file_name: result.fileName,
            file_size: result.fileSize,
            display_order: index,
            is_primary: index === 0
          })
        }
      })

      // Process videos
      uploadResults.videos.forEach((result, index) => {
        if (result.success && result.url) {
          mediaRecords.push({
            submission_id: submissionId,
            file_type: 'video',
            file_category: 'video_explanation',
            file_url: result.url,
            file_name: result.fileName,
            file_size: result.fileSize,
            display_order: index
          })
        }
      })

      // Process audio
      uploadResults.audio.forEach((result, index) => {
        if (result.success && result.url) {
          mediaRecords.push({
            submission_id: submissionId,
            file_type: 'audio',
            file_category: 'audio_excerpt',
            file_url: result.url,
            file_name: result.fileName,
            file_size: result.fileSize,
            display_order: index
          })
        }
      })

      // Process documents
      uploadResults.documents.forEach((result, index) => {
        if (result.success && result.url) {
          mediaRecords.push({
            submission_id: submissionId,
            file_type: 'document',
            file_category: 'manuscript',
            file_url: result.url,
            file_name: result.fileName,
            file_size: result.fileSize,
            display_order: index
          })
        }
      })

      if (mediaRecords.length > 0) {
        const { error } = await this.supabase
          .from('submission_media')
          .insert(mediaRecords)

        if (error) {
          console.error('Error saving media records:', error)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error in saveMediaRecords:', error)
      return false
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 50MB' }
    }

    // Check file type
    const allowedTypes = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'],
      audio: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }

    const allAllowedTypes = Object.values(allowedTypes).flat()
    if (!allAllowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported' }
    }

    return { valid: true }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path])

      if (error) {
        console.error('Delete error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Delete service error:', error)
      return false
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService()