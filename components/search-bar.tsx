'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  initialQuery?: string
  initialType?: string
}

export default function SearchBar({ initialQuery = '', initialType = 'artworks' }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [query, setQuery] = useState(initialQuery)
  const [searchType, setSearchType] = useState<'artworks' | 'creators'>(
    initialType as 'artworks' | 'creators'
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams(searchParams)
    
    if (query.trim()) {
      params.set('q', query.trim())
    } else {
      params.delete('q')
    }
    
    params.set('type', searchType)
    
    startTransition(() => {
      router.push(`/search?${params.toString()}`)
    })
  }

  const clearSearch = () => {
    setQuery('')
    const params = new URLSearchParams(searchParams)
    params.delete('q')
    params.set('type', searchType)
    
    startTransition(() => {
      router.push(`/search?${params.toString()}`)
    })
  }

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="flex flex-col gap-3">
        {/* Search Type Toggle */}
        <div className="flex gap-2">
          <Badge
            variant={searchType === 'artworks' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSearchType('artworks')}
          >
            Artworks
          </Badge>
          <Badge
            variant={searchType === 'creators' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSearchType('creators')}
          >
            Creators
          </Badge>
        </div>

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={
                searchType === 'artworks'
                  ? 'Search artworks by title, description, or tags...'
                  : 'Search creators by name, discipline, or bio...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={isPending}
            className="bg-orange-500 hover:bg-orange-600 h-12 px-6"
          >
            {isPending ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>
    </form>
  )
}

// Legacy export for backwards compatibility
export { SearchBar }
