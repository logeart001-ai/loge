'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { uploadArtwork } from '@/lib/artwork-actions'
import { Loader2, Upload, X, Plus } from 'lucide-react'

interface ArtworkUploadFormProps {
  userId: string
}

export function ArtworkUploadForm({ userId }: ArtworkUploadFormProps) {
  const [state, action, isPending] = useActionState(uploadArtwork, null)
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="tags" value={JSON.stringify(tags)} />
      <input type="hidden" name="category" value={selectedCategory} />

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="title">Artwork Title *</Label>
          <Input
            id="title"
            name="title"
            placeholder="Enter artwork title"
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe your artwork, inspiration, and techniques used..."
            rows={4}
            disabled={isPending}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select onValueChange={setSelectedCategory} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="art_design">Art & Design</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
                <SelectItem value="sculpture">Sculpture</SelectItem>
                <SelectItem value="book">Books</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medium">Medium/Materials</Label>
            <Input
              id="medium"
              name="medium"
              placeholder="e.g., Oil on canvas, Bronze, Digital"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pricing</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (₦) *</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="originalPrice">Original Price (₦)</Label>
            <Input
              id="originalPrice"
              name="originalPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="Leave empty if no discount"
              disabled={isPending}
            />
            <p className="text-xs text-gray-500">
              Set this higher than price to show a discount
            </p>
          </div>
        </div>
      </div>

      {/* Physical Properties */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Physical Properties</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input
              id="dimensions"
              name="dimensions"
              placeholder="e.g., 30x40x5 cm"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              min="0"
              step="0.1"
              placeholder="0.0"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Images</h3>
        
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-6">
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <Label htmlFor="images" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500">
                    Click to upload images
                  </span>
                  <span className="text-gray-600"> or drag and drop</span>
                </Label>
                <Input
                  id="images"
                  name="images"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={isPending}
                />
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB each. First image will be the thumbnail.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Tags</h3>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add tags (e.g., abstract, colorful, modern)"
              disabled={isPending}
            />
            <Button
              type="button"
              onClick={addTag}
              variant="outline"
              disabled={isPending || !currentTag.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-red-500"
                    disabled={isPending}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Availability</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stockQuantity">Stock Quantity</Label>
            <Input
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              min="0"
              defaultValue="1"
              disabled={isPending}
            />
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="isLimitedEdition"
              name="isLimitedEdition"
              className="rounded"
              disabled={isPending}
            />
            <Label htmlFor="isLimitedEdition">Limited Edition</Label>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {state?.error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
          {state.message}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading Artwork...
            </>
          ) : (
            'Upload Artwork'
          )}
        </Button>
        
        <Button type="button" variant="outline" disabled={isPending}>
          Save as Draft
        </Button>
      </div>
    </form>
  )
}