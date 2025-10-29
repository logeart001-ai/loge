
CREATE TABLE IF NOT EXISTS shipping_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    estimated_delivery_days INTEGER NOT NULL,
    pickup_address JSONB NOT NULL,
    delivery_address JSONB NOT NULL,
    package_details JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shipping_quotes_user_id ON shipping_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_quotes_created_at ON shipping_quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_shipping_quotes_expires_at ON shipping_quotes(expires_at);

-- Create shipments table for tracking actual shipments
CREATE TABLE IF NOT EXISTS shipments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    tracking_number VARCHAR(255) UNIQUE NOT NULL,
    provider VARCHAR(100) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    pickup_address JSONB NOT NULL,
    delivery_address JSONB NOT NULL,
    package_details JSONB NOT NULL,
    label_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for shipments
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

-- Enable RLS
ALTER TABLE shipping_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- RLS policies for shipping_quotes
CREATE POLICY "Users can view their own shipping quotes" ON shipping_quotes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create shipping quotes" ON shipping_quotes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for shipments (users can view shipments for their orders)
CREATE POLICY "Users can view their shipments" ON shipments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = shipments.order_id 
            AND orders.buyer_id = auth.uid()
        )
    );

-- Verify tables were created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('shipping_quotes', 'shipments')
ORDER BY table_name, ordinal_position;