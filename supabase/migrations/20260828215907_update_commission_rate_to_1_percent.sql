/*
  # Update commission rate from 2% to 1%

  1. Changes
    - Change the default `commission_rate` on `orders` from 0.02 to 0.01,
      so every new order is charged 1% commission going forward.
    - Recompute `commission_rate`, `commission_amount`, and `seller_amount`
      for any existing orders that are still `pending` (not yet paid/settled),
      so they reflect the new 1% rate too. Orders that have already been
      paid, completed, or otherwise settled are left untouched so past
      transactions stay accurate.
*/

ALTER TABLE orders ALTER COLUMN commission_rate SET DEFAULT 0.01;

UPDATE orders
SET
  commission_rate = 0.01,
  commission_amount = ROUND(price * 0.01, 2),
  seller_amount = ROUND(price - ROUND(price * 0.01, 2), 2)
WHERE status = 'pending';
