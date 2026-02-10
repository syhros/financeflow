/*
  # Seed Default Transaction Categories

  1. Purpose
    - Automatically create default transaction categories for new users
    - Provides a comprehensive list of pre-configured categories with icons and colors
    - Includes expense, income, and special transaction categories
    - Users can still add custom categories

  2. Categories Added
    - Expense categories: Coffee, Drinks, Food, Fast Food, Outings, Entertainment, Holiday, Travel
    - Personal categories: Personal Care, Clothes, Gifts
    - Housing: Household, Rent
    - Transportation: Petrol, Car Expenses, Travel
    - Services: Gym, Games
    - Financial: Bills, Rent, Account Fees, Debt, Loans, Gambling
    - Income categories: Income, Get Paid Too, Cashback, Refunds, Interest, Switch Offer
    - Investments: Crypto, Savings, Loan
    - Cash Management: Cash Withdrawal

  3. Implementation
    - Creates trigger function to insert default categories when user is created
    - Uses trigger on users table to seed categories
    - Each category has icon name and color class for UI display
    - Icons are mapped to Heroicons for consistency

  4. Security
    - Row Level Security policies remain unchanged
    - Categories are created for the new user's ID
    - No direct INSERT, uses trigger pattern
*/

CREATE OR REPLACE FUNCTION seed_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, icon, color) VALUES
    -- Expense - Dining & Drinks
    (NEW.id, 'Coffee', 'ShoppingBagIcon', 'bg-amber-500'),
    (NEW.id, 'Drinks', 'ShoppingBagIcon', 'bg-blue-500'),
    (NEW.id, 'Food', 'ReceiptIcon', 'bg-orange-500'),
    (NEW.id, 'Fast Food', 'ShoppingBagIcon', 'bg-red-500'),
    (NEW.id, 'Outings', 'FilmIcon', 'bg-purple-500'),
    
    -- Expense - Entertainment & Travel
    (NEW.id, 'Entertainment', 'FilmIcon', 'bg-violet-500'),
    (NEW.id, 'Holiday', 'CalendarDaysIcon', 'bg-indigo-500'),
    (NEW.id, 'Travel', 'CarIcon', 'bg-cyan-500'),
    (NEW.id, 'Games', 'FilmIcon', 'bg-fuchsia-500'),
    
    -- Expense - Personal
    (NEW.id, 'Personal Care', 'WrenchScrewdriverIcon', 'bg-pink-500'),
    (NEW.id, 'Clothes', 'ShoppingBagIcon', 'bg-rose-500'),
    (NEW.id, 'Gifts', 'GiftIcon', 'bg-rose-500'),
    
    -- Expense - Home & Living
    (NEW.id, 'Household', 'HomeModernIcon', 'bg-slate-500'),
    (NEW.id, 'Rent', 'HomeModernIcon', 'bg-red-600'),
    (NEW.id, 'Gym', 'RefreshIcon', 'bg-green-500'),
    
    -- Expense - Transportation
    (NEW.id, 'Petrol', 'CarIcon', 'bg-orange-600'),
    (NEW.id, 'Car Expenses', 'CarIcon', 'bg-yellow-600'),
    
    -- Expense - Financial
    (NEW.id, 'Bills', 'BillsIcon', 'bg-red-500'),
    (NEW.id, 'Account Fees', 'BanknotesIcon', 'bg-gray-600'),
    (NEW.id, 'Debt', 'DebtsIcon', 'bg-red-700'),
    (NEW.id, 'Loan', 'LoanIcon', 'bg-blue-600'),
    (NEW.id, 'Gambling', 'ShoppingBagIcon', 'bg-red-800'),
    
    -- Expense - Shopping
    (NEW.id, 'Online Shopping', 'ShoppingBagIcon', 'bg-blue-500'),
    (NEW.id, 'Cash Withdrawal', 'BanknotesIcon', 'bg-gray-700'),
    
    -- Income
    (NEW.id, 'Income', 'BanknotesIcon', 'bg-green-500'),
    (NEW.id, 'Get Paid Too', 'WalletIcon', 'bg-green-600'),
    (NEW.id, 'Cashback', 'BanknotesIcon', 'bg-green-500'),
    (NEW.id, 'Refunds', 'BanknotesIcon', 'bg-green-500'),
    (NEW.id, 'Interest', 'BanknotesIcon', 'bg-green-500'),
    (NEW.id, 'Switch Offer', 'GiftIcon', 'bg-green-500'),
    
    -- Investments & Savings
    (NEW.id, 'Crypto', 'CloudIcon', 'bg-yellow-500'),
    (NEW.id, 'Savings', 'WalletIcon', 'bg-blue-500'),
    (NEW.id, 'Expenses', 'ReceiptIcon', 'bg-orange-500');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS seed_categories_on_user_create ON public.users;

CREATE TRIGGER seed_categories_on_user_create
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION seed_default_categories();