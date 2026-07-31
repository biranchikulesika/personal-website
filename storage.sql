-- ==========================================================
-- storage.sql
-- Creates storage buckets and RLS policies
-- Safe to run multiple times
-- ==========================================================

-- Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('media', 'media', true),
    ('post-images', 'post-images', true),
    ('cover-images', 'cover-images', true),
    ('persona-assets', 'persona-assets', true),
    ('profile-assets', 'profile-assets', true),
    ('newsletter-assets', 'newsletter-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Remove existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;

-- Public read access
CREATE POLICY "Public Access"
ON storage.objects
FOR SELECT
USING (
    bucket_id IN (
        'media',
        'post-images',
        'cover-images',
        'persona-assets',
        'profile-assets',
        'newsletter-assets'
    )
);

-- Authenticated upload
CREATE POLICY "Admin Upload Access"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id IN (
        'media',
        'post-images',
        'cover-images',
        'persona-assets',
        'profile-assets',
        'newsletter-assets'
    )
);

-- Authenticated update
CREATE POLICY "Admin Update Access"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id IN (
        'media',
        'post-images',
        'cover-images',
        'persona-assets',
        'profile-assets',
        'newsletter-assets'
    )
)
WITH CHECK (
    bucket_id IN (
        'media',
        'post-images',
        'cover-images',
        'persona-assets',
        'profile-assets',
        'newsletter-assets'
    )
);

-- Authenticated delete
CREATE POLICY "Admin Delete Access"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id IN (
        'media',
        'post-images',
        'cover-images',
        'persona-assets',
        'profile-assets',
        'newsletter-assets'
    )
);