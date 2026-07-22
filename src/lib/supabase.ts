import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  sort_order: number | null
}

export type Profile = {
  id: string
  username: string | null
  full_name: string
  phone: string | null
  avatar_url: string | null
  bio: string | null
  trust_score: number | null
  total_sales: number | null
  is_verified: boolean | null
  is_banned: boolean | null
  location: string | null
  discord: string | null
  whatsapp: string | null
  created_at: string
}

export type GameListing = {
  id: string
  seller_id: string
  category_id: string | null
  game_name: string
  title: string
  description: string | null
  price: number
  account_level: number | null
  rank_tier: string | null
  account_id_display: string | null
  server_region: string | null
  images: string[] | null
  status: string
  is_featured: boolean | null
  view_count: number | null
  tags: string[] | null
  prime: number | null
  evo_max_count: number | null
  created_at: string
  updated_at: string
}

/** A listing joined with its seller profile, as fetched for display. */
export type ListingWithProfile = GameListing & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url' | 'is_verified'> | null
}

export type GameListingInsert = {
  category_id?: string | null
  game_name: string
  title: string
  description?: string | null
  price: number
  account_level?: number | null
  rank_tier?: string | null
  account_id_display?: string | null
  server_region?: string | null
  images?: string[] | null
  tags?: string[] | null
  prime?: number | null
  evo_max_count?: number | null
}
