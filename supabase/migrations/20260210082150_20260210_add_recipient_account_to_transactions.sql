/*
  # Add Recipient Account to Transactions

  1. Changes
    - Add `recipient_account_id` column to transactions table for transfer transactions
    - This enables tracking transfers between accounts (when both source and recipient are present)
    - Allows investment transactions to track source account

  2. Schema Changes
    - `transactions.recipient_account_id` (uuid, nullable) - Foreign key to assets table for recipient account in transfers

  3. Notes
    - When both source_account_id and recipient_account_id are set, transaction is a transfer
    - When only source_account_id is set, it's an expense
    - When only recipient_account_id is set, it's income
    - This maintains backward compatibility with existing transactions
*/

ALTER TABLE IF EXISTS public.transactions
ADD COLUMN IF NOT EXISTS recipient_account_id uuid REFERENCES public.assets(id);
