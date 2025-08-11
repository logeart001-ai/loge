-- Check which tables exist
DO $$
BEGIN
    -- Create events table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        CREATE TABLE public.events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            event_type TEXT NOT NULL CHECK (event_type IN ('virtual', 'in_person', 'hybrid')),
            event_date TIMESTAMP WITH TIME ZONE NOT NULL,
            location TEXT,
            image_url TEXT,
            registration_url TEXT,
            is_featured BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created events table';
    ELSE
        RAISE NOTICE 'Events table already exists';
    END IF;

    -- Create user_profiles table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        CREATE TABLE public.user_profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('buyer', 'creator')),
            bio TEXT,
            location TEXT,
            discipline TEXT,
            avatar_url TEXT,
            social_links JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created user_profiles table';
    ELSE
        RAISE NOTICE 'User_profiles table already exists';
    END IF;

    -- Create artworks table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artworks') THEN
        CREATE TABLE public.artworks (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            creator_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL CHECK (category IN ('visual_art', 'fashion', 'literature')),
            subcategory TEXT,
            price DECIMAL(10,2),
            currency TEXT DEFAULT 'USD',
            image_urls TEXT[],
            tags TEXT[],
            dimensions TEXT,
            materials TEXT,
            is_available BOOLEAN DEFAULT true,
            is_featured BOOLEAN DEFAULT false,
            views_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created artworks table';
    ELSE
        RAISE NOTICE 'Artworks table already exists';
    END IF;

    -- Create orders table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        CREATE TABLE public.orders (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            buyer_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
            creator_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
            artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE NOT NULL,
            quantity INTEGER DEFAULT 1,
            unit_price DECIMAL(10,2) NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
            shipping_address JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created orders table';
    ELSE
        RAISE NOTICE 'Orders table already exists';
    END IF;

    -- Create wishlist table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wishlist') THEN
        CREATE TABLE public.wishlist (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
            artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, artwork_id)
        );
        RAISE NOTICE 'Created wishlist table';
    ELSE
        RAISE NOTICE 'Wishlist table already exists';
    END IF;

    -- Create following table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'following') THEN
        CREATE TABLE public.following (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            follower_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
            following_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(follower_id, following_id)
        );
        RAISE NOTICE 'Created following table';
    ELSE
        RAISE NOTICE 'Following table already exists';
    END IF;
END $$;

-- Show all created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'artworks', 'orders', 'wishlist', 'following', 'events')
ORDER BY table_name;
