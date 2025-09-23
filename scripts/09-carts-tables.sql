-- Carts and Cart Items tables
-- Run after essential tables

-- Create enum for cart status
DO $$ BEGIN
    CREATE TYPE cart_status AS ENUM ('active', 'converted', 'abandoned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Carts table: one active cart per user
CREATE TABLE IF NOT EXISTS carts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status cart_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure at most one active cart per user
CREATE UNIQUE INDEX IF NOT EXISTS ux_carts_user_active
  ON carts(user_id)
  WHERE status = 'active';

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE NOT NULL,
  artwork_id UUID REFERENCES artworks(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cart_id, artwork_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_artwork_id ON cart_items(artwork_id);
