'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface BlogSearchProps {
  onSearch?: (query: string, tags: string[]) => void
}

const popularTags = [
  'contemporary art',
  'african art',
  'cultural identity',
  'fashion',
  'traditional crafts',
  'mixed media',
  'urban art',
  'sustainability',
  'global market',
  'innovation'
]

export function BlogSearch({ onSearch }: BlogSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    setSelectedTags(tags)
  }, [searchParams])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
    
    router.push(`/blog?${params.toString()}`)
    onSearch?.(query, selectedTags)
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setQuery('')
    setSelectedTags([])
    router.push('/blog')
    onSearch?.('', [])
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-10 pr-4 py-3 w-full"
        />
      </div>

      {/* Popular Tags */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3">Popular topics:</p>
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {popularTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "secondary"}
              className={`cursor-pointer transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'hover:bg-orange-100'
              }`}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-2">
          <Button onClick={handleSearch} className="bg-orange-500 hover:bg-orange-600">
            Search
          </Button>
          {(query || selectedTags.length > 0) && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}