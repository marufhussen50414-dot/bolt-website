/*
# Create listings table, storage bucket, and view-count RPC

## Purpose
A gaming-account marketplace where authenticated users create listings (Sell form)
and anyone can browse them. Each listing belongs to one game and may carry game-specific
attributes (e.g. a "Prime" level for Free Fire), generic highlights (Level, Evo Max
count), and a set of custom highlight tags. Image uploads are mandatory.

## 1. New Tables
- `listings`
  - `id`            uuid, primary key
  - `user_id`       uuid, NOT NULL, defaults to auth.uid() — the seller/owner
  - `game`          text, NOT NULL — e.g. "Free Fire", "PUBG Mobile"
  - `title`         text, NOT NULL
  - `description`   text — longer seller notes
  - `price`         numeric(12,2), NOT NULL — asking price in USD
  - `prime`         int, nullable — Free Fire-only field, constrained 0..8
  - `level`         int, nullable — account level highlight
  - `evo_max_count` int, nullable — count of Evo Max items highlight
  - `tags`          text[], default '{}' — custom highlight tags (e.g. "Diamond Rank")
  - `image_urls`    text[], NOT NULL — at least one image URL is required
  - `views`         int, NOT NULL, default 0 — listing view counter
  - `created_at`    timestamptz, default now()

## 2. Constraints
- `listings_prime_check`: prime must be between 0 and 8 (NULL allowed for non-Free-Fire games).
- `listings_price_check`: price must be >= 0.
- Index on `created_at` (desc) for browse ordering and on `game` for filtering.

## 3. Storage
- Public bucket `listing-images` created if missing.
- Policies: anyone may read; authenticated users may upload; only the object owner
  (the uploader) may update/delete their own uploaded objects.

## 4. Row Level Security (listings)
- SELECT is public (anon + authenticated) so the marketplace can be browsed without sign-in.
- INSERT / UPDATE / DELETE are owner-scoped to the authenticated seller via auth.uid().

## 5. View-count RPC
- `increment_listing_view(p_listing_id uuid, p_viewer_id uuid)` is a SECURITY DEFINER
  function that atomically increments `listings.views` ONLY when the viewer is not the
  owner. If `p_viewer_id` is NULL (anonymous viewer) it always increments. This enforces
  the "owner views do not count" rule server-side so it cannot be bypassed by the client.
- Execute granted to anon and authenticated.
*/

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  game text NOT NULL,
  title text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  prime int,
  level int,
  evo_max_count int,
  tags text[] NOT NULL DEFAULT '{}',
  image_urls text[] NOT NULL,
  views int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listings_prime_check CHECK (prime IS NULL OR (prime >= 0 AND prime <= 8)),
  CONSTRAINT listings_price_check CHECK (price >= 0)
);

CREATE INDEX IF NOT EXISTS listings_created_at_idx ON listings (created_at DESC);
CREATE INDEX IF NOT EXISTS listings_game_idx ON listings (game);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_listings" ON listings;
CREATE POLICY "public_select_listings"
  ON listings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_own_listings" ON listings;
CREATE POLICY "insert_own_listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_listings" ON listings;
CREATE POLICY "update_own_listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_listings" ON listings;
CREATE POLICY "delete_own_listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Storage bucket for listing images (public so images load without signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_listing_images" ON storage.objects;
CREATE POLICY "public_read_listing_images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "auth_upload_listing_images" ON storage.objects;
CREATE POLICY "auth_upload_listing_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "owner_update_listing_images" ON storage.objects;
CREATE POLICY "owner_update_listing_images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'listing-images' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "owner_delete_listing_images" ON storage.objects;
CREATE POLICY "owner_delete_listing_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'listing-images' AND owner = auth.uid());

-- View-count increment RPC (owner views do not increment)
CREATE OR REPLACE FUNCTION increment_listing_view(p_listing_id uuid, p_viewer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE listings
  SET views = views + 1
  WHERE id = p_listing_id
    AND (p_viewer_id IS NULL OR user_id <> p_viewer_id);
END;
$$;

GRANT EXECUTE ON FUNCTION increment_listing_view(uuid, uuid) TO anon, authenticated;
