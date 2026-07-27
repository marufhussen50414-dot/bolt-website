export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
};

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  discord: string | null;
  whatsapp: string | null;
  preferred_payment: string | null;
  bkash_number: string | null;
  nagad_number: string | null;
  is_online: boolean;
  last_seen: string | null;
  response_rate: number;
  total_earnings: number;
  items_sold: number;
  trust_score: number;
  total_sales: number;
  total_purchases: number;
  is_verified: boolean;
  is_banned: boolean;
  created_at: string;
};

export type ListingStatus = "pending" | "approved" | "active" | "sold" | "rejected" | "delisted";

export type GameListing = {
  id: string;
  seller_id: string;
  category_id: string | null;
  game_name: string;
  title: string;
  description: string | null;
  price: number;
  account_level: number | null;
  rank_tier: string | null;
  account_id_display: string | null;
  server_region: string | null;
  images: string[] | null;
  tags: string[] | null;
  status: ListingStatus;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  seller?: Profile;
  category?: Category;
};

export type OrderStatus = "pending" | "paid" | "delivering" | "completed" | "cancelled" | "disputed" | "refunded";

export type Order = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  price: number;
  commission_rate: number;
  commission_amount: number;
  seller_amount: number;
  payment_method: "bkash" | "nagad" | "card";
  payment_number: string | null;
  status: OrderStatus;
  escrow_released: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  listing?: GameListing;
  buyer?: Profile;
  seller?: Profile;
};

export type Review = {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: Profile;
};

export type Conversation = {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  created_at: string;
  listing?: GameListing | null;
  buyer?: Profile;
  seller?: Profile;
};

export type OfferStatus = "pending" | "accepted" | "declined" | "paid" | "expired";

export type Offer = {
  id: string;
  conversation_id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  offer_price: number;
  status: OfferStatus;
  responded_at: string | null;
  paid_order_id: string | null;
  created_at: string;
  updated_at: string;
  listing?: Pick<GameListing, "id" | "title" | "price" | "images" | "game_name" | "status"> | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  offer_id: string | null;
  image_url: string | null;
  offer?: Offer | null;
};
