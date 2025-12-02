import { supabase } from '../lib/supabase';
import type { Asset, Debt, Transaction, Goal, Bill, RecurringPayment, Category, TransactionRule, Budgets, Notification } from '../types';

export const supabaseService = {
    async getUserProfile(userId: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async createUserProfile(userId: string, profile: { email: string; username: string; name: string; avatar_url?: string | null }) {
        const { error } = await supabase
            .from('users')
            .insert({
                id: userId,
                ...profile
            });
        if (error && error.code !== '23505') {
            throw error;
        }
    },

    async updateUserProfile(userId: string, updates: { name?: string; username?: string; avatar_url?: string }) {
        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId);
        if (error) throw error;
    },

    async getUserSettings(userId: string) {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    async updateUserSettings(userId: string, settings: Partial<{
        currency: string;
        notifications_enabled: boolean;
        auto_categorize: boolean;
        smart_suggestions: boolean;
        theme: string;
    }>) {
        const { error } = await supabase
            .from('user_settings')
            .upsert({ user_id: userId, ...settings });
        if (error) throw error;
    },

    async getAssets(userId: string) {
        const { data, error } = await supabase
            .from('assets')
            .select('*, holdings(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data?.map(asset => ({
            ...asset,
            accountType: 'asset' as const,
            id: asset.id
        })) || [];
    },

    async createAsset(userId: string, asset: Omit<Asset, 'id'>) {
        const { holdings, ...assetData } = asset as any;
        const { data, error } = await supabase
            .from('assets')
            .insert({
                user_id: userId,
                name: assetData.name,
                type: assetData.type,
                balance: assetData.balance || 0,
                interest_rate: assetData.interestRate || 0,
                status: assetData.status || 'Active',
                icon: assetData.icon || 'AccountsIcon',
                color: assetData.color || 'bg-green-500',
                last_updated: assetData.lastUpdated || 'just now'
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateAsset(userId: string, assetId: string, updates: Partial<Asset>) {
        const { error } = await supabase
            .from('assets')
            .update({
                name: updates.name,
                type: updates.type,
                balance: updates.balance,
                interest_rate: updates.interestRate,
                status: updates.status,
                icon: updates.icon,
                color: updates.color,
                last_updated: updates.lastUpdated
            })
            .eq('id', assetId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async deleteAsset(userId: string, assetId: string) {
        const { error } = await supabase
            .from('assets')
            .delete()
            .eq('id', assetId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async getDebts(userId: string) {
        const { data, error } = await supabase
            .from('debts')
            .select('*, promotional_offers(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data?.map(debt => ({
            ...debt,
            accountType: 'debt' as const,
            id: debt.id,
            interestRate: debt.interest_rate,
            minPayment: debt.min_payment,
            originalBalance: debt.original_balance,
            lastUpdated: debt.last_updated,
            promotionalOffer: debt.promotional_offers?.[0] ? {
                description: debt.promotional_offers[0].description,
                apr: debt.promotional_offers[0].apr,
                offerPayment: debt.promotional_offers[0].offer_payment,
                endDate: debt.promotional_offers[0].end_date
            } : undefined
        })) || [];
    },

    async createDebt(userId: string, debt: Omit<Debt, 'id'>) {
        const { promotionalOffer, ...debtData } = debt as any;
        const { data, error } = await supabase
            .from('debts')
            .insert({
                user_id: userId,
                name: debtData.name,
                type: debtData.type,
                balance: debtData.balance || 0,
                interest_rate: debtData.interestRate || 0,
                min_payment: debtData.minPayment || 0,
                original_balance: debtData.originalBalance || 0,
                status: debtData.status || 'Active',
                icon: debtData.icon || 'CreditCardIcon',
                color: debtData.color || 'bg-gray-700',
                last_updated: debtData.lastUpdated || 'just now'
            })
            .select()
            .single();
        if (error) throw error;

        if (promotionalOffer && data) {
            await supabase.from('promotional_offers').insert({
                debt_id: data.id,
                description: promotionalOffer.description,
                apr: promotionalOffer.apr,
                offer_payment: promotionalOffer.offerPayment,
                end_date: promotionalOffer.endDate
            });
        }

        return data;
    },

    async updateDebt(userId: string, debtId: string, updates: Partial<Debt>) {
        const { error } = await supabase
            .from('debts')
            .update({
                name: updates.name,
                type: updates.type,
                balance: updates.balance,
                interest_rate: updates.interestRate,
                min_payment: updates.minPayment,
                original_balance: updates.originalBalance,
                status: updates.status,
                icon: updates.icon,
                color: updates.color,
                last_updated: updates.lastUpdated
            })
            .eq('id', debtId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async deleteDebt(userId: string, debtId: string) {
        const { error } = await supabase
            .from('debts')
            .delete()
            .eq('id', debtId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async getTransactions(userId: string) {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });
        if (error) throw error;
        return data?.map(tx => ({
            ...tx,
            accountId: tx.account_id,
            sourceAccountId: tx.source_account_id,
            purchasePrice: tx.purchase_price
        })) || [];
    },

    async createTransaction(userId: string, transaction: Omit<Transaction, 'id'>) {
        const { accountId, sourceAccountId, purchasePrice, ...txData } = transaction as any;
        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                merchant: txData.merchant,
                category: txData.category || 'Uncategorized',
                amount: txData.amount,
                type: txData.type,
                date: txData.date,
                account_id: accountId,
                logo: txData.logo || '',
                ticker: txData.ticker,
                shares: txData.shares,
                purchase_price: purchasePrice,
                source_account_id: sourceAccountId
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateTransaction(userId: string, transactionId: string, updates: Partial<Transaction>) {
        const { error } = await supabase
            .from('transactions')
            .update({
                merchant: updates.merchant,
                category: updates.category,
                amount: updates.amount,
                type: updates.type,
                date: updates.date
            })
            .eq('id', transactionId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async deleteTransaction(userId: string, transactionId: string) {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', transactionId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async getGoals(userId: string) {
        const { data, error } = await supabase
            .from('goals')
            .select('*, goal_allocations(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data?.map(goal => ({
            ...goal,
            targetAmount: goal.target_amount,
            targetDate: goal.target_date,
            currentAmount: 0,
            allocations: goal.goal_allocations?.map((alloc: any) => ({
                accountId: alloc.account_id,
                percentage: alloc.percentage
            })) || []
        })) || [];
    },

    async createGoal(userId: string, goal: Omit<Goal, 'id'>) {
        const { allocations, currentAmount, ...goalData } = goal as any;
        const { data, error } = await supabase
            .from('goals')
            .insert({
                user_id: userId,
                name: goalData.name,
                target_amount: goalData.targetAmount,
                target_date: goalData.targetDate,
                description: goalData.description
            })
            .select()
            .single();
        if (error) throw error;

        if (allocations && data) {
            await Promise.all(
                allocations.map((alloc: any) =>
                    supabase.from('goal_allocations').insert({
                        goal_id: data.id,
                        account_id: alloc.accountId,
                        percentage: alloc.percentage
                    })
                )
            );
        }

        return data;
    },

    async updateGoal(userId: string, goalId: string, updates: Partial<Goal>) {
        const { error } = await supabase
            .from('goals')
            .update({
                name: updates.name,
                target_amount: updates.targetAmount,
                target_date: updates.targetDate,
                description: updates.description
            })
            .eq('id', goalId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async deleteGoal(userId: string, goalId: string) {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', goalId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async getBills(userId: string) {
        const { data, error } = await supabase
            .from('bills')
            .select('*')
            .eq('user_id', userId)
            .order('due_date', { ascending: true });
        if (error) throw error;
        return data?.map(bill => ({
            ...bill,
            dueDate: bill.due_date,
            paymentType: bill.payment_type,
            linkedAccountId: bill.linked_account_id,
            lastProcessedDate: bill.last_processed_date
        })) || [];
    },

    async createBill(userId: string, bill: Omit<Bill, 'id'>) {
        const { dueDate, paymentType, linkedAccountId, lastProcessedDate, ...billData } = bill as any;
        const { data, error } = await supabase
            .from('bills')
            .insert({
                user_id: userId,
                name: billData.name,
                category: billData.category,
                amount: billData.amount,
                due_date: dueDate,
                payment_type: paymentType,
                linked_account_id: linkedAccountId,
                last_processed_date: lastProcessedDate
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateBill(userId: string, billId: string, updates: Partial<Bill>) {
        const { error } = await supabase
            .from('bills')
            .update({
                name: updates.name,
                category: updates.category,
                amount: updates.amount,
                due_date: updates.dueDate,
                payment_type: updates.paymentType,
                linked_account_id: updates.linkedAccountId
            })
            .eq('id', billId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async deleteBill(userId: string, billId: string) {
        const { error} = await supabase
            .from('bills')
            .delete()
            .eq('id', billId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async getRecurringPayments(userId: string) {
        const { data, error } = await supabase
            .from('recurring_payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data?.map(payment => ({
            ...payment,
            fromAccountId: payment.from_account_id,
            toAccountId: payment.to_account_id,
            startDate: payment.start_date,
            endDate: payment.end_date,
            lastProcessedDate: payment.last_processed_date
        })) || [];
    },

    async createRecurringPayment(userId: string, payment: Omit<RecurringPayment, 'id'>) {
        const { fromAccountId, toAccountId, startDate, endDate, lastProcessedDate, ...paymentData } = payment as any;
        const { data, error } = await supabase
            .from('recurring_payments')
            .insert({
                user_id: userId,
                name: paymentData.name,
                type: paymentData.type,
                from_account_id: fromAccountId,
                to_account_id: toAccountId,
                amount: paymentData.amount,
                frequency: paymentData.frequency,
                start_date: startDate,
                end_date: endDate,
                category: paymentData.category,
                description: paymentData.description,
                last_processed_date: lastProcessedDate
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateRecurringPayment(userId: string, paymentId: string, updates: Partial<RecurringPayment>) {
        const { error } = await supabase
            .from('recurring_payments')
            .update({
                name: updates.name,
                type: updates.type,
                amount: updates.amount,
                frequency: updates.frequency,
                category: updates.category,
                description: updates.description
            })
            .eq('id', paymentId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async deleteRecurringPayment(userId: string, paymentId: string) {
        const { error } = await supabase
            .from('recurring_payments')
            .delete()
            .eq('id', paymentId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async getCategories(userId: string) {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async createCategory(userId: string, category: Omit<Category, 'id'>) {
        const { data, error } = await supabase
            .from('categories')
            .insert({
                user_id: userId,
                name: category.name,
                icon: category.icon,
                color: category.color
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateCategory(userId: string, categoryId: string, updates: Partial<Category>) {
        const { error } = await supabase
            .from('categories')
            .update({
                name: updates.name,
                icon: updates.icon,
                color: updates.color
            })
            .eq('id', categoryId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async deleteCategory(userId: string, categoryId: string) {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', categoryId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async getTransactionRules(userId: string) {
        const { data, error } = await supabase
            .from('transaction_rules')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data?.map(rule => ({
            ...rule,
            categoryName: rule.category_name,
            merchantName: rule.merchant_name
        })) || [];
    },

    async createTransactionRule(userId: string, rule: Omit<TransactionRule, 'id'>) {
        const { categoryName, merchantName, ...ruleData } = rule as any;
        const { data, error } = await supabase
            .from('transaction_rules')
            .insert({
                user_id: userId,
                keyword: ruleData.keyword,
                category_name: categoryName,
                merchant_name: merchantName
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteTransactionRule(userId: string, ruleId: string) {
        const { error } = await supabase
            .from('transaction_rules')
            .delete()
            .eq('id', ruleId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async getBudget(userId: string) {
        const { data, error } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        if (error) throw error;
        return data || { income: 0, expense: 0 };
    },

    async updateBudget(userId: string, budget: Budgets) {
        const { error } = await supabase
            .from('budgets')
            .upsert({
                user_id: userId,
                income: budget.income,
                expense: budget.expense
            });
        if (error) throw error;
    },

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

    async createNotification(userId: string, notification: Omit<Notification, 'id'>) {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                message: notification.message,
                type: notification.type,
                date: notification.date,
                read: notification.read || false
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async markNotificationAsRead(userId: string, notificationId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async markAllNotificationsAsRead(userId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);
        if (error) throw error;
    }
};
