'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function HomeSearch() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'artworks' | 'creators'>('artworks')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const params = new URLSearchParams()
    params.set('q', query)
    params.set('type', searchType)

    startTransition(() => {
      router.push(`/search?${params.toString()}`)
    })
  }

  const quickSearches = [
    { label: 'Paintings', type: 'artworks' as const, query: '', filter: 'category=painting' },
    { label: 'Sculptures', type: 'artworks' as const, query: '', filter: 'category=sculpture' },
    { label: 'Fashion', type: 'artworks' as const, query: '', filter: 'category=fashion' },
    { label: 'Verified Creators', type: 'creators' as const, query: '', filter: 'verified=true' },
  ]

  const handleQuickSearch = (type: 'artworks' | 'creators', filter: string) => {
    startTransition(() => {
      router.push(`/search?type=${type}&${filter}`)
    })
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search Type Toggle */}
      <div className="flex justify-center gap-2 mb-4">
        <Badge
          variant={searchType === 'artworks' ? 'default' : 'outline'}
          className={`cursor-pointer px-4 py-2 ${
            searchType === 'artworks'
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => setSearchType('artworks')}
        >
          Search Artworks
        </Badge>
        <Badge
          variant={searchType === 'creators' ? 'default' : 'outline'}
          className={`cursor-pointer px-4 py-2 ${
            searchType === 'creators'
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => setSearchType('creators')}
        >
          Find Creators
        </Badge>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder={
              searchType === 'artworks'
                ? 'Search for paintings, sculptures, fashion...'
                : 'Search for creators by name or discipline...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-24 py-6 text-lg border-2 border-gray-200 focus:border-orange-500 rounded-full"
          />
          <Button
            type="submit"
            disabled={isPending || !query.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6"
          >
            {isPending ? 'Searching...' : 'Search'}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Quick Search Links */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        <span className="text-sm text-gray-500">Quick searches:</span>
        {quickSearches.map((search) => (
          <button
            key={search.label}
            onClick={() => handleQuickSearch(search.type, search.filter)}
            className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
            disabled={isPending}
          >
            {search.label}
          </button>
        ))}
      </div>
    </div>
  )
}
