-- Enable RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Users manage own carts" ON carts;
DROP POLICY IF EXISTS "Users read own carts" ON carts;
DROP POLICY IF EXISTS "Users insert own carts" ON carts;
DROP POLICY IF EXISTS "Users update own carts" ON carts;
DROP POLICY IF EXISTS "Users delete own carts" ON carts;

DROP POLICY IF EXISTS "Users manage own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users read own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users insert into own cart" ON cart_items;
DROP POLICY IF EXISTS "Users update items in own cart" ON cart_items;
DROP POLICY IF EXISTS "Users delete items in own cart" ON cart_items;

-- Carts policies
CREATE POLICY "Users read own carts" ON carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own carts" ON carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own carts" ON carts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own carts" ON carts
  FOR DELETE USING (auth.uid() = user_id);

-- Cart items policies (scope by owning cart)
CREATE POLICY "Users read own cart items" ON cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users insert into own cart" ON cart_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update items in own cart" ON cart_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete items in own cart" ON cart_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  );
