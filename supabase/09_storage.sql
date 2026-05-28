-- ═══════════════════════════════════════════════════════════════════════════
-- MAKANJOM — STEP 9: STORAGE + SCHEMA ADDITIONS
-- • Creates the makanjom-uploads Storage bucket
-- • Adds is_published + cover_image_url columns to articles
-- Run AFTER 02_schema.sql. Safe to re-run (IF NOT EXISTS / ON CONFLICT).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Storage bucket ───────────────────────────────────────────────────────────
-- Public bucket: uploaded images are readable without auth.
-- Max file size: 5 MB.  Allowed types: JPEG, PNG, WebP, GIF.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'makanjom-uploads',
  'makanjom-uploads',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ─── Storage RLS policies ────────────────────────────────────────────────────
-- Drop existing policies first so this is idempotent
DROP POLICY IF EXISTS "makanjom_uploads_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "makanjom_uploads_auth_insert"  ON storage.objects;
DROP POLICY IF EXISTS "makanjom_uploads_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "makanjom_uploads_owner_update" ON storage.objects;

-- Anyone (including anon) can view objects in this bucket
CREATE POLICY "makanjom_uploads_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'makanjom-uploads');

-- Authenticated users can upload files (path: <uid>/filename)
CREATE POLICY "makanjom_uploads_auth_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'makanjom-uploads');

-- Users can delete their own files (first path segment = their uid)
CREATE POLICY "makanjom_uploads_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'makanjom-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update (replace) their own files
CREATE POLICY "makanjom_uploads_owner_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'makanjom-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Articles — add draft + cover image support ───────────────────────────────
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
