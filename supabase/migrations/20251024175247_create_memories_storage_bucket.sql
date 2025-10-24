/*
  # Create Storage Bucket for Memories

  ## Changes
  - Create a public storage bucket for memory photos
  - Set up RLS policies for the bucket
  - Allow authenticated users to upload to their own folders
  - Allow public read access to all images
*/

-- Create storage bucket for memories
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own memory images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own memory images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own memory images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view memory images" ON storage.objects;

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload own memory images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'memories' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own memory images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'memories'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'memories'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own memory images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'memories'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all memory images
CREATE POLICY "Public can view memory images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'memories');