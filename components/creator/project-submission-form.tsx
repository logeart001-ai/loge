'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Image, Video, FileText, Palette, BookOpen, Shirt } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface ProjectSubmissionFormProps {
  creatorType: 'artist' | 'writer' | 'fashion_designer'
}

interface FormData {
  // Basic project info
  title: string
  theme: string
  description: string
  cultural_reference: string
  tagline: string
  price: string
  currency: string
  availability_status: string
  quantity_available: string

  // Artist-specific
  medium?: string
  dimensions?: string
  edition_number?: string
  edition_total?: string
  date_created?: string
  materials?: string[]
  techniques?: string[]

  // Writer-specific
  genre?: string
  format?: string
  word_count?: string
  page_count?: string
  language?: string
  isbn?: string
  publication_date?: string

  // Fashion-specific
  collection_name?: string
  work_type?: string
  fabric_materials?: string[]
  sizes_available?: string[]
  color_options?: string[]
  production_time_days?: string

  // Agreements
  original_work_confirmed: boolean
  terms_agreed: boolean
}

export function ProjectSubmissionForm({ creatorType }: ProjectSubmissionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    theme: '',
    description: '',
    cultural_reference: '',
    tagline: '',
    price: '',
    currency: 'NGN',
    availability_status: 'for_sale',
    quantity_available: '1',
    materials: [],
    techniques: [],
    fabric_materials: [],
    sizes_available: [],
    color_options: [],
    original_work_confirmed: false,
    terms_agreed: false
  })

  const [loading, setLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{
    images: File[]
    videos: File[]
    audio: File[]
    documents: File[]
  }>({
    images: [],
    videos: [],
    audio: [],
    documents: []
  })

  const supabase = createClient()

  const getFormTitle = () => {
    switch (creatorType) {
      case 'artist':
        return 'Artist Project Submission'
      case 'writer':
        return 'Writer & Author Submission'
      case 'fashion_designer':
        return 'Fashion & Textile Designer Submission'
      default:
        return 'Project Submission'
    }
  }

  const getFormIcon = () => {
    switch (creatorType) {
      case 'artist':
        return <Palette className="w-6 h-6" />
      case 'writer':
        return <BookOpen className="w-6 h-6" />
      case 'fashion_designer':
        return <Shirt className="w-6 h-6" />
      default:
        return <FileText className="w-6 h-6" />
    }
  }

  const handleFileUpload = (type: 'images' | 'videos' | 'audio' | 'documents', files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files)
    
    // Validate files
    const validFiles = fileArray.filter(file => {
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 50MB.`)
        return false
      }
      return true
    })
    
    setUploadedFiles(prev => ({
      ...prev,
      [type]: [...prev[type], ...validFiles]
    }))
  }

  const removeFile = (type: 'images' | 'videos' | 'audio' | 'documents', index: number) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const handleArrayInput = (field: keyof FormData, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(item => item !== '')
    setFormData(prev => ({ ...prev, [field]: array }))
  }

  const submitProject = async () => {
    if (!formData.original_work_confirmed || !formData.terms_agreed) {
      alert('Please confirm the agreements before submitting')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create main submission
      const { data: submission, error: submissionError } = await supabase
        .from('project_submissions')
        .insert({
          creator_id: user.id,
          creator_type: creatorType,
          title: formData.title,
          theme: formData.theme,
          description: formData.description,
          cultural_reference: formData.cultural_reference,
          tagline: formData.tagline,
          price: parseFloat(formData.price) || null,
          currency: formData.currency,
          availability_status: formData.availability_status,
          quantity_available: parseInt(formData.quantity_available) || 1,
          original_work_confirmed: formData.original_work_confirmed,
          terms_agreed: formData.terms_agreed,
          status: 'submitted',
          submission_date: new Date().toISOString()
        })
        .select()
        .single()

      if (submissionError) throw submissionError

      // Upload files if any
      if (Object.values(uploadedFiles).some(files => files.length > 0)) {
        const { fileUploadService } = await import('@/lib/file-upload')
        
        const uploadResults = await fileUploadService.uploadSubmissionMedia(
          submission.id,
          uploadedFiles,
          (type, completed, total) => {
            console.log(`Uploading ${type}: ${completed}/${total}`)
          }
        )

        // Save media records to database
        await fileUploadService.saveMediaRecords(submission.id, uploadResults)
      }

      // Create type-specific submission
      if (creatorType === 'artist') {
        await supabase
          .from('artist_submissions')
          .insert({
            submission_id: submission.id,
            medium: formData.medium,
            dimensions: formData.dimensions,
            edition_number: formData.edition_number ? parseInt(formData.edition_number) : null,
            edition_total: formData.edition_total ? parseInt(formData.edition_total) : null,
            date_created: formData.date_created || null,
            materials: formData.materials,
            techniques: formData.techniques
          })
      } else if (creatorType === 'writer') {
        await supabase
          .from('writer_submissions')
          .insert({
            submission_id: submission.id,
            genre: formData.genre,
            format: formData.format,
            word_count: formData.word_count ? parseInt(formData.word_count) : null,
            page_count: formData.page_count ? parseInt(formData.page_count) : null,
            language: formData.language || 'English',
            isbn: formData.isbn,
            publication_date: formData.publication_date || null
          })
      } else if (creatorType === 'fashion_designer') {
        await supabase
          .from('fashion_submissions')
          .insert({
            submission_id: submission.id,
            collection_name: formData.collection_name,
            work_type: formData.work_type,
            fabric_materials: formData.fabric_materials,
            sizes_available: formData.sizes_available,
            color_options: formData.color_options,
            production_time_days: formData.production_time_days ? parseInt(formData.production_time_days) : null
          })
      }

      // Send confirmation email
      const { emailService } = await import('@/lib/email-service')
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      if (profileData) {
        await emailService.sendSubmissionConfirmation(profileData.email, {
          creatorName: profileData.full_name,
          submissionTitle: formData.title,
          submissionId: submission.id,
          reviewDate: new Date().toISOString()
        })
      }

      alert('Project submitted successfully! You will receive a confirmation email shortly.')
      
      // Reset form
      setFormData({
        title: '',
        theme: '',
        description: '',
        cultural_reference: '',
        tagline: '',
        price: '',
        currency: 'NGN',
        availability_status: 'for_sale',
        quantity_available: '1',
        materials: [],
        techniques: [],
        fabric_materials: [],
        sizes_available: [],
        color_options: [],
        original_work_confirmed: false,
        terms_agreed: false
      })
      setUploadedFiles({ images: [], videos: [], audio: [], documents: [] })

    } catch (error) {
      console.error('Error submitting project:', error)
      alert('Error submitting project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getFormIcon()}
            {getFormTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="submit">Submit</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Title of your work"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Input
                    id="theme"
                    value={formData.theme}
                    onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                    placeholder="e.g., Afrofuturism, Heritage, Urban Stories"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your work..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="cultural_reference">Cultural Reference / Inspiration</Label>
                <Textarea
                  id="cultural_reference"
                  value={formData.cultural_reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, cultural_reference: e.target.value }))}
                  placeholder="Which African heritage, symbol, or philosophy inspired this piece?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tagline">Tagline / Quote</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="A one-liner that captures your work"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="availability_status">Availability</Label>
                  <Select
                    value={formData.availability_status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, availability_status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="for_sale">For Sale</SelectItem>
                      <SelectItem value="auction">Auction</SelectItem>
                      <SelectItem value="showcase_only">Showcase Only</SelectItem>
                      <SelectItem value="pre_order">Pre-order</SelectItem>
                      <SelectItem value="made_to_order">Made to Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Type-specific Details Tab */}
            <TabsContent value="details" className="space-y-4">
              {creatorType === 'artist' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="medium">Medium</Label>
                      <Input
                        id="medium"
                        value={formData.medium || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, medium: e.target.value }))}
                        placeholder="e.g., Oil on canvas, Digital collage"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dimensions">Dimensions</Label>
                      <Input
                        id="dimensions"
                        value={formData.dimensions || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                        placeholder="e.g., 24x36 inches"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edition_number">Edition Number</Label>
                      <Input
                        id="edition_number"
                        type="number"
                        value={formData.edition_number || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, edition_number: e.target.value }))}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edition_total">Total in Edition</Label>
                      <Input
                        id="edition_total"
                        type="number"
                        value={formData.edition_total || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, edition_total: e.target.value }))}
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date_created">Date Created</Label>
                      <Input
                        id="date_created"
                        type="date"
                        value={formData.date_created || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, date_created: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="materials">Materials (comma-separated)</Label>
                      <Input
                        id="materials"
                        value={formData.materials?.join(', ') || ''}
                        onChange={(e) => handleArrayInput('materials', e.target.value)}
                        placeholder="oil paint, canvas, wood"
                      />
                    </div>
                    <div>
                      <Label htmlFor="techniques">Techniques (comma-separated)</Label>
                      <Input
                        id="techniques"
                        value={formData.techniques?.join(', ') || ''}
                        onChange={(e) => handleArrayInput('techniques', e.target.value)}
                        placeholder="impasto, glazing, layering"
                      />
                    </div>
                  </div>
                </>
              )}

              {creatorType === 'writer' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="genre">Genre</Label>
                      <Select
                        value={formData.genre || ''}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, genre: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fiction">Fiction</SelectItem>
                          <SelectItem value="non-fiction">Non-fiction</SelectItem>
                          <SelectItem value="poetry">Poetry</SelectItem>
                          <SelectItem value="drama">Drama</SelectItem>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="children">Children's Literature</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="format">Format</Label>
                      <Select
                        value={formData.format || ''}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="book">Book</SelectItem>
                          <SelectItem value="short_story">Short Story</SelectItem>
                          <SelectItem value="poetry_collection">Poetry Collection</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="manuscript">Manuscript in Progress</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="word_count">Word Count</Label>
                      <Input
                        id="word_count"
                        type="number"
                        value={formData.word_count || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, word_count: e.target.value }))}
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="page_count">Page Count</Label>
                      <Input
                        id="page_count"
                        type="number"
                        value={formData.page_count || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, page_count: e.target.value }))}
                        placeholder="200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Input
                        id="language"
                        value={formData.language || 'English'}
                        onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                        placeholder="English"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="isbn">ISBN (optional)</Label>
                      <Input
                        id="isbn"
                        value={formData.isbn || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                        placeholder="978-0-123456-78-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="publication_date">Publication Date</Label>
                      <Input
                        id="publication_date"
                        type="date"
                        value={formData.publication_date || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, publication_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}

              {creatorType === 'fashion_designer' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="collection_name">Collection Name</Label>
                      <Input
                        id="collection_name"
                        value={formData.collection_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, collection_name: e.target.value }))}
                        placeholder="Collection or project name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="work_type">Type of Work</Label>
                      <Select
                        value={formData.work_type || ''}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, work_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apparel">Apparel</SelectItem>
                          <SelectItem value="textile">Textile</SelectItem>
                          <SelectItem value="accessories">Accessories</SelectItem>
                          <SelectItem value="footwear">Footwear</SelectItem>
                          <SelectItem value="jewelry">Jewelry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fabric_materials">Fabric/Materials (comma-separated)</Label>
                      <Input
                        id="fabric_materials"
                        value={formData.fabric_materials?.join(', ') || ''}
                        onChange={(e) => handleArrayInput('fabric_materials', e.target.value)}
                        placeholder="cotton, silk, Ankara, adire"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sizes_available">Sizes Available (comma-separated)</Label>
                      <Input
                        id="sizes_available"
                        value={formData.sizes_available?.join(', ') || ''}
                        onChange={(e) => handleArrayInput('sizes_available', e.target.value)}
                        placeholder="S, M, L, XL, custom"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="color_options">Color Options (comma-separated)</Label>
                      <Input
                        id="color_options"
                        value={formData.color_options?.join(', ') || ''}
                        onChange={(e) => handleArrayInput('color_options', e.target.value)}
                        placeholder="red, blue, multicolor"
                      />
                    </div>
                    <div>
                      <Label htmlFor="production_time_days">Production Time (days)</Label>
                      <Input
                        id="production_time_days"
                        type="number"
                        value={formData.production_time_days || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, production_time_days: e.target.value }))}
                        placeholder="7"
                      />
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Media Upload Tab */}
            <TabsContent value="media" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Images */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Image className="w-4 h-4" />
                    Images (3 frames suggested)
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload('images', e.target.files)}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Frame 1: Clean product shot<br/>
                      Frame 2: In context/styled<br/>
                      Frame 3: Creator with work
                    </p>
                  </div>
                  {uploadedFiles.images.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uploadedFiles.images.map((file, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{file.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile('images', index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Videos */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Video className="w-4 h-4" />
                    Video (30-60 seconds)
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload('videos', e.target.files)}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Short video explaining your piece
                    </p>
                  </div>
                  {uploadedFiles.videos.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {uploadedFiles.videos.map((file, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{file.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile('videos', index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Audio (for writers) */}
                {creatorType === 'writer' && (
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4" />
                      Audio Excerpt
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileUpload('audio', e.target.files)}
                        className="w-full"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        Author reading a paragraph/poem
                      </p>
                    </div>
                  </div>
                )}

                {/* Documents (for writers) */}
                {creatorType === 'writer' && (
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4" />
                      Manuscript/Document
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload('documents', e.target.files)}
                        className="w-full"
                      />
                      <p className="text-sm text-gray-500 mt-2">
                        PDF or Word document
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Submit Tab */}
            <TabsContent value="submit" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="original_work"
                    checked={formData.original_work_confirmed}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, original_work_confirmed: checked as boolean }))
                    }
                  />
                  <Label htmlFor="original_work">
                    ✅ I confirm this is my original creation
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms_agreed"
                    checked={formData.terms_agreed}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, terms_agreed: checked as boolean }))
                    }
                  />
                  <Label htmlFor="terms_agreed">
                    ✅ I agree to L'oge Arts' submission terms
                  </Label>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-2">Review Process</h3>
                <p className="text-orange-800 text-sm">
                  Your submission will be reviewed by our team within 3-5 business days. 
                  You'll receive an email notification with the review results and any feedback.
                </p>
              </div>

              <Button
                onClick={submitProject}
                disabled={loading || !formData.original_work_confirmed || !formData.terms_agreed}
                className="w-full"
                size="lg"
              >
                {loading ? 'Submitting...' : 'Submit Project for Review'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}