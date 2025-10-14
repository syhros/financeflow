/*
  # Financial Flow Database Schema
  
  ## Overview
  Creates the complete database schema for the Financial Flow application,
  migrating from localStorage to Supabase for production-ready data persistence.
  
  ## Tables Created
  
  ### 1. users
  - Stores user profile information
  - Links to auth.users for authentication
  - Fields: id, name, username, email, avatar_url, created_at, updated_at
  
  ### 2. assets
  - Tracks user accounts (checking, savings, investing)
  - Fields: id, user_id, name, type, balance, interest_rate, status, icon, color, last_updated
  
  ### 3. holdings
  - Investment holdings for investing accounts
  - Fields: id, asset_id, ticker, name, type, shares, avg_cost
  
  ### 4. debts
  - Tracks credit cards, loans, car loans
  - Fields: id, user_id, name, type, balance, interest_rate, min_payment, original_balance, status, icon, color
  
  ### 5. promotional_offers
  - Tracks debt promotional offers (0% APR, etc)
  - Fields: id, debt_id, description, apr, offer_payment, end_date
  
  ### 6. transactions
  - All financial transactions (income, expense, investing)
  - Fields: id, user_id, merchant, category, amount, type, date, account_id, logo, ticker, shares, purchase_price, source_account_id
  
  ### 7. goals
  - Financial goals with target amounts and dates
  - Fields: id, user_id, name, target_amount, target_date, description
  
  ### 8. goal_allocations
  - Links goals to accounts with allocation percentages
  - Fields: id, goal_id, account_id, percentage
  
  ### 9. bills
  - Recurring bills and subscriptions
  - Fields: id, user_id, name, category, amount, due_date, payment_type, linked_account_id, last_processed_date
  
  ### 10. recurring_payments
  - Automated recurring payments
  - Fields: id, user_id, name, type, from_account_id, to_account_id, amount, frequency, start_date, end_date, category, description, last_processed_date
  
  ### 11. categories
  - Custom transaction categories
  - Fields: id, user_id, name, icon, color
  
  ### 12. transaction_rules
  - Auto-categorization rules
  - Fields: id, user_id, keyword, category_name, merchant_name
  
  ### 13. budgets
  - Monthly budget settings
  - Fields: id, user_id, income, expense
  
  ### 14. notifications
  - User notifications
  - Fields: id, user_id, message, type, date, read
  
  ### 15. user_settings
  - Application settings per user
  - Fields: id, user_id, currency, notifications_enabled, auto_categorize, smart_suggestions, theme, last_login
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Policies restrict SELECT, INSERT, UPDATE, DELETE to authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Assets table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Checking', 'Savings', 'Investing')),
    balance DECIMAL(15, 2) DEFAULT 0,
    interest_rate DECIMAL(5, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed')),
    icon TEXT NOT NULL DEFAULT 'AccountsIcon',
    color TEXT NOT NULL DEFAULT 'bg-green-500',
    last_updated TEXT DEFAULT 'just now',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
    ON public.assets FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
    ON public.assets FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
    ON public.assets FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
    ON public.assets FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Holdings table (for investment accounts)
CREATE TABLE IF NOT EXISTS public.holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Stock', 'Crypto')),
    shares DECIMAL(15, 8) NOT NULL,
    avg_cost DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view holdings of own assets"
    ON public.holdings FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.assets
        WHERE assets.id = holdings.asset_id
        AND assets.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage holdings of own assets"
    ON public.holdings FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.assets
        WHERE assets.id = holdings.asset_id
        AND assets.user_id = auth.uid()
    ));

-- Debts table
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    min_payment DECIMAL(15, 2) NOT NULL DEFAULT 0,
    original_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed')),
    icon TEXT NOT NULL DEFAULT 'CreditCardIcon',
    color TEXT NOT NULL DEFAULT 'bg-gray-700',
    last_updated TEXT DEFAULT 'just now',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own debts"
    ON public.debts FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debts"
    ON public.debts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts"
    ON public.debts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts"
    ON public.debts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Promotional offers table
CREATE TABLE IF NOT EXISTS public.promotional_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    apr DECIMAL(5, 2) NOT NULL,
    offer_payment DECIMAL(15, 2) NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.promotional_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view promotional offers of own debts"
    ON public.promotional_offers FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.debts
        WHERE debts.id = promotional_offers.debt_id
        AND debts.user_id = auth.uid()
    ));

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    merchant TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Uncategorized',
    amount DECIMAL(15, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'investing')),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    account_id UUID NOT NULL,
    logo TEXT DEFAULT '',
    ticker TEXT,
    shares DECIMAL(15, 8),
    purchase_price DECIMAL(15, 2),
    source_account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(user_id, category);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
    ON public.transactions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
    ON public.transactions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    target_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals"
    ON public.goals FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Goal allocations table
CREATE TABLE IF NOT EXISTS public.goal_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    account_id UUID NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.goal_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage allocations of own goals"
    ON public.goal_allocations FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.goals
        WHERE goals.id = goal_allocations.goal_id
        AND goals.user_id = auth.uid()
    ));

-- Bills table
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('Auto-pay', 'Manual', 'Reminder')),
    linked_account_id UUID,
    last_processed_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bills"
    ON public.bills FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Recurring payments table
CREATE TABLE IF NOT EXISTS public.recurring_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Expense', 'Income', 'Transfer')),
    from_account_id UUID NOT NULL,
    to_account_id UUID,
    amount DECIMAL(15, 2) NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('Weekly', 'Monthly', 'Yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    category TEXT,
    description TEXT,
    last_processed_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recurring_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recurring payments"
    ON public.recurring_payments FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Transaction rules table
CREATE TABLE IF NOT EXISTS public.transaction_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    category_name TEXT,
    merchant_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transaction_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transaction rules"
    ON public.transaction_rules FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    income DECIMAL(15, 2) NOT NULL DEFAULT 0,
    expense DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budget"
    ON public.budgets FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Bill', 'Goal', 'Summary', 'Info')),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read, date DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications"
    ON public.notifications FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- User settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL DEFAULT 'GBP' CHECK (currency IN ('GBP', 'USD', 'EUR')),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    auto_categorize BOOLEAN DEFAULT TRUE,
    smart_suggestions BOOLEAN DEFAULT TRUE,
    theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
    last_login TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
    ON public.user_settings FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holdings_updated_at BEFORE UPDATE ON public.holdings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON public.debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_payments_updated_at BEFORE UPDATE ON public.recurring_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();