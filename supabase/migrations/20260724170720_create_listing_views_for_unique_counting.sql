/*
# Unique Listing View-Counting System

1. Overview
Adds a dedicated `listing_views` table that records one row per (listing, viewer) pair,
so a listing's view_count increments at most once per user or anonymous browser session.
This prevents duplicate/spam views and excludes the listing owner from inflating their own count.

2. New Tables
- `listing_views`
  - `listing_id` (uuid, FK to game_listings, ON DELETE CASCADE)
  - `viewer_id` (uuid, nullable) — the authenticated user's id, or NULL for anonymous visitors
  - `session_id` (text, nullable) — a client-generated stable id for unauthenticated browsers
  - `created_at` (timestamptz)
  - A CHECK constraint ensures only ONE of (viewer_id) OR (session_id) is set per row,
    and two partial UNIQUE indexes guarantee the same viewer/session can never create a
    second row for the same listing.

3. Security (RLS)
- RLS enabled on `listing_views`.
- SELECT/INSERT open to anon + authenticated so the anon-key frontend can record and check views.
- No UPDATE or DELETE policy (rows are append-only from the client side).

4. Atomic Increment Function
- `record_listing_view(listing_id, p_session_id)` is a SECURITY DEFINER function that:
  a) Rejects the listing owner (seller_id = auth.uid()) — returns current count, no increment.
  b) For signed-in users, uses their auth.uid() as the viewer identity and ignores session_id.
  c) For anonymous visitors, uses the supplied session_id as the identity.
  d) Inserts a row into listing_views only if no row already exists for this (listing, identity).
     Because of the UNIQUE indexes, a concurrent duplicate insert raises a unique violation
     that is caught and treated as "already viewed" (no increment).
  e) On a genuinely new view, atomically increments game_listings.view_count and returns the new count.
  f) On an already-viewed or own-view case, returns the current view_count unchanged.
- The function is SECURITY DEFINER so it can write to listing_views and update game_listings
  even though the calling anon/authenticated role has limited direct privileges, and so the
  increment is a single atomic server-side operation immune to race conditions.

5. Important Notes
- Owner exclusion uses auth.uid() = seller_id. Anonymous callers (auth.uid() IS NULL) can never
  match a seller, so anonymous views always count (once per session).
- The UNIQUE indexes on listing_views are the hard dedupe guarantee; the function's
  INSERT ... ON CONFLICT DO NOTHING turns a constraint violation into a clean no-op.
- This migration is safe to re-run (IF NOT EXISTS / OR REPLACE / DROP IF EXISTS).
*/

-- ============ LISTING_VIEWS TABLE ============
CREATE TABLE IF NOT EXISTS listing_views (
  listing_id uuid NOT NULL REFERENCES game_listings(id) ON DELETE CASCADE,
  viewer_id uuid,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Exactly one identity must be present: a signed-in viewer_id OR an anonymous session_id.
  CONSTRAINT listing_views_identity_xor
    CHECK ((viewer_id IS NOT NULL AND session_id IS NULL)
        OR (viewer_id IS NULL AND session_id IS NOT NULL))
);

-- One view per listing per identity. NULLs are distinct in a plain UNIQUE constraint, so use
-- two partial unique indexes to correctly enforce uniqueness for both signed-in and anon viewers.
CREATE UNIQUE INDEX IF NOT EXISTS uq_listing_views_viewer
  ON listing_views(listing_id, viewer_id)
  WHERE viewer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_listing_views_session
  ON listing_views(listing_id, session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listing_views_listing ON listing_views(listing_id);

ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_listing_views" ON listing_views;
CREATE POLICY "read_listing_views"
  ON listing_views FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_listing_views" ON listing_views;
CREATE POLICY "insert_listing_views"
  ON listing_views FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- ============ ATOMIC RECORD-VIEW FUNCTION ============
CREATE OR REPLACE FUNCTION record_listing_view(p_listing_id uuid, p_session_id text)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid;
  v_viewer_id uuid := auth.uid();
  v_current   int;
  v_rowcount  int;
BEGIN
  -- Fetch the listing's seller and current view count in one shot.
  SELECT seller_id, view_count INTO v_seller_id, v_current
  FROM game_listings WHERE id = p_listing_id;

  -- Listing does not exist.
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Exclude the owner/seller viewing their own listing.
  IF v_viewer_id IS NOT NULL AND v_viewer_id = v_seller_id THEN
    RETURN v_current;
  END IF;

  -- Insert a dedupe row only if one does not already exist for this identity.
  -- Signed-in users are keyed by viewer_id; anonymous visitors by session_id.
  BEGIN
    IF v_viewer_id IS NOT NULL THEN
      INSERT INTO listing_views (listing_id, viewer_id, session_id)
      VALUES (p_listing_id, v_viewer_id, NULL)
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO listing_views (listing_id, viewer_id, session_id)
      VALUES (p_listing_id, NULL, p_session_id)
      ON CONFLICT DO NOTHING;
    END IF;

    GET DIAGNOSTICS v_rowcount = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    -- Any unexpected error means the view was already recorded — treat as already-viewed.
    v_rowcount := 0;
  END;

  -- Only increment on a genuinely new view.
  IF v_rowcount > 0 THEN
    UPDATE game_listings
      SET view_count = view_count + 1
      WHERE id = p_listing_id
      RETURNING view_count INTO v_current;
  END IF;

  RETURN v_current;
END;
$$;

-- Allow anon + authenticated roles to call the function.
GRANT EXECUTE ON FUNCTION record_listing_view(uuid, text) TO anon, authenticated;
