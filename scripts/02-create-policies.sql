-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.following ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view all profiles" ON public.user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Artworks policies
CREATE POLICY "Anyone can view available artworks" ON public.artworks
  FOR SELECT USING (is_available = true);

CREATE POLICY "Creators can manage own artworks" ON public.artworks
  FOR ALL USING (auth.uid() = creator_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = creator_id);

CREATE POLICY "Buyers can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Creators can update order status" ON public.orders
  FOR UPDATE USING (auth.uid() = creator_id);

-- Wishlist policies
CREATE POLICY "Users can manage own wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = user_id);

-- Following policies
CREATE POLICY "Users can manage own following" ON public.following
  FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Users can view who follows them" ON public.following
  FOR SELECT USING (auth.uid() = following_id);

-- Events policies
CREATE POLICY "Anyone can view events" ON public.events
  FOR SELECT USING (true);
