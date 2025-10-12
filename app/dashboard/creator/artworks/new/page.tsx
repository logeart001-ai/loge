'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Upload, X, Plus } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface ArtworkFormData {
  title: string
  description: string
  category: string
  price: string
  currency: string
  dimensions: string
  materials: string[]
  techniques: string[]
  year_created: string
  is_original: boolean
  edition_size: string
  tags: string[]
}

export default function NewArtworkPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [formData, setFormData] = useState<ArtworkFormData>({
    title: '',
    description: '',
    category: '',
    price: '',
    currency: 'NGN',
    dimensions: '',
    materials: [],
    techniques: [],
    year_created: new Date().getFullYear().toString(),
    is_original: true,
    edition_size: '',
    tags: []
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validImages = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isImage && isValidSize
    })
    
    if (validImages.length !== files.length) {
      alert('Some files were skipped. Please upload only images under 10MB.')
    }
    
    setImages(prev => [...prev, ...validImages].slice(0, 5)) // Max 5 images
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleArrayInput = (field: keyof ArtworkFormData, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(Boolean)
    setFormData(prev => ({ ...prev, [field]: array }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.category || !formData.price) {
      alert('Please fill in all required fields')
      return
    }
    
    if (images.length === 0) {
      alert('Please upload at least one image')
      return
    }

    setLoading(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Please sign in to upload artwork')
        return
      }

      // For now, we'll create the artwork record without actual file upload
      // In production, you'd upload files to Supabase Storage first
      const imageUrls = images.map((_, index) => `/placeholder-artwork-${index + 1}.jpg`)

      const { data: artwork, error } = await supabase
        .from('artworks')
        .insert({
          creator_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          currency: formData.currency,
          dimensions: formData.dimensions ? JSON.stringify({ description: formData.dimensions }) : null,
          materials: formData.materials,
          techniques: formData.techniques,
          year_created: parseInt(formData.year_created) || null,
          is_original: formData.is_original,
          edition_size: formData.edition_size ? parseInt(formData.edition_size) : null,
          image_urls: imageUrls,
          thumbnail_url: imageUrls[0],
          tags: formData.tags,
          is_available: true,
          views_count: 0,
          likes_count: 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating artwork:', error)
        alert('Failed to create artwork. Please try again.')
        return
      }

      alert('Artwork uploaded successfully!')
      router.push('/dashboard/creator/artworks')
      
    } catch (error) {
      console.error('Error uploading artwork:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/creator/artworks">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Artworks
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Upload New Artwork</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter artwork title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="painting">Painting</SelectItem>
                      <SelectItem value="sculpture">Sculpture</SelectItem>
                      <SelectItem value="digital_art">Digital Art</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="mixed_media">Mixed Media</SelectItem>
                      <SelectItem value="textile">Textile Art</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your artwork..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    required
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
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year_created">Year Created</Label>
                  <Input
                    id="year_created"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.year_created}
                    onChange={(e) => setFormData(prev => ({ ...prev, year_created: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Upload up to 5 images (max 10MB each)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
                        <span>Choose Images</span>
                      </Button>
                    </Label>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dimensions">Dimensions</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={(e) => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                    placeholder="e.g., 24 x 36 inches"
                  />
                </div>
                <div>
                  <Label htmlFor="edition_size">Edition Size (if limited)</Label>
                  <Input
                    id="edition_size"
                    type="number"
                    min="1"
                    value={formData.edition_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, edition_size: e.target.value }))}
                    placeholder="e.g., 100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="materials">Materials (comma-separated)</Label>
                  <Input
                    id="materials"
                    value={formData.materials.join(', ')}
                    onChange={(e) => handleArrayInput('materials', e.target.value)}
                    placeholder="e.g., oil paint, canvas, wood"
                  />
                </div>
                <div>
                  <Label htmlFor="techniques">Techniques (comma-separated)</Label>
                  <Input
                    id="techniques"
                    value={formData.techniques.join(', ')}
                    onChange={(e) => handleArrayInput('techniques', e.target.value)}
                    placeholder="e.g., impasto, glazing, layering"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleArrayInput('tags', e.target.value)}
                  placeholder="e.g., abstract, colorful, modern"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/creator/artworks">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
              {loading ? 'Uploading...' : 'Upload Artwork'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}