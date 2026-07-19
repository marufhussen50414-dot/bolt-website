/*
# Private messaging between buyers and sellers

1. Overview
The marketplace now supports private 1-to-1 conversations between a buyer and
a seller. A conversation is tied to a specific game listing so that the
discussion always has context (which account is being negotiated). Buyers
start a conversation from a listing; the seller can reply. Only the two
participants can see or interact with the conversation and its messages.

2. New Tables

- `conversations`
  - `id` (uuid, primary key)
  - `listing_id` (uuid, not null) — the game listing this chat is about.
    References game_listings(id) ON DELETE CASCADE.
  - `buyer_id` (uuid, not null, default auth.uid()) — the user who started
    the conversation. References profiles(id) ON DELETE CASCADE.
  - `seller_id` (uuid, not null) — the listing's seller. References
    profiles(id) ON DELETE CASCADE.
  - `last_message_at` (timestamptz, default now()) — bumped on each new
    message so the inbox can be sorted by recency.
  - `created_at` (timestamptz, default now())
  - Unique constraint on (listing_id, buyer_id, seller_id) so a buyer and
    seller only ever have one thread per listing.
  - CHECK that buyer and seller are different users.

- `messages`
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, not null) — references conversations(id)
    ON DELETE CASCADE.
  - `sender_id` (uuid, not null, default auth.uid()) — who sent the message.
    References profiles(id) ON DELETE CASCADE.
  - `body` (text, not null) — the message text. Cannot be empty
    (CHECK length(btrim(body)) > 0).
  - `read_at` (timestamptz, nullable) — set when the recipient reads it.
  - `created_at` (timestamptz, default now())

3. Security (RLS)
- Both tables get RLS enabled.
- conversations: SELECT only if you are the buyer or the seller; INSERT only
  if you are the buyer (buyers start chats); UPDATE only participants
  (e.g. to bump last_message_at) ; DELETE only if you are a participant.
- messages: SELECT only if you are a participant of the parent conversation
  (via EXISTS subquery); INSERT only if you are a participant AND the
  sender; UPDATE only your own messages (for read receipts the recipient
  updates rows where they are not the sender but ARE a participant — covered
  by the participant check in the EXISTS clause); DELETE only your own
  messages.
- All policies scoped TO authenticated because the app has a sign-in flow.

4. Important notes
- buyer_id and sender_id default to auth.uid() so client inserts that omit
  the owner id still satisfy the WITH CHECK ownership predicate.
- Safe to re-run: every CREATE TABLE uses IF NOT EXISTS and every policy is
  dropped before re-created.
- No existing tables are modified, renamed, or dropped — purely additive.
*/

-- ============ CONVERSATIONS TABLE ============
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES game_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (listing_id, buyer_id, seller_id),
  CONSTRAINT buyer_not_seller_conv CHECK (buyer_id != seller_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_conversations" ON conversations;
CREATE POLICY "select_own_conversations"
  ON conversations FOR SELECT
  TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_conversations" ON conversations;
CREATE POLICY "insert_own_conversations"
  ON conversations FOR INSERT
  TO authenticated WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "update_own_conversations" ON conversations;
CREATE POLICY "update_own_conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_conversations" ON conversations;
CREATE POLICY "delete_own_conversations"
  ON conversations FOR DELETE
  TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- ============ MESSAGES TABLE ============
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(btrim(body)) > 0),
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_participant_messages" ON messages;
CREATE POLICY "select_participant_messages"
  ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "insert_participant_messages" ON messages;
CREATE POLICY "insert_participant_messages"
  ON messages FOR INSERT
  TO authenticated WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "update_participant_messages" ON messages;
CREATE POLICY "update_participant_messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages"
  ON messages FOR DELETE
  TO authenticated USING (sender_id = auth.uid());

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_conversations_listing ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_recent ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- ============ BUMP last_message_at ON NEW MESSAGE ============
CREATE OR REPLACE FUNCTION bump_conversation_last_message()
RETURNS trigger AS $$
BEGIN
  UPDATE conversations
    SET last_message_at = now()
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_conversation ON messages;
CREATE TRIGGER trg_bump_conversation AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION bump_conversation_last_message();
