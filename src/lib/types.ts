export interface Profile {
  id: string;
  username: string | null;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  trust_score: number | null;
  total_sales: number | null;
  total_purchases: number | null;
  is_verified: boolean | null;
  is_banned: boolean | null;
  location: string | null;
  discord: string | null;
  whatsapp: string | null;
  preferred_payment: string | null;
  bkash_number: string | null;
  nagad_number: string | null;
  is_online: boolean | null;
  last_seen: string | null;
  response_rate: number | null;
  total_earnings: number | null;
  items_sold: number | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  sort_order: number | null;
}

export interface GameListing {
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
  status: string;
  is_featured: boolean | null;
  view_count: number | null;
  created_at: string;
  updated_at: string;
  prime: number | null;
  evo_max_count: number | null;
  tags: string[] | null;
  category?: Category | null;
  seller?: Pick<Profile, "id" | "username" | "full_name" | "avatar_url" | "is_verified"> | null;
}

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  created_at: string;
  listing?: Pick<GameListing, "id" | "title" | "game_name" | "price" | "images"> | null;
  seller?: Pick<Profile, "id" | "username" | "full_name" | "avatar_url" | "is_online"> | null;
  buyer?: Pick<Profile, "id" | "username" | "full_name" | "avatar_url"> | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export type ListingInsert = Omit<GameListing, "id" | "created_at" | "updated_at" | "view_count" | "status" | "is_featured" | "seller" | "category"> & {
  status?: string;
};
