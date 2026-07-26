/*
# Reverse Make-an-Offer direction (seller → buyer)

1. Overview
The offer flow is now driven by the SELLER, not the buyer. When a seller and
buyer negotiate a lower price in chat, the SELLER clicks "Give Offer", picks
one of their OWN listings, enters a discounted price, and sends the offer to
the buyer. The buyer then pays directly from the offer card at the agreed
price. There is no accept/decline step — the buyer simply pays or ignores.

2. Security change (RLS)
- offers INSERT policy changed: previously only the buyer could insert
  (buyer_id = auth.uid()). Now only the SELLER can insert
  (seller_id = auth.uid()), because the seller is the one creating the offer.
- SELECT / UPDATE / DELETE policies unchanged (both participants can still
  read/update/delete, which lets the buyer mark the offer paid after checkout).

3. No schema changes
- buyer_id still = the user who pays; seller_id still = the listing owner.
- Status values unchanged: 'pending' now means "sent by seller, awaiting
  payment"; 'paid' means "buyer paid". 'accepted'/'declined' remain in the
  CHECK constraint for compatibility but are no longer set by the UI.

4. Safe to re-run: DROP IF EXISTS before CREATE.
*/

DROP POLICY IF EXISTS "insert_buyer_offers" ON offers;
DROP POLICY IF EXISTS "insert_seller_offers" ON offers;
CREATE POLICY "insert_seller_offers"
  ON offers FOR INSERT
  TO authenticated WITH CHECK (seller_id = auth.uid());
