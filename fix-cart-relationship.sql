-- Fix cart_items to artworks relationship
-- Run this in your Supabase SQL editor

-- 1. Check if cart_items table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cart_items'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if carts table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'carts'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Create carts table if it doesn't exist
CREATE TABLE IF NOT EXISTS carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create cart_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
    artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Clean up orphaned data before adding constraints
-- Remove cart items that reference non-existent artworks
DELETE FROM cart_items 
WHERE artwork_id NOT IN (SELECT id FROM artworks WHERE id IS NOT NULL);

-- Remove cart items that reference non-existent carts
DELETE FROM cart_items 
WHERE cart_id NOT IN (SELECT id FROM carts WHERE id IS NOT NULL);

-- Remove carts that reference non-existent users (if any)
DELETE FROM carts 
WHERE user_id NOT IN (SELECT id FROM auth.users WHERE id IS NOT NULL);

-- 6. Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Add cart_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cart_items_cart_id_fkey' 
        AND table_name = 'cart_items'
    ) THEN
        ALTER TABLE cart_items 
        ADD CONSTRAINT cart_items_cart_id_fkey 
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added cart_id foreign key constraint';
    END IF;
    
    -- Add artwork_id foreign key if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'cart_items_artwork_id_fkey' 
        AND table_name = 'cart_items'
    ) THEN
        ALTER TABLE cart_items 
        ADD CONSTRAINT cart_items_artwork_id_fkey 
        FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added artwork_id foreign key constraint';
    END IF;
    
    -- Add user_id foreign key to carts if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'carts_user_id_fkey' 
        AND table_name = 'carts'
    ) THEN
        ALTER TABLE carts 
        ADD CONSTRAINT carts_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id foreign key constraint';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding foreign key constraints: %', SQLERRM;
END $$;

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_artwork_id ON cart_items(artwork_id);

-- 7. Enable RLS (Row Level Security)
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for carts
DROP POLICY IF EXISTS "Users can manage their own carts" ON carts;
CREATE POLICY "Users can manage their own carts" ON carts
    FOR ALL USING (auth.uid() = user_id);

-- 9. Create RLS policies for cart_items
DROP POLICY IF EXISTS "Users can manage their own cart items" ON cart_items;
CREATE POLICY "Users can manage their own cart items" ON cart_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM carts 
            WHERE carts.id = cart_items.cart_id 
            AND carts.user_id = auth.uid()
        )
    );

-- 10. Verify the relationships are working
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('carts', 'cart_items')
ORDER BY tc.table_name, tc.constraint_name;

-- 11. Test the relationship query that was failing
SELECT 
    ci.id,
    ci.artwork_id,
    ci.unit_price,
    ci.quantity,
    a.id as artwork_id_check,
    a.title,
    a.thumbnail_url,
    a.creator_id
FROM cart_items ci
LEFT JOIN artworks a ON ci.artwork_id = a.id
LIMIT 5;