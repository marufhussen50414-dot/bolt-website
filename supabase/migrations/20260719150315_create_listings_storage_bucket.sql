/*
# Storage bucket for listing images (public, multi-file per seller)

1. Overview
The Sell ID form now uploads images directly from the user's device instead
of pasting image URLs. This migration creates a public storage bucket named
`listings` and storage policies so any authenticated user can upload their
own listing images, and anyone (including anon) can view them.

2. Storage
- Bucket `listings` (public = true, unlimited file size, no MIME restrictions
  enforced at the bucket level — validation is handled in the app).
- Folder convention: `listings/<user_id>/<uuid>.<ext>`.

3. Security (storage policies)
- SELECT (read): public — TO anon, authenticated USING (true). Listing
  images must be viewable by all visitors, including logged-out buyers.
- INSERT: authenticated only, owner-scoped — the path must start with the
  uploader's auth.uid() so a user can only write into their own folder.
- UPDATE / DELETE: authenticated only, owner-scoped to the uploader's
  folder (so a seller can replace or remove their own listing images).

4. Important notes
- Safe to re-run: policies are dropped before re-created; bucket uses
  IF NOT EXISTS via an explicit existence check.
- No database tables are modified — this is storage-only.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'listings') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('listings', 'listings', true);
  END IF;
END $$;

-- SELECT (public read)
DROP POLICY IF EXISTS "public_read_listing_images" ON storage.objects;
CREATE POLICY "public_read_listing_images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'listings');

-- INSERT (owner-scoped)
DROP POLICY IF EXISTS "insert_own_listing_images" ON storage.objects;
CREATE POLICY "insert_own_listing_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text);

-- UPDATE (owner-scoped)
DROP POLICY IF EXISTS "update_own_listing_images" ON storage.objects;
CREATE POLICY "update_own_listing_images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text);

-- DELETE (owner-scoped)
DROP POLICY IF EXISTS "delete_own_listing_images" ON storage.objects;
CREATE POLICY "delete_own_listing_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text);
