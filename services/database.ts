// Supabase database service layer
import { supabase } from '../lib/supabase';
import { User, Asset, Debt, Transaction, Goal, Bill, RecurringPayment, Category, TransactionRule, Budgets, Notification } from '../types';

// Settings type (add to types.ts later)
interface Settings {
  currency: 'GBP' | 'USD' | 'EUR';
  notificationsEnabled: boolean;
  autoCategorize: boolean;
  smartSuggestions: boolean;
  theme: 'light' | 'dark';
}

// User operations
export const userService = {
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateUser(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Assets operations
export const assetsService = {
  async getAssets(userId: string) {
    const { data, error } = await supabase
      .from('assets')
      .select('*, holdings(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createAsset(userId: string, asset: Omit<Asset, 'id'>) {
    const { data, error } = await supabase
      .from('assets')
      .insert({ ...asset, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAsset(assetId: string, updates: Partial<Asset>) {
    const { data, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', assetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAsset(assetId: string) {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId);

    if (error) throw error;
  },
};

// Debts operations
export const debtsService = {
  async getDebts(userId: string) {
    const { data, error } = await supabase
      .from('debts')
      .select('*, promotional_offers(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createDebt(userId: string, debt: Omit<Debt, 'id'>) {
    const { data, error } = await supabase
      .from('debts')
      .insert({ ...debt, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDebt(debtId: string, updates: Partial<Debt>) {
    const { data, error } = await supabase
      .from('debts')
      .update(updates)
      .eq('id', debtId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDebt(debtId: string) {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', debtId);

    if (error) throw error;
  },
};

// Transactions operations
export const transactionsService = {
  async getTransactions(userId: string, limit?: number) {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async createTransaction(userId: string, transaction: Omit<Transaction, 'id'>) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTransaction(transactionId: string, updates: Partial<Transaction>) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTransaction(transactionId: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) throw error;
  },
};

// Goals operations
export const goalsService = {
  async getGoals(userId: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('*, goal_allocations(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createGoal(userId: string, goal: Omit<Goal, 'id'>) {
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGoal(goalId: string, updates: Partial<Goal>) {
    const { data, error} = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGoal(goalId: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;
  },
};

// Bills operations
export const billsService = {
  async getBills(userId: string) {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createBill(userId: string, bill: Omit<Bill, 'id'>) {
    const { data, error } = await supabase
      .from('bills')
      .insert({ ...bill, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBill(billId: string, updates: Partial<Bill>) {
    const { data, error } = await supabase
      .from('bills')
      .update(updates)
      .eq('id', billId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBill(billId: string) {
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', billId);

    if (error) throw error;
  },
};

// Recurring payments operations
export const recurringPaymentsService = {
  async getRecurringPayments(userId: string) {
    const { data, error } = await supabase
      .from('recurring_payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createRecurringPayment(userId: string, payment: Omit<RecurringPayment, 'id'>) {
    const { data, error } = await supabase
      .from('recurring_payments')
      .insert({ ...payment, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRecurringPayment(paymentId: string, updates: Partial<RecurringPayment>) {
    const { data, error } = await supabase
      .from('recurring_payments')
      .update(updates)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRecurringPayment(paymentId: string) {
    const { error } = await supabase
      .from('recurring_payments')
      .delete()
      .eq('id', paymentId);

    if (error) throw error;
  },
};

// Categories operations
export const categoriesService = {
  async getCategories(userId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async createCategory(userId: string, category: Omit<Category, 'id'>) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...category, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCategory(categoryId: string, updates: Partial<Category>) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCategory(categoryId: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
  },
};

// Transaction rules operations
export const transactionRulesService = {
  async getRules(userId: string) {
    const { data, error } = await supabase
      .from('transaction_rules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createRule(userId: string, rule: Omit<TransactionRule, 'id'>) {
    const { data, error } = await supabase
      .from('transaction_rules')
      .insert({ ...rule, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRule(ruleId: string, updates: Partial<TransactionRule>) {
    const { data, error } = await supabase
      .from('transaction_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRule(ruleId: string) {
    const { error } = await supabase
      .from('transaction_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  },
};

// Budget operations
export const budgetService = {
  async getBudget(userId: string) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async upsertBudget(userId: string, budget: Budgets) {
    const { data, error } = await supabase
      .from('budgets')
      .upsert({ ...budget, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Notifications operations
export const notificationsService = {
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },
};

// Settings operations
export const settingsService = {
  async getSettings(userId: string) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async upsertSettings(userId: string, settings: Partial<Settings>) {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ ...settings, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
