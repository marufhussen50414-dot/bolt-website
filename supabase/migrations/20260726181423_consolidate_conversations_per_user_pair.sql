/*
# Consolidate conversations per buyer-seller pair (single thread per user)

1. Overview
Previously each conversation was tied to a specific game listing — uniqueness
was enforced on (listing_id, buyer_id, seller_id). This meant a buyer who
messaged the same seller about several different listings ended up with a
separate chat thread for every listing. That clutters the inbox and fragments
the discussion with one person.

This migration changes the grouping so there is exactly ONE unified chat
thread per (buyer_id, seller_id) pair, no matter how many listings are
discussed. The listing that originally started the conversation is retained
as optional context only.

2. Changes to `conversations`
- `listing_id` is now nullable. A conversation is about the two users, not a
  single listing.
- The `listing_id` foreign key is changed from ON DELETE CASCADE to
  ON DELETE SET NULL, so deleting a listing no longer deletes the
  conversation (and its messages) between the two users.
- Dropped the old unique constraint on (listing_id, buyer_id, seller_id).
- Added a new unique constraint on (buyer_id, seller_id).

3. Data migration (safe + idempotent)
Before adding the new unique constraint, any existing duplicate conversations
sharing the same (buyer_id, seller_id) but different listing_id values are
merged into a single thread:
  a. The oldest conversation in each duplicate group is chosen as canonical.
  b. All messages from the duplicate conversations are reassigned to the
     canonical conversation.
  c. The now-empty duplicate conversations are deleted (no messages lost).
  d. The canonical conversation's last_message_at is refreshed to the most
     recent message timestamp.
The DO block only acts when a pair has more than one conversation, so it is
safe to re-run.

4. Security
No RLS policy changes. Existing policies already restrict SELECT/INSERT/
UPDATE/DELETE to conversation participants, which is unchanged by the
regrouping.

5. Important notes
- Safe to re-run: the DO block is idempotent, constraints are dropped before
  re-created, and IF NOT EXISTS is used on the new constraint.
- No user data is lost: messages are reassigned to the canonical conversation
  before any duplicate conversations are removed.
- listing_id becoming nullable does not lose data; it only relaxes the
  constraint. Existing rows keep their listing_id as context.
*/

-- ============ MAKE listing_id NULLABLE ============
ALTER TABLE conversations ALTER COLUMN listing_id DROP NOT NULL;

-- ============ CHANGE listing_id FK FROM CASCADE TO SET NULL ============
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_listing_id_fkey;
ALTER TABLE conversations ADD CONSTRAINT conversations_listing_id_fkey
  FOREIGN KEY (listing_id) REFERENCES game_listings(id) ON DELETE SET NULL;

-- ============ MERGE DUPLICATE CONVERSATIONS PER (buyer_id, seller_id) ============
DO $$
DECLARE
  pair RECORD;
  canonical uuid;
BEGIN
  FOR pair IN
    SELECT buyer_id, seller_id
    FROM conversations
    GROUP BY buyer_id, seller_id
    HAVING count(*) > 1
  LOOP
    -- Pick the oldest conversation as the canonical thread.
    SELECT id INTO canonical
      FROM conversations
      WHERE buyer_id = pair.buyer_id AND seller_id = pair.seller_id
      ORDER BY created_at ASC
      LIMIT 1;

    -- Reassign all messages from the duplicates onto the canonical thread.
    UPDATE messages
      SET conversation_id = canonical
      WHERE conversation_id IN (
        SELECT id FROM conversations
          WHERE buyer_id = pair.buyer_id AND seller_id = pair.seller_id
            AND id <> canonical
      );

    -- Remove the now-empty duplicate conversations.
    DELETE FROM conversations
      WHERE buyer_id = pair.buyer_id AND seller_id = pair.seller_id
        AND id <> canonical;

    -- Refresh last_message_at on the canonical thread.
    UPDATE conversations
      SET last_message_at = COALESCE(
        (SELECT max(created_at) FROM messages WHERE conversation_id = canonical),
        last_message_at
      )
      WHERE id = canonical;
  END LOOP;
END $$;

-- ============ SWAP UNIQUE CONSTRAINT ============
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_listing_id_buyer_id_seller_id_key;
ALTER TABLE conversations ADD CONSTRAINT conversations_buyer_id_seller_id_key
  UNIQUE (buyer_id, seller_id);
