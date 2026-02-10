/*
  # Add icon and London-listed flag to holdings

  1. Modified Tables
    - `holdings`
      - `icon` (text, nullable) - URL or base64 data for the holding's icon image
      - `is_london_listed` (boolean, default false) - Flag to append .L suffix to ticker for London Stock Exchange API calls

  2. Notes
    - Both columns are optional with safe defaults
    - No data loss - only adding new nullable/defaulted columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'holdings' AND column_name = 'icon'
  ) THEN
    ALTER TABLE public.holdings ADD COLUMN icon TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'holdings' AND column_name = 'is_london_listed'
  ) THEN
    ALTER TABLE public.holdings ADD COLUMN is_london_listed BOOLEAN DEFAULT false;
  END IF;
END $$;