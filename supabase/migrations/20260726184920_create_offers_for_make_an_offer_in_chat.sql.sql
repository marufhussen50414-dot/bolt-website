/*
# Make-an-Offer feature inside chat

1. Overview
Adds a "Make an Offer" flow to the buyer/seller chat. A user opens a popup
inside a conversation, picks one of the OTHER party's active listings, types a
custom offer price, and sends it. The offer appears in the chat stream as an
interactive offer card. The recipient (the listing's seller) can Accept or
Decline it right from the card. Once accepted, the offer maker (buyer) gets a
"Pay" button on the card that takes them to checkout at the agreed offered
price (commission is computed on the offered price, not the original).

2. New Tables
- `offers`
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, not null) — the chat the offer lives in.
    References conversations(id) ON DELETE CASCADE.
  - `listing_id` (uuid, not null) — the listing being offered on.
    References game_listings(id) ON DELETE CASCADE.
  - `buyer_id` (uuid, not null, default auth.uid()) — the user making the
    offer (the one who will pay). References profiles(id) ON DELETE CASCADE.
  - `seller_id` (uuid, not null) — the listing owner / offer recipient.
    References profiles(id) ON DELETE CASCADE.
  - `offer_price` (numeric, not null, > 0) — the negotiated price proposed.
  - `status` (text, not null, default 'pending') — one of
    'pending', 'accepted', 'declined', 'paid', 'expired'.
  - `responded_at` (timestamptz, nullable) — set when the seller accepts/declines.
  - `paid_order_id` (uuid, nullable) — set to the orders.id once the buyer
    pays via this offer. References orders(id) ON DELETE SET NULL.
  - `created_at`, `updated_at` (timestamptz)
  - CHECK that buyer and seller are different users.

3. Modified Tables
- `messages`
  - Adds nullable `offer_id` column (uuid) referencing offers(id)
    ON DELETE SET NULL. When set, the message is an offer card and the chat
    renders the interactive card instead of a plain text bubble. The existing
    `body` NOT NULL + non-empty CHECK is preserved (offer messages still
    carry a short summary text as a fallback). No existing columns or
    constraints are dropped or changed.

4. Security (RLS)
- `offers`: RLS enabled.
  - SELECT: only the offer's buyer or seller.
  - INSERT: only the offer maker (buyer_id = auth.uid()).
  - UPDATE: either participant (seller accepts/declines; buyer marks paid
    after checkout).
  - DELETE: either participant.
- `messages`: no policy changes needed — the existing participant-scoped
  SELECT/INSERT/UPDATE policies already cover offer messages. The new
  `offer_id` column is just data carried alongside.

5. Important notes
- Safe to re-run: CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
  DROP POLICY IF EXISTS before CREATE, DROP/ADD CONSTRAINT for the
  paid_order_id FK.
- No existing tables are renamed, no columns dropped or retyped, no data
  lost. The messages body CHECK is intentionally left untouched.
- The existing `trg_bump_conversation` trigger still fires for offer
  messages (they are regular message rows), so conversation recency stays
  correct with no extra plumbing.
- Order commission is computed by the existing `compute_order_commission`
  trigger from the order's `price` column. Checkout inserts the order with
  price = offer_price, so commission is correctly calculated on the agreed
  offered price.
*/

-- ============ OFFERS TABLE ============
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES game_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_price numeric NOT NULL CHECK (offer_price > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','paid','expired')),
  responded_at timestamptz,
  paid_order_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT buyer_not_seller_offer CHECK (buyer_id != seller_id)
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_participant_offers" ON offers;
CREATE POLICY "select_participant_offers"
  ON offers FOR SELECT
  TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "insert_buyer_offers" ON offers;
CREATE POLICY "insert_buyer_offers"
  ON offers FOR INSERT
  TO authenticated WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "update_participant_offers" ON offers;
CREATE POLICY "update_participant_offers"
  ON offers FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "delete_participant_offers" ON offers;
CREATE POLICY "delete_participant_offers"
  ON offers FOR DELETE
  TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- paid_order_id -> orders(id) FK, added separately for idempotency.
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_paid_order_id_fkey;
ALTER TABLE offers ADD CONSTRAINT offers_paid_order_id_fkey
  FOREIGN KEY (paid_order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- ============ ADD offer_id TO messages ============
ALTER TABLE messages ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES offers(id) ON DELETE SET NULL;

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_offers_conversation ON offers(conversation_id);
CREATE INDEX IF NOT EXISTS idx_offers_listing ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller ON offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_messages_offer ON messages(offer_id) WHERE offer_id IS NOT NULL;

-- ============ updated_at TRIGGER FOR offers ============
DROP TRIGGER IF EXISTS set_updated_at_offers ON offers;
CREATE TRIGGER set_updated_at_offers BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
