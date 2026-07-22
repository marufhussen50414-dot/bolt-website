/*
# Create listings table (single-tenant, no auth)

1. New Tables
- `listings`
  - `id` (uuid, primary key)
  - `game` (text, not null) — the game the account belongs to, e.g. "Free Fire", "PUBG Mobile", "Valorant". Applies to ALL games, not just one.
  - `title` (text, not null) — short listing title.
  - `description` (text, not null) — longer description of the account.
  - `price` (numeric, not null) — asking price in the seller's currency.
  - `currency` (text, not null default 'USD') — price currency code.
  - `owner_name` (text, not null) — display name of the seller/owner shown on cards and detail pages (e.g. "maruf hussen").
  - `tags` (text[], not null default '{}') — dynamic, seller-entered tags as an array. Stored empty by default; only real tags the seller types in are saved. NEVER seeded with fake/sample/example tags.
  - `image_url` (text, nullable) — optional cover image URL for the listing card.
  - `level` (text, nullable) — optional account level/rank text.
  - `created_at` (timestamptz, default now()).
2. Security
- Enable RLS on `listings`.
- Allow anon + authenticated CRUD because the marketplace is intentionally public/shared (no sign-in screen). Anyone can browse, create, update, or delete listings.
3. Important notes
- The `tags` column is a native Postgres text array. It is always a real array (never null) so the frontend can iterate it directly without null checks.
- No sample/example tags are inserted by this migration. The table starts empty. Only tags explicitly entered by a seller through the Sell form are persisted and displayed.
*/

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'USD',
  owner_name text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  image_url text,
  level text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_listings" ON listings;
CREATE POLICY "anon_select_listings" ON listings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_listings" ON listings;
CREATE POLICY "anon_insert_listings" ON listings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_listings" ON listings;
CREATE POLICY "anon_update_listings" ON listings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_listings" ON listings;
CREATE POLICY "anon_delete_listings" ON listings FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS listings_created_at_idx ON listings (created_at DESC);
CREATE INDEX IF NOT EXISTS listings_game_idx ON listings (game);
