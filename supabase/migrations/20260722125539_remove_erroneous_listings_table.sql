/*
# Remove erroneous empty `listings` table

1. Context
- An earlier migration (`create_listings_table`) created a `listings` table.
- This was a mistake: the real application already uses the `game_listings` table
  (created by migration `20260720203729_create_listings.sql`), which has its own
  `tags` column, mature RLS policies, and 3 real listings.
- The `listings` table has 0 rows and is referenced by nothing in the real schema.
2. Changes
- DROP TABLE IF EXISTS listings.
3. Safety
- The table is empty (verified 0 rows). No user data is affected.
- The real `game_listings` table and all its data/policies are untouched.
*/

DROP TABLE IF EXISTS listings;
