-- Add shipping and logistics tables

-- First, let's create the orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type VARCHAR(50) NOT NULL, -- 'art', 'book', 'fashion'
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping addresses table
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  street TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  country VARCHAR(100) DEFAULT 'Nigeria',
  postal_code VARCHAR(20),
  landmark TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number VARCHAR(255) UNIQUE NOT NULL,
  provider VARCHAR(100) NOT NULL,
  service_type VARCHAR(100),
  
  -- Addresses
  pickup_address JSONB NOT NULL,
  delivery_address JSONB NOT NULL,
  
  -- Package details
  package_details JSONB NOT NULL,
  
  -- Shipping costs
  shipping_cost DECIMAL(10,2) NOT NULL,
  insurance_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending',
  current_location TEXT,
  estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  
  -- Additional info
  label_url TEXT,
  special_instructions TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracking events table
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(100) NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping quotes table (for storing quotes before booking)
CREATE TABLE IF NOT EXISTS shipping_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(100) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  estimated_delivery_days INTEGER,
  
  -- Request details for reference
  pickup_address JSONB NOT NULL,
  delivery_address JSONB NOT NULL,
  package_details JSONB NOT NULL,
  
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_default ON shipping_addresses(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON tracking_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_shipping_quotes_user_id ON shipping_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_quotes_expires ON shipping_quotes(expires_at);

-- Add RLS policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_quotes ENABLE ROW LEVEL SECURITY;

-- Orders policies (with conflict handling)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view their own orders as buyer') THEN
    CREATE POLICY "Users can view their own orders as buyer" ON orders FOR SELECT USING (auth.uid() = buyer_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view their own orders as seller') THEN
    CREATE POLICY "Users can view their own orders as seller" ON orders FOR SELECT USING (auth.uid() = seller_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can insert orders as buyer') THEN
    CREATE POLICY "Users can insert orders as buyer" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can update their orders as buyer') THEN
    CREATE POLICY "Users can update their orders as buyer" ON orders FOR UPDATE USING (auth.uid() = buyer_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Sellers can update order status') THEN
    CREATE POLICY "Sellers can update order status" ON orders FOR UPDATE USING (auth.uid() = seller_id);
  END IF;
END $$;

-- Shipping addresses policies
CREATE POLICY "Users can view their own shipping addresses" ON shipping_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shipping addresses" ON shipping_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shipping addresses" ON shipping_addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shipping addresses" ON shipping_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Shipments policies (users can view shipments for their orders)
CREATE POLICY "Users can view their shipments" ON shipments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = shipments.order_id 
      AND orders.buyer_id = auth.uid()
    )
  );

-- Tracking events policies
CREATE POLICY "Users can view tracking for their shipments" ON tracking_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shipments s
      JOIN orders o ON o.id = s.order_id
      WHERE s.id = tracking_events.shipment_id 
      AND o.buyer_id = auth.uid()
    )
  );

-- Shipping quotes policies
CREATE POLICY "Users can view their own quotes" ON shipping_quotes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes" ON shipping_quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipping_addresses_updated_at BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();