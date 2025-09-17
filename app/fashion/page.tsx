'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Heart, Search, Filter, Grid, List, Star, ShoppingCart, Truck } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import Link from 'next/link'

export default function FashionPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priceRange, setPriceRange] = useState([0, 200000])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSize, setSelectedSize] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const fashionItems = [
    {
      id: 1,
      title: 'Ankara Print Dress',
      designer: 'Kemi Fashion House',
      price: 45000,
      originalPrice: 55000,
      image: '/african-ankara-dress.png',
      category: 'Dresses',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Red', 'Blue', 'Green'],
      rating: 4.8,
      reviews: 32,
      isLiked: false,
      inStock: true,
      fastShipping: true,
      tags: ['ankara', 'traditional', 'dress', 'colorful']
    },
    {
      id: 2,
      title: 'Kente Blazer',
      designer: 'Accra Couture',
      price: 72000,
      image: '/african-kente-blazer.png',
      category: 'Blazers',
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['Gold', 'Black', 'Red'],
      rating: 4.9,
      reviews: 18,
      isLiked: true,
      inStock: true,
      fastShipping: false,
      tags: ['kente', 'blazer', 'formal', 'traditional']
    },
    {
      id: 3,
      title: 'Dashiki Shirt',
      designer: 'Lagos Style Co.',
      price: 28000,
      image: '/image/Dashiki Shirt.png',
      category: 'Shirts',
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['White', 'Black', 'Blue', 'Red'],
      rating: 4.6,
      reviews: 45,
      isLiked: false,
      inStock: true,
      fastShipping: true,
      tags: ['dashiki', 'shirt', 'casual', 'embroidered']
    },
    {
      id: 4,
      title: 'Adire Maxi Skirt',
      designer: 'Ibadan Textiles',
      price: 35000,
      image: '/image/Adire Maxi Skirt.png',
      category: 'Skirts',
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['Indigo', 'White', 'Navy'],
      rating: 4.7,
      reviews: 28,
      isLiked: false,
      inStock: false,
      fastShipping: false,
      tags: ['adire', 'maxi', 'skirt', 'indigo']
    },
    {
      id: 5,
      title: 'Bogolan Jacket',
      designer: 'Mali Heritage',
      price: 85000,
      image: '/image/Bogolan Jacket.png',
      category: 'Jackets',
      sizes: ['M', 'L', 'XL'],
      colors: ['Brown', 'Beige', 'Black'],
      rating: 4.8,
      reviews: 15,
      isLiked: true,
      inStock: true,
      fastShipping: false,
      tags: ['bogolan', 'jacket', 'mudcloth', 'traditional']
    },
    {
      id: 6,
      title: 'Wax Print Jumpsuit',
      designer: 'Dakar Designs',
      price: 58000,
      image: '/placeholder.svg?height=400&width=300&text=Wax+Jumpsuit',
      category: 'Jumpsuits',
      sizes: ['S', 'M', 'L'],
      colors: ['Yellow', 'Orange', 'Green'],
      rating: 4.5,
      reviews: 22,
      isLiked: false,
      inStock: true,
      fastShipping: true,
      tags: ['wax-print', 'jumpsuit', 'contemporary', 'bold']
    }
  ]

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'dresses', label: 'Dresses' },
    { value: 'shirts', label: 'Shirts' },
    { value: 'blazers', label: 'Blazers' },
    { value: 'skirts', label: 'Skirts' },
    { value: 'jackets', label: 'Jackets' },
    { value: 'jumpsuits', label: 'Jumpsuits' },
    { value: 'accessories', label: 'Accessories' }
  ]

  const sizes = [
    { value: 'all', label: 'All Sizes' },
    { value: 'xs', label: 'XS' },
    { value: 's', label: 'S' },
    { value: 'm', label: 'M' },
    { value: 'l', label: 'L' },
    { value: 'xl', label: 'XL' },
    { value: 'xxl', label: 'XXL' }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' }
  ]

  const filteredItems = fashionItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.designer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || 
                           item.category.toLowerCase() === selectedCategory
    
    const matchesSize = selectedSize === 'all' || 
                       item.sizes.some(size => size.toLowerCase() === selectedSize)
    
    const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1]
    
    return matchesSearch && matchesCategory && matchesSize && matchesPrice
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              African Fashion
            </h1>
            <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">
              Discover contemporary and traditional African fashion from talented designers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="relative max-w-md mx-auto sm:mx-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search fashion, designers, or styles..."
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Filters</h3>
                
                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Size Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
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
                      max={200000}
                      min={0}
                      step={5000}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₦{priceRange[0].toLocaleString()}</span>
                      <span>₦{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Color Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colors
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Brown', 'Orange'].map((color) => (
                      <div
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer hover:border-gray-500 ${
                          color === 'Red' ? 'bg-brand-red' :
                          color === 'Blue' ? 'bg-brand-grey' :
                          color === 'Green' ? 'bg-brand-yellow' :
                          color === 'Yellow' ? 'bg-brand-yellow' :
                          color === 'Black' ? 'bg-black' :
                          color === 'White' ? 'bg-white' :
                          color === 'Brown' ? 'bg-brand-orange' :
                          'bg-brand-orange'
                        }`}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Additional Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                      <span className="ml-2 text-sm text-gray-700">In Stock</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                      <span className="ml-2 text-sm text-gray-700">Fast Shipping</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                      <span className="ml-2 text-sm text-gray-700">On Sale</span>
                    </label>
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
                  Fashion Items ({filteredItems.length})
                </h2>
                <p className="text-gray-600">Discover unique African fashion pieces</p>
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

            {/* Fashion Items Grid/List */}
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
              : 'space-y-6'
            }>
              {filteredItems.map((item) => (
                <Card key={item.id} className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.title}
                        className={`w-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                          viewMode === 'grid' ? 'h-80' : 'h-64'
                        }`}
                      />
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button size="sm" variant="secondary" className="rounded-full w-10 h-10 p-0">
                          <Heart className={`w-4 h-4 ${item.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      </div>
                      {item.originalPrice && (
                        <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                          Sale
                        </Badge>
                      )}
                      {item.fastShipping && (
                        <Badge className="absolute bottom-4 left-4 bg-brand-yellow text-black">
                          <Truck className="w-3 h-3 mr-1" />
                          Fast Ship
                        </Badge>
                      )}
                      {!item.inStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <Badge variant="secondary" className="text-lg">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 text-sm">by {item.designer}</p>
                        </div>
                        <Badge variant="secondary">{item.category}</Badge>
                      </div>
                      
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(item.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            {item.rating} ({item.reviews} reviews)
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-4">
                        <p>Sizes: {item.sizes.join(', ')}</p>
                        <p>Colors: {item.colors.join(', ')}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900">
                            ₦{item.price.toLocaleString()}
                          </span>
                          {item.originalPrice && (
                            <span className="text-lg text-gray-500 line-through">
                              ₦{item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-orange-600 hover:bg-orange-700"
                          disabled={!item.inStock}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {item.inStock ? 'Add to Cart' : 'Sold Out'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Items
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
