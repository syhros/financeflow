/*
  # Add Penny Stock and Currency Fields to Holdings

  1. Changes
    - Add `is_penny_stock` column to holdings table (boolean, defaults to false)
    - Add `currency_price` column to holdings table (text, stores currency code like GBP, GBX, USD)

  2. Purpose
    - Enable proper price conversion for penny stocks (GBX prices divided by 100)
    - Store original currency information for accurate exchange rate tracking
    - Persist user's penny stock toggle preference to database

  3. Notes
    - Existing holdings will have is_penny_stock = false and currency_price = null
    - No data loss during migration
    - These fields enhance price calculation accuracy for international stocks
*/

-- Add is_penny_stock column for tracking stocks priced in pence
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS is_penny_stock BOOLEAN DEFAULT false;

-- Add currency_price column for tracking the original currency (GBP, GBX, USD, etc.)
ALTER TABLE public.holdings ADD COLUMN IF NOT EXISTS currency_price TEXT;
