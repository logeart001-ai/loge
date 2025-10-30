-- Fix admin access to user_profiles table
-- Run this in your Supabase SQL editor

-- Check current RLS policies on user_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can only update own profile" ON user_profiles;

-- Create admin-friendly policies
-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR 
        id = auth.uid()  -- Users can still view their own profile
    );

-- Allow admins to update any profile
CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR 
        id = auth.uid()  -- Users can still update their own profile
    );

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT 
    WITH CHECK (id = auth.uid());

-- Allow admins to delete profiles (be careful with this)
CREATE POLICY "Admins can delete profiles" ON user_profiles
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;