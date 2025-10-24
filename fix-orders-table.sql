-- Fix the orders table by adding missing columns
-- Run this in your Supabase SQL editor

-- Add missing columns to orders table
DO $$
BEGIN
    -- Add order_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_number VARCHAR(255) UNIQUE;
        CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
    END IF;
    
    -- Add subtotal column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2);
    END IF;
    
    -- Add order_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_status VARCHAR(50) DEFAULT 'pending';
    END IF;
    
    -- Add payment_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
    END IF;
    
    -- Add shipping_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'shipping_address'
    ) THEN
        ALTER TABLE orders ADD COLUMN shipping_address JSONB DEFAULT '{}';
    END IF;
    
    -- Add payment_reference column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_reference'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(255);
        CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);
    END IF;
    
    -- Add buyer_id column if it doesn't exist (might be named differently)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'buyer_id'
    ) THEN
        -- Check if user_id exists instead
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'user_id'
        ) THEN
            -- Rename user_id to buyer_id for consistency
            ALTER TABLE orders RENAME COLUMN user_id TO buyer_id;
        ELSE
            -- Add buyer_id column
            ALTER TABLE orders ADD COLUMN buyer_id UUID REFERENCES auth.users(id);
        END IF;
    END IF;
    
    -- Add total_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2);
    END IF;
    
END $$;

-- Verify the updated structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;