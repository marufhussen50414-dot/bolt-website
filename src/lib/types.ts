export type GameId =
  | "Free Fire"
  | "PUBG Mobile"
  | "Valorant"
  | "Genshin Impact"
  | "Call of Duty Mobile"
  | "Clash of Clans"
  | "Mobile Legends";

export interface Listing {
  id: string;
  user_id: string;
  game: string;
  title: string;
  description: string | null;
  price: number;
  prime: number | null;
  level: number | null;
  evo_max_count: number | null;
  tags: string[];
  image_urls: string[];
  views: number;
  created_at: string;
}

export interface NewListing {
  game: string;
  title: string;
  description: string | null;
  price: number;
  prime: number | null;
  level: number | null;
  evo_max_count: number | null;
  tags: string[];
  image_urls: string[];
}

export const GAME_OPTIONS: GameId[] = [
  "Free Fire",
  "PUBG Mobile",
  "Valorant",
  "Genshin Impact",
  "Call of Duty Mobile",
  "Clash of Clans",
  "Mobile Legends",
];
