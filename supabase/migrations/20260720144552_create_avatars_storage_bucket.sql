/*
# Storage bucket for profile avatars (public, owner-scoped uploads)

1. Overview
The Edit Profile form now uploads a profile picture directly from the user's
device instead of pasting an image URL. This migration creates a public storage
bucket named `avatars` with storage policies so any authenticated user can
upload their own avatar, and anyone (including anon) can view avatars.

2. Storage
- Bucket `avatars` (public = true).
- Folder convention: `avatars/<user_id>/<uuid>.<ext>`.

3. Security (storage policies)
- SELECT (read): public — TO anon, authenticated USING (bucket_id = 'avatars').
  Avatars must be viewable by all visitors, including logged-out users.
- INSERT: authenticated only, owner-scoped — the path's first segment must equal
  the uploader's auth.uid().
- UPDATE / DELETE: authenticated only, owner-scoped to the uploader's folder.

4. Important notes
- Safe to re-run: policies are dropped before re-created; bucket uses IF NOT EXISTS.
- No database tables are modified — storage-only.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
  END IF;
END $$;

-- SELECT (public read)
DROP POLICY IF EXISTS "public_read_avatars" ON storage.objects;
CREATE POLICY "public_read_avatars"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');

-- INSERT (owner-scoped)
DROP POLICY IF EXISTS "insert_own_avatar" ON storage.objects;
CREATE POLICY "insert_own_avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- UPDATE (owner-scoped)
DROP POLICY IF EXISTS "update_own_avatar" ON storage.objects;
CREATE POLICY "update_own_avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- DELETE (owner-scoped)
DROP POLICY IF EXISTS "delete_own_avatar" ON storage.objects;
CREATE POLICY "delete_own_avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
