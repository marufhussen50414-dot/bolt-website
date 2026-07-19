-- Newly created listings go live immediately (no manual moderation step yet).
-- Home.tsx fetches status IN ('approved','active'); the previous default 'pending'
-- caused freshly submitted IDs to be filtered out of the homepage.
alter table public.game_listings
  alter column status set default 'active';
