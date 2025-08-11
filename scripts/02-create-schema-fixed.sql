-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data integrity
CREATE TYPE user_role AS ENUM ('buyer', 'creator', 'admin');
CREATE TYPE creator_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
CREATE TYPE artwork_category AS ENUM ('art_design', 'painting', 'sculpture', 'book', 'fashion');
CREATE TYPE artwork_subcategory AS ENUM (
  'digital', 'print', 'abstract', 'minimalist', 'afrofuturist', 'traditional',
  'oil', 'acrylic', 'mixed_media', 'watercolor',
  'wood', 'clay', 'bronze', 'recycled', 'stone',
  'poetry', 'photography', 'essays', 'fiction', 'non_fiction', 'biography', 'religious', 'political',
  'women', 'men', 'accessories', 'jewelry', 'bags'
);
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE event_type AS ENUM ('virtual', 'physical', 'hybrid');
CREATE TYPE application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
CREATE TYPE book_format AS ENUM ('physical', 'digital', 'both');
CREATE TYPE fashion_size AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'one_size');

-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'buyer',
  creator_status creator_status DEFAULT NULL,
  bio TEXT,
  location TEXT,
  country TEXT,
  phone TEXT,
  date_of_birth DATE,
  discipline TEXT, -- For creators
  avatar_url TEXT,
  cover_image_url TEXT,
  social_links JSONB DEFAULT '{}',
  website_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creator applications table
CREATE TABLE creator_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  application_data JSONB NOT NULL DEFAULT '{}',
  status application_status DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES user_profiles(id),
  review_notes TEXT,
  portfolio_urls TEXT[] DEFAULT '{}',
  experience_years INTEGER,
  artistic_statement TEXT,
  previous_exhibitions TEXT[] DEFAULT '{}',
  education_background TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table for better organization
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Artworks table (comprehensive for all art types)
CREATE TABLE artworks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category artwork_category NOT NULL,
  subcategory artwork_subcategory,
  category_id UUID REFERENCES categories(id),
  price DECIMAL(10,2),
  original_price DECIMAL(10,2), -- For sales/discounts
  currency TEXT DEFAULT 'NGN',
  
  -- Media and files
  image_urls TEXT[] DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  file_urls TEXT[] DEFAULT '{}', -- For digital downloads
  thumbnail_url TEXT,
  
  -- Physical properties
  dimensions TEXT, -- "30x40x5 cm"
  weight DECIMAL(8,2), -- in kg
  materials TEXT[] DEFAULT '{}',
  medium TEXT, -- oil, acrylic, etc.
  
  -- Book specific fields
  isbn TEXT,
  page_count INTEGER,
  book_format book_format,
  language TEXT DEFAULT 'English',
  publisher TEXT,
  publication_date DATE,
  
  -- Fashion specific fields
  available_sizes fashion_size[] DEFAULT '{}',
  color_variants TEXT[] DEFAULT '{}',
  fabric_composition TEXT,
  care_instructions TEXT,
  
  -- Inventory and availability
  stock_quantity INTEGER DEFAULT 1,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_limited_edition BOOLEAN DEFAULT FALSE,
  edition_size INTEGER,
  edition_number INTEGER,
  
  -- SEO and discovery
  tags TEXT[] DEFAULT '{}',
  slug TEXT UNIQUE,
  meta_description TEXT,
  
  -- Analytics
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  
  -- Shipping
  shipping_weight DECIMAL(8,2),
  shipping_dimensions TEXT,
  ships_internationally BOOLEAN DEFAULT FALSE,
  processing_time_days INTEGER DEFAULT 3,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  buyer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Order totals
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  shipping_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'NGN',
  
  -- Status and tracking
  status order_status DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_reference TEXT,
  
  -- Shipping information
  shipping_address JSONB NOT NULL DEFAULT '{}',
  billing_address JSONB DEFAULT '{}',
  shipping_method TEXT,
  tracking_number TEXT,
  estimated_delivery DATE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Product variant info (size, color, etc.)
  variant_info JSONB DEFAULT '{}',
  
  -- Commission tracking
  creator_commission_rate DECIMAL(5,4) DEFAULT 0.85, -- 85% to creator
  platform_fee_rate DECIMAL(5,4) DEFAULT 0.15, -- 15% platform fee
  creator_earnings DECIMAL(10,2) DEFAULT 0,
  platform_earnings DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlist/Favorites table
CREATE TABLE wishlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, artwork_id)
);

-- Following system
CREATE TABLE follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Reviews and ratings
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reviewer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events and exhibitions
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organizer_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type event_type NOT NULL,
  
  -- Scheduling
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  timezone TEXT DEFAULT 'Africa/Lagos',
  
  -- Location
  venue_name TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  virtual_link TEXT,
  
  -- Media
  banner_image_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  
  -- Ticketing
  is_free BOOLEAN DEFAULT TRUE,
  ticket_price DECIMAL(10,2),
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  
  -- Features
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  requires_approval BOOLEAN DEFAULT FALSE,
  
  -- SEO
  slug TEXT UNIQUE,
  meta_description TEXT,
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event registrations
CREATE TABLE event_registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  registration_data JSONB DEFAULT '{}',
  payment_status TEXT DEFAULT 'pending',
  attended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Blog/Journal posts
CREATE TABLE blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  
  -- Publishing
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- SEO
  slug TEXT UNIQUE NOT NULL,
  meta_description TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Analytics
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments system (for artworks, blog posts, etc.)
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Polymorphic relationship
  commentable_type TEXT NOT NULL, -- 'artwork', 'blog_post', 'event'
  commentable_id UUID NOT NULL,
  
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For replies
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  likes_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications system
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'order', 'follow', 'like', 'comment', 'event', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping zones and rates
CREATE TABLE shipping_zones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  countries TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE shipping_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  shipping_zone_id UUID REFERENCES shipping_zones(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- "Standard", "Express", etc.
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupons and discounts
CREATE TABLE coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Discount details
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed_amount'
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  minimum_order_amount DECIMAL(10,2),
  
  -- Usage limits
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  usage_limit_per_user INTEGER DEFAULT 1,
  
  -- Validity
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics and tracking
CREATE TABLE page_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  page_type TEXT NOT NULL, -- 'artwork', 'creator', 'category', etc.
  page_id UUID,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
