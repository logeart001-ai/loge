-- Check what tables exist in your database
-- Run this in your Supabase SQL editor

-- List all tables in the public schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check specifically for payment-related tables
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND (
    table_name LIKE '%order%' OR 
    table_name LIKE '%cart%' OR 
    table_name LIKE '%payment%'
)
ORDER BY table_name;