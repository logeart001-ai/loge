'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Heart, Search, Filter, Grid, List, Star, BookOpen, User } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'
import Image from 'next/image'

export default function BooksPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedFormat, setSelectedFormat] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const books = [
    {
      id: '750e8400-e29b-41d4-a716-446655440001',
      title: 'Whispers of the Savannah',
      author: 'Amara Kone',
      price: 6800,
      originalPrice: 8500,
      image: '/image/Whispers of the Savannah.png',
      genre: 'Fiction',
      format: 'Paperback',
      pages: 324,
      language: 'English',
      publishYear: 2023,
      rating: 4.7,
      reviews: 89,
      isLiked: false,
      inStock: true,
      description: 'A haunting tale of family secrets spanning three generations in traditional Mali.',
      tags: ['family', 'secrets', 'mali', 'generations']
    },
    {
      id: '750e8400-e29b-41d4-a716-446655440002',
      title: 'Lagos Noir',
      author: 'Tunde Adebayo',
      price: 5200,
      image: '/image/Lagos Noir.png',
      genre: 'Mystery',
      format: 'Hardcover',
      pages: 298,
      language: 'English',
      publishYear: 2023,
      rating: 4.5,
      reviews: 67,
      isLiked: true,
      inStock: true,
      description: 'Gritty crime stories set in the underbelly of Nigeria\'s largest city.',
      tags: ['crime', 'nigeria', 'lagos', 'mystery']
    },
    {
      id: '750e8400-e29b-41d4-a716-446655440003',
      title: 'The Baobab\'s Daughter',
      author: 'Fatou Diop',
      price: 7600,
      image: '/image/The Baobab\'s Daughter.png',
      genre: 'Historical Fiction',
      format: 'Paperback',
      pages: 412,
      language: 'English',
      publishYear: 2022,
      rating: 4.8,
      reviews: 124,
      isLiked: false,
      inStock: true,
      description: 'Epic story of a woman\'s journey across pre-colonial West Africa.',
      tags: ['historical', 'west-africa', 'journey', 'woman']
    },
    {
      id: '750e8400-e29b-41d4-a716-446655440004',
      title: 'Ubuntu Philosophy',
      author: 'Dr. Mandla Mbeki',
      price: 9200,
      image: '/image/Ubuntu Philosophy.png',
      genre: 'Philosophy',
      format: 'Hardcover',
      pages: 256,
      language: 'English',
      publishYear: 2023,
      rating: 4.6,
      reviews: 43,
      isLiked: false,
      inStock: false,
      description: 'Exploring the African philosophy of Ubuntu and its relevance today.',
      tags: ['ubuntu', 'philosophy', 'african', 'wisdom']
    },
    {
      id: '750e8400-e29b-41d4-a716-446655440005',
      title: 'Rhythms of the Sahel',
      author: 'Aminata Traore',
      price: 4800,
  image: '/image/placeholder.svg',
      genre: 'Poetry',
      format: 'Paperback',
      pages: 128,
      language: 'English/French',
      publishYear: 2023,
      rating: 4.9,
      reviews: 56,
      isLiked: true,
      inStock: true,
      description: 'Beautiful poetry celebrating the landscapes and people of the Sahel.',
      tags: ['poetry', 'sahel', 'landscape', 'bilingual']
    },
    {
      id: '750e8400-e29b-41d4-a716-446655440006',
      title: 'Digital Africa',
      author: 'Kwame Nkrumah Jr.',
      price: 8900,
  image: '/image/placeholder.svg',
      genre: 'Technology',
      format: 'Paperback',
      pages: 345,
      language: 'English',
      publishYear: 2023,
      rating: 4.4,
      reviews: 78,
      isLiked: false,
      inStock: true,
      description: 'How technology is transforming Africa and shaping its future.',
      tags: ['technology', 'africa', 'digital', 'future']
    },
    {
      id: 7,
      title: 'African Traditional Spirituality',
      author: 'Dr. Kofi Asante',
      price: 7200,
  image: '/image/placeholder.svg',
      genre: 'Spiritual & Religious',
      format: 'Hardcover',
      pages: 288,
      language: 'English',
      publishYear: 2023,
      rating: 4.8,
      reviews: 92,
      isLiked: false,
      inStock: true,
      description: 'Exploring the rich spiritual traditions and beliefs across African cultures.',
      tags: ['spirituality', 'traditional', 'african', 'beliefs', 'culture']
    },
    {
      id: 8,
      title: 'The Quran in African Context',
      author: 'Sheikh Abdullah Hakim',
      price: 6500,
  image: '/image/placeholder.svg',
      genre: 'Spiritual & Religious',
      format: 'Paperback',
      pages: 412,
      language: 'English/Arabic',
      publishYear: 2022,
      rating: 4.9,
      reviews: 156,
      isLiked: true,
      inStock: true,
      description: 'Understanding Islamic teachings through an African lens and perspective.',
      tags: ['islam', 'quran', 'african', 'islamic', 'teachings']
    },
    {
      id: 9,
      title: 'Christianity and African Heritage',
      author: 'Rev. Dr. Grace Mbeki',
      price: 5800,
  image: '/image/placeholder.svg',
      genre: 'Spiritual & Religious',
      format: 'Paperback',
      pages: 324,
      language: 'English',
      publishYear: 2023,
      rating: 4.6,
      reviews: 73,
      isLiked: false,
      inStock: true,
      description: 'Bridging Christian faith with African cultural traditions and values.',
      tags: ['christianity', 'african', 'heritage', 'faith', 'culture']
    },
    {
      id: 10,
      title: 'Ancestral Wisdom: Connecting with the Spirits',
      author: 'Mama Asha Kone',
      price: 4900,
  image: '/image/placeholder.svg',
      genre: 'Spiritual & Religious',
      format: 'Paperback',
      pages: 256,
      language: 'English',
      publishYear: 2023,
      rating: 4.7,
      reviews: 84,
      isLiked: false,
      inStock: true,
      description: 'A guide to connecting with ancestral spirits and traditional healing practices.',
      tags: ['ancestors', 'spirits', 'healing', 'traditional', 'wisdom']
    },
    {
      id: 11,
      title: 'Meditation and Mindfulness in Africa',
      author: 'Dr. Amina Hassan',
      price: 5500,
  image: '/image/placeholder.svg',
      genre: 'Spiritual & Religious',
      format: 'Paperback',
      pages: 198,
      language: 'English',
      publishYear: 2023,
      rating: 4.5,
      reviews: 67,
      isLiked: true,
      inStock: true,
      description: 'Exploring meditation practices rooted in African spiritual traditions.',
      tags: ['meditation', 'mindfulness', 'spiritual', 'practices', 'wellness']
    },
    {
      id: 12,
      title: 'Sacred Rituals of the Yoruba',
      author: 'Babalawo Ifayemi Elebuibon',
      price: 8200,
  image: '/image/placeholder.svg',
      genre: 'Spiritual & Religious',
      format: 'Hardcover',
      pages: 368,
      language: 'English/Yoruba',
      publishYear: 2022,
      rating: 4.9,
      reviews: 118,
      isLiked: false,
      inStock: true,
      description: 'Comprehensive guide to Yoruba spiritual practices, rituals, and ceremonies.',
      tags: ['yoruba', 'rituals', 'ceremonies', 'ifa', 'orisha']
    }
  ]

  const genres = [
    { value: 'all', label: 'All Genres' },
    { value: 'fiction', label: 'Fiction' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'historical-fiction', label: 'Historical Fiction' },
    { value: 'philosophy', label: 'Philosophy' },
    { value: 'poetry', label: 'Poetry' },
    { value: 'technology', label: 'Technology' },
    { value: 'biography', label: 'Biography' },
    { value: 'spiritual-religious', label: 'Spiritual & Religious' },
    { value: 'children', label: 'Children\'s Books' }
  ]

  const formats = [
    { value: 'all', label: 'All Formats' },
    { value: 'paperback', label: 'Paperback' },
    { value: 'hardcover', label: 'Hardcover' },
    { value: 'ebook', label: 'E-book' },
    { value: 'audiobook', label: 'Audiobook' }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'title', label: 'Title A-Z' }
  ]

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesGenre = selectedGenre === 'all' || 
                        book.genre.toLowerCase().replace(' ', '-') === selectedGenre
    
    const matchesFormat = selectedFormat === 'all' || 
                         book.format.toLowerCase() === selectedFormat
    
    const matchesPrice = book.price >= priceRange[0] && book.price <= priceRange[1]
    
    return matchesSearch && matchesGenre && matchesFormat && matchesPrice
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-linear-to-r from-orange-500 to-red-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="hero-title text-4xl md:text-6xl font-bold mb-4">
              African Literature
            </h1>
            <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">
              Discover stories, wisdom, and perspectives from African authors and storytellers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="relative max-w-md mx-auto sm:mx-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search books, authors, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full text-gray-900"
                />
              </div>
              <Button variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Spiritual & Religious Books Highlight Section */}
      <section className="bg-linear-to-r from-orange-500 to-red-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Spiritual & Religious Collection
            </h2>
            <p className="text-lg text-white/90 mb-6">
              Discover Africa&apos;s rich spiritual heritage and contemporary faith
            </p>
            <Button 
              variant="secondary" 
              className="bg-white text-orange-500 hover:bg-white/90"
              onClick={() => setSelectedGenre('spiritual-religious')}
            >
              Browse Collection
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Filters</h3>
                
                {/* Genre Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre.value} value={genre.value}>
                          {genre.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Format Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format
                  </label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range (₦)
                  </label>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={50000}
                      min={0}
                      step={500}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₦{priceRange[0].toLocaleString()}</span>
                      <span>₦{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Language Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <div className="space-y-2">
                    {['English', 'French', 'Portuguese', 'Arabic', 'Swahili', 'Hausa'].map((language) => (
                      <label key={language} className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                        <span className="ml-2 text-sm text-gray-700">{language}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Publication Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publication Year
                  </label>
                  <div className="space-y-2">
                    {['2023', '2022', '2021', '2020', 'Before 2020'].map((year) => (
                      <label key={year} className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                        <span className="ml-2 text-sm text-gray-700">{year}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort and View Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Books ({filteredBooks.length})
                </h2>
                <p className="text-gray-600">Discover African literature and knowledge</p>
              </div>
              
              <div className="flex items-center gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Books Grid/List */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
              : 'space-y-6'
            }>
              {filteredBooks.map((book) => (
                <Card key={book.id} className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <Image
                        src={book.image || "/image/placeholder.svg"}
                        alt={book.title}
                        width={300}
                        height={400}
                        className={`w-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                          viewMode === 'grid' ? 'h-80' : 'h-64'
                        }`}
                      />
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button size="sm" variant="secondary" className="rounded-full w-10 h-10 p-0">
                          <Heart className={`w-4 h-4 ${book.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      </div>
                      {book.originalPrice && (
                        <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                          Sale
                        </Badge>
                      )}
                      {!book.inStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <Badge variant="secondary" className="text-lg">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 overflow-hidden">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 wrap-break-word">
                            {book.title}
                          </h3>
                          <p className="text-gray-600 text-sm flex items-center mt-1 truncate">
                            <User className="w-3 h-3 mr-1 shrink-0" />
                            {book.author}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">{book.genre}</Badge>
                      </div>
                      
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(book.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            {book.rating} ({book.reviews} reviews)
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {book.description}
                      </p>
                      
                      <div className="text-sm text-gray-600 mb-4 flex items-center gap-4 flex-wrap">
                        <span className="flex items-center">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {book.pages} pages
                        </span>
                        <span>{book.format}</span>
                        <span>{book.publishYear}</span>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        {/* Price Display - Current price first, original price below */}
                        <div className="flex flex-col gap-1">
                          <span className="text-lg font-bold text-gray-900">
                            ₦{book.price.toLocaleString()}
                          </span>
                          {book.originalPrice && (
                            <span className="text-xs text-gray-500 line-through">
                              ₦{book.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        
                        {/* Add to Cart Button */}
                        {book.inStock ? (
                          <AddToCartButton artworkId={book.id.toString()} />
                        ) : (
                          <Button 
                            size="sm" 
                            className="bg-gray-400 w-full"
                            disabled
                          >
                            Sold Out
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Books
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
