/*
  # Seed Default Categories for New Users
  
  1. Update `handle_new_user()` trigger to insert default categories
  2. Creates 12 default categories for each new user (Shopping, Gifts, Entertainment, etc.)
  3. Default categories match the mockCategories from frontend
  
  Changes:
  - Modified trigger: Adds categories insert after creating user profile
  - Each new user now gets complete set of default categories on signup
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
  user_username text;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  user_username := COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1));

  INSERT INTO public.users (id, email, name, username, avatar_url)
  VALUES (NEW.id, NEW.email, user_name, user_username, NULL);

  INSERT INTO public.user_settings (user_id, currency, theme, notifications_enabled, auto_categorize, smart_suggestions, last_login)
  VALUES (NEW.id, 'GBP', 'dark', true, true, true, now());

  INSERT INTO public.categories (user_id, name, icon, color) VALUES
    (NEW.id, 'Shopping', 'ShoppingBagIcon', 'bg-blue-500'),
    (NEW.id, 'Gifts', 'GiftIcon', 'bg-pink-500'),
    (NEW.id, 'Entertainment', 'FilmIcon', 'bg-purple-500'),
    (NEW.id, 'Cloud Storage', 'CloudIcon', 'bg-sky-500'),
    (NEW.id, 'Utilities', 'WrenchScrewdriverIcon', 'bg-orange-500'),
    (NEW.id, 'Salary', 'BanknotesIcon', 'bg-green-500'),
    (NEW.id, 'Housing', 'HomeModernIcon', 'bg-yellow-500'),
    (NEW.id, 'Transport', 'CarIcon', 'bg-red-500'),
    (NEW.id, 'Groceries', 'ShoppingBagIcon', 'bg-teal-500'),
    (NEW.id, 'Subscription', 'RefreshIcon', 'bg-indigo-500'),
    (NEW.id, 'Coffee', 'ShoppingBagIcon', 'bg-amber-800'),
    (NEW.id, 'Food & Dining', 'ShoppingBagIcon', 'bg-rose-500');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
