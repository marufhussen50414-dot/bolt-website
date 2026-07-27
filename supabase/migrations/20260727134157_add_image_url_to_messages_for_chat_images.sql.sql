/*
# Add image support to chat messages

1. Overview
Updates the messaging system so both buyers and sellers can send images
inside a conversation. Previously every message required non-empty text;
now a message can be an image-only message, a text-only message, or both.

2. Modified Tables
- `messages`
  - NEW column `image_url` (text, nullable) — public URL of an uploaded
    chat image stored in the `chat-images` storage bucket. Null when the
    message is text-only.
  - The existing CHECK constraint `messages_body_check` (length(btrim(body)) > 0)
    is REPLACED with a new constraint `messages_body_or_image_check` that
    requires EITHER a non-empty body OR a non-null image_url. This allows
    image-only messages while still preventing completely empty messages.

3. New Storage Bucket
- Bucket `chat-images` (public = true) — holds chat images uploaded by
  authenticated users.
- Folder convention: `chat-images/<user_id>/<uuid>.<ext>`.
- Storage policies:
  - SELECT (read): public — TO anon, authenticated. Chat images must be
    viewable by both conversation participants.
  - INSERT: authenticated only, owner-scoped — path must start with the
    uploader's auth.uid().
  - UPDATE / DELETE: authenticated only, owner-scoped to the uploader's
    folder.

4. Security
- No changes to existing RLS policies on `messages` or `conversations`.
  The participant-based access control already restricts who can insert
  and read messages; image_url is just another column on the same row.
- The new storage bucket follows the same owner-scoped pattern as the
  existing `listings` bucket.

5. Important notes
- Safe to re-run: column addition is guarded with IF NOT EXISTS; the old
  CHECK constraint is dropped before the new one is created; bucket uses
  an existence check; storage policies are dropped before re-created.
- No data is lost: the body column and all existing rows are preserved.
  The only schema change is adding a nullable column and swapping the
  body CHECK for a more permissive body-or-image CHECK.
*/

-- ============ ADD image_url COLUMN ============
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'image_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN image_url text;
  END IF;
END $$;

-- ============ RELAX body CHECK to allow image-only messages ============
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_body_check;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_body_or_image_check;
ALTER TABLE messages ADD CONSTRAINT messages_body_or_image_check
  CHECK (length(btrim(body)) > 0 OR image_url IS NOT NULL);

-- ============ STORAGE BUCKET ============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'chat-images') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('chat-images', 'chat-images', true);
  END IF;
END $$;

-- SELECT (public read)
DROP POLICY IF EXISTS "public_read_chat_images" ON storage.objects;
CREATE POLICY "public_read_chat_images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'chat-images');

-- INSERT (owner-scoped)
DROP POLICY IF EXISTS "insert_own_chat_images" ON storage.objects;
CREATE POLICY "insert_own_chat_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- UPDATE (owner-scoped)
DROP POLICY IF EXISTS "update_own_chat_images" ON storage.objects;
CREATE POLICY "update_own_chat_images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- DELETE (owner-scoped)
DROP POLICY IF EXISTS "delete_own_chat_images" ON storage.objects;
CREATE POLICY "delete_own_chat_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);
