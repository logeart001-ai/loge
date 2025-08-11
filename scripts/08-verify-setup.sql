-- Check all tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (
    VALUES 
        ('user_profiles'),
        ('artworks'),
        ('orders'),
        ('wishlist'),
        ('following'),
        ('events')
) AS expected_tables(table_name);

-- Check RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'artworks', 'orders', 'wishlist', 'following', 'events')
ORDER BY tablename;

-- Check sample data
SELECT 'Events' as table_name, COUNT(*) as record_count FROM public.events
UNION ALL
SELECT 'User Profiles' as table_name, COUNT(*) as record_count FROM public.user_profiles
UNION ALL
SELECT 'Artworks' as table_name, COUNT(*) as record_count FROM public.artworks;

-- Show sample events
SELECT title, event_type, to_char(event_date, 'YYYY-MM-DD HH24:MI') as event_date 
FROM public.events 
ORDER BY event_date 
LIMIT 5;
