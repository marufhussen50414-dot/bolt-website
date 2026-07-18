/*
# GameHaatBD - Game ID Marketplace Schema

1. Overview
বাংলাদেশের জন্য একটি গেম আইডি মার্কেটপ্লেস যেখানে ইউজাররা Free Fire, PUBG, Call of Duty ইত্যাদি গেমের আইডি কিনতে ও বিক্রি করতে পারবেন। পেমেন্ট bKash, Nagad, এবং Card এর মাধ্যমে। প্রতিটি লেনদেনে ২% কমিশন ওয়েবসাইটে যাবে।

2. New Tables
- `profiles` - ইউজার প্রোফাইল (auth.users এর সাথে লিংকড)
- `game_listings` - বিক্রির জন্য গেম আইডি লিস্টিং
- `orders` - কেনার অর্ডার (commission + seller amount সহ)
- `transactions` - পেমেন্ট লেনদেন
- `reviews` - বায়ার/সেলার রিভিউ
- `categories` - গেম ক্যাটাগরি

3. Commission Logic
প্রতিটি সফল অর্ডারে ২% কমিশন ওয়েবসাইটে যাবে। সেলার পাবে (price - 2%)। ট্রিগার দিয়ে অটো-কম্পিউট।

4. Security (RLS)
- সব টেবিলে RLS এনাবল।
- profiles: পাবলিক রিড, নিজের আপডেট/ইনসার্ট।
- game_listings: পাবলিক রিড (approved/active), সেলার ম্যানেজ।
- orders: শুধু buyer ও seller দেখতে পারবে।
- transactions: শুধু buyer দেখতে পারবে।
- reviews: পাবলিক রিড, buyer ইনসার্ট।
- categories: পাবলিক রিড।

5. Important Notes
- user_id কলামগুলো DEFAULT auth.uid() সহ।
- কমিশন রেট 2% ডিফল্ট।
- সব মাইগ্রেশন রি-রান করা নিরাপদ (DROP IF EXISTS + CREATE)।
*/

-- ============ CATEGORIES TABLE ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  description text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories"
  ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- ============ PROFILES TABLE ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  bio text,
  trust_score numeric DEFAULT 0,
  total_sales int DEFAULT 0,
  total_purchases int DEFAULT 0,
  is_verified boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
CREATE POLICY "public_read_profiles"
  ON profiles FOR SELECT
  TO anon, authenticated USING (is_banned = false OR id = auth.uid());

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

-- ============ GAME_LISTINGS TABLE ============
CREATE TABLE IF NOT EXISTS game_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  game_name text NOT NULL,
  title text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price > 0),
  account_level int,
  rank_tier text,
  account_id_display text,
  server_region text,
  images text[],
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','active','sold','rejected','delisted')),
  is_featured boolean DEFAULT false,
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE game_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_listings" ON game_listings;
CREATE POLICY "read_listings"
  ON game_listings FOR SELECT
  TO anon, authenticated USING (
    status IN ('approved','active','sold')
    OR seller_id = auth.uid()
  );

DROP POLICY IF EXISTS "insert_own_listings" ON game_listings;
CREATE POLICY "insert_own_listings"
  ON game_listings FOR INSERT
  TO authenticated WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "update_own_listings" ON game_listings;
CREATE POLICY "update_own_listings"
  ON game_listings FOR UPDATE
  TO authenticated USING (seller_id = auth.uid()) WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_listings" ON game_listings;
CREATE POLICY "delete_own_listings"
  ON game_listings FOR DELETE
  TO authenticated USING (seller_id = auth.uid());

-- ============ ORDERS TABLE ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES game_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  commission_rate numeric NOT NULL DEFAULT 0.02,
  commission_amount numeric NOT NULL,
  seller_amount numeric NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('bkash','nagad','card')),
  payment_number text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','delivering','completed','cancelled','disputed','refunded')),
  escrow_released boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT buyer_not_seller CHECK (buyer_id != seller_id)
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_orders" ON orders;
CREATE POLICY "read_own_orders"
  ON orders FOR SELECT
  TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "create_orders" ON orders;
CREATE POLICY "create_orders"
  ON orders FOR INSERT
  TO authenticated WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "update_own_orders" ON orders;
CREATE POLICY "update_own_orders"
  ON orders FOR UPDATE
  TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- ============ TRANSACTIONS TABLE ============
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('bkash','nagad','card')),
  amount numeric NOT NULL,
  txn_id text,
  sender_number text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','failed','refunded')),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_transactions" ON transactions;
CREATE POLICY "read_own_transactions"
  ON transactions FOR SELECT
  TO authenticated USING (buyer_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions"
  ON transactions FOR INSERT
  TO authenticated WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions"
  ON transactions FOR UPDATE
  TO authenticated USING (buyer_id = auth.uid()) WITH CHECK (buyer_id = auth.uid());

-- ============ REVIEWS TABLE ============
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews"
  ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_reviews" ON reviews;
CREATE POLICY "insert_own_reviews"
  ON reviews FOR INSERT
  TO authenticated WITH CHECK (reviewer_id = auth.uid());

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_listings_status ON game_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON game_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON game_listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_price ON game_listings(price);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);

-- ============ UPDATED_AT TRIGGER FUNCTION ============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_listings ON game_listings;
CREATE TRIGGER set_updated_at_listings BEFORE UPDATE ON game_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_orders ON orders;
CREATE TRIGGER set_updated_at_orders BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============ AUTO-COMPUTE COMMISSION ON ORDER INSERT ============
CREATE OR REPLACE FUNCTION compute_order_commission()
RETURNS trigger AS $$
BEGIN
  NEW.commission_amount := ROUND(NEW.price * NEW.commission_rate, 2);
  NEW.seller_amount := ROUND(NEW.price - NEW.commission_amount, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_commission ON orders;
CREATE TRIGGER trg_compute_commission BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION compute_order_commission();

-- ============ SEED CATEGORIES ============
INSERT INTO categories (name, slug, icon, description, sort_order) VALUES
('Free Fire', 'free-fire', 'flame', 'Garena Free Fire আইডি', 1),
('PUBG Mobile', 'pubg-mobile', 'crosshair', 'PUBG Mobile আইডি', 2),
('Call of Duty Mobile', 'cod-mobile', 'target', 'COD Mobile আইডি', 3),
('Clash of Clans', 'coc', 'shield', 'Clash of Clans আইডি', 4),
('Mobile Legends', 'mlbb', 'sword', 'Mobile Legends Bang Bang আইডি', 5),
('Valorant', 'valorant', 'zap', 'Valorant আইডি', 6),
('Others', 'others', 'gamepad', 'অন্যান্য গেম আইডি', 99)
ON CONFLICT (slug) DO NOTHING;
