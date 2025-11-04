import { createServerClient } from '@/lib/supabase'
import { FashionPageClient } from './fashion-page-client'

export default async function FashionPage() {
  // Fetch real fashion items from the database
  const supabase = await createServerClient()
  
  const { data: artworks } = await supabase
    .from('artworks')
    .select(`
      id,
      title,
      price,
      thumbnail_url,
      description,
      medium,
      dimensions,
      is_available,
      category,
      user_profiles!creator_id (
        full_name,
        username
      )
    `)
    .eq('is_available', true)
    .eq('category', 'Fashion')
    .order('created_at', { ascending: false })
    .limit(50)

  // Transform the data to match the expected format
  const transformedItems = (artworks || []).map((art) => {
    const profile = Array.isArray(art.user_profiles) ? art.user_profiles[0] : art.user_profiles
    
    return {
      id: art.id,
      title: art.title || 'Untitled',
      designer: profile?.full_name || profile?.username || 'Unknown Designer',
      price: art.price || 0,
      originalPrice: undefined,
      image: art.thumbnail_url || '/image/placeholder.svg',
      category: 'Fashion',
      sizes: ['S', 'M', 'L', 'XL'], // Default sizes since we don't have this in DB yet
      colors: ['Various'], // Default colors
      rating: 4.5,
      reviews: 0,
      isLiked: false,
      inStock: true,
      fastShipping: false,
      tags: ['fashion', art.medium?.toLowerCase() || 'clothing']
    }
  })

  // If no fashion items found, show message in client component
  return <FashionPageClient initialItems={transformedItems} />
}

      reviews: 18,
      isLiked: true,
      inStock: true,
      fastShipping: false,
      tags: ['kente', 'blazer', 'formal', 'traditional']
    },
    {
      id: '650e8400-e29b-41d4-a716-446655440003',
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
      id: '650e8400-e29b-41d4-a716-446655440004',
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
      id: '650e8400-e29b-41d4-a716-446655440005',
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
      id: '650e8400-e29b-41d4-a716-446655440006',
      title: 'Wax Print Jumpsuit',
      designer: 'Dakar Designs',
      price: 58000,
  image: '/image/Art Exhibition Image.png',
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
      <section className="bg-linear-to-r from-orange-500 to-red-500 text-white py-16">
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
                    <div className={`relative overflow-hidden ${viewMode === 'grid' ? 'h-80' : 'h-64'}`}>
                      <Image
                        src={item.image || "/image/placeholder.svg"}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
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
                    
                    <div className="p-6 overflow-hidden">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors wrap-break-words line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 text-sm truncate">by {item.designer}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0">{item.category}</Badge>
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
                        <p className="truncate">Sizes: {item.sizes.join(', ')}</p>
                        <p className="truncate">Colors: {item.colors.join(', ')}</p>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        {/* Price Display - Current price first, original price below */}
                        <div className="flex flex-col gap-1">
                          <span className="text-lg font-bold text-gray-900">
                            ₦{item.price.toLocaleString()}
                          </span>
                          {item.originalPrice && (
                            <span className="text-xs text-gray-500 line-through">
                              ₦{item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        
                        {/* Add to Cart Button */}
                        {item.inStock ? (
                          <AddToCartButton artworkId={item.id.toString()} />
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
                Load More Items
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
