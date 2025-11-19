import React, { useState, useCallback, useEffect, createContext, useContext, useMemo } from 'react';
import { Page, Asset, Debt, Goal, Bill, RecurringPayment, Transaction, Budgets, MarketData, Category, Currency, TransactionRule, User, Notification } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Accounts from './components/Accounts';
import Debts from './components/Debts';
import Trends from './components/Trends';
import Settings from './components/Settings';
import Goals from './components/Goals';
import Bills from './components/Bills';
import Recurring from './components/Recurring';
import Categorize from './components/Categorize';
import AppWrapper from './components/AppWrapper';
import LoadingSpinner from './components/shared/LoadingSpinner';
import { useAuth } from './contexts/AuthContext';
import { supabaseService } from './services/supabaseService';
import { fetchMarketData } from './services/marketData';
import { generateNotifications } from './services/notificationService';
import { addMonths } from 'date-fns';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    formatCurrency: (amount: number) => string;
}
export const CurrencyContext = createContext<CurrencyContextType | null>(null);
export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

const AppContent: React.FC<{ userId: string }> = ({ userId }) => {
    const { signOut } = useAuth();
    const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [assets, setAssets] = useState<Asset[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<Budgets>({ income: 0, expense: 0 });
    const [categories, setCategories] = useState<Category[]>([]);
    const [rules, setRules] = useState<TransactionRule[]>([]);
    const [currency, setCurrency] = useState<Currency>('GBP');
    const [user, setUser] = useState<User>({ name: '', username: '', email: '', avatar: '' });
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [lastLogin, setLastLogin] = useState<string>(new Date(0).toISOString());

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [autoCategorize, setAutoCategorize] = useState(true);
    const [smartSuggestions, setSmartSuggestions] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    const [marketData, setMarketData] = useState<MarketData>({});
    const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [summaryTransactions, setSummaryTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [
                    profileData,
                    settingsData,
                    assetsData,
                    debtsData,
                    goalsData,
                    billsData,
                    recurringData,
                    transactionsData,
                    budgetData,
                    categoriesData,
                    rulesData,
                    notificationsData
                ] = await Promise.all([
                    supabaseService.getUserProfile(userId),
                    supabaseService.getUserSettings(userId),
                    supabaseService.getAssets(userId),
                    supabaseService.getDebts(userId),
                    supabaseService.getGoals(userId),
                    supabaseService.getBills(userId),
                    supabaseService.getRecurringPayments(userId),
                    supabaseService.getTransactions(userId),
                    supabaseService.getBudget(userId),
                    supabaseService.getCategories(userId),
                    supabaseService.getTransactionRules(userId),
                    supabaseService.getNotifications(userId)
                ]);

                if (profileData) {
                    setUser({
                        name: profileData.name,
                        username: profileData.username,
                        email: profileData.email,
                        avatar: profileData.avatar_url || ''
                    });
                }

                if (settingsData) {
                    setCurrency(settingsData.currency as Currency);
                    setNotificationsEnabled(settingsData.notifications_enabled);
                    setAutoCategorize(settingsData.auto_categorize);
                    setSmartSuggestions(settingsData.smart_suggestions);
                    setTheme(settingsData.theme as 'light' | 'dark');
                    setLastLogin(settingsData.last_login || new Date(0).toISOString());
                }

                setAssets(assetsData);
                setDebts(debtsData);
                setGoals(goalsData);
                setBills(billsData);
                setRecurringPayments(recurringData);
                setTransactions(transactionsData);
                setBudgets(budgetData);
                setCategories(categoriesData);
                setRules(rulesData);
                setNotifications(notificationsData);

            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load data. Please refresh the page.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [userId]);

    const formatCurrency = useCallback((amount: number) => {
        const options = {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        };
        const locale = currency === 'GBP' ? 'en-GB' : currency === 'USD' ? 'en-US' : 'de-DE';
        return new Intl.NumberFormat(locale, options).format(amount);
    }, [currency]);

    const investmentTickersJson = useMemo(() => {
        const tickers = assets
            .filter(a => a.type === 'Investing' && a.holdings)
            .flatMap(a => a.holdings!.map(h => h.ticker));
        return JSON.stringify([...new Set(tickers)].sort());
    }, [assets]);

    useEffect(() => {
        const uniqueTickers = JSON.parse(investmentTickersJson);
        if (uniqueTickers.length > 0) {
            fetchMarketData(uniqueTickers).then(setMarketData);
        }
    }, [investmentTickersJson]);

    useEffect(() => {
        if (Object.keys(marketData).length === 0) return;

        setAssets(prevAssets => {
            let needsUpdate = false;
            const newAssets = prevAssets.map(asset => {
                if (asset.type === 'Investing' && asset.holdings) {
                    const newBalance = asset.holdings.reduce((total, holding) => {
                        const currentPrice = marketData[holding.ticker]?.price || 0;
                        return total + (currentPrice * holding.shares);
                    }, 0);

                    if (Math.abs(asset.balance - newBalance) > 0.01) {
                        needsUpdate = true;
                        return { ...asset, balance: newBalance };
                    }
                }
                return asset;
            });

            return needsUpdate ? newAssets : prevAssets;
        });
    }, [marketData]);

    const navigateTo = useCallback((page: Page) => {
        setCurrentPage(page);
    }, []);

    const handleUpdateUser = async (updatedUser: User) => {
        try {
            await supabaseService.updateUserProfile(userId, {
                name: updatedUser.name,
                username: updatedUser.username,
                avatar_url: updatedUser.avatar
            });
            setUser(updatedUser);
        } catch (err) {
            console.error('Error updating user:', err);
        }
    };

    const handleAddAsset = async (asset: Omit<Asset, 'id'>) => {
        try {
            const newAsset = await supabaseService.createAsset(userId, asset);
            setAssets(prev => [...prev, { ...asset, id: newAsset.id, accountType: 'asset' }]);
        } catch (err) {
            console.error('Error adding asset:', err);
        }
    };

    const handleUpdateAsset = async (updatedAsset: Asset, oldBalance?: number) => {
        try {
            await supabaseService.updateAsset(userId, updatedAsset.id, updatedAsset);
            setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
        } catch (err) {
            console.error('Error updating asset:', err);
        }
    };

    const handleDeleteAsset = async (assetId: string) => {
        try {
            await supabaseService.deleteAsset(userId, assetId);
            setAssets(prev => prev.filter(a => a.id !== assetId));
            setTransactions(prev => prev.filter(t => t.accountId !== assetId));
        } catch (err) {
            console.error('Error deleting asset:', err);
        }
    };

    const handleAddDebt = async (debt: Omit<Debt, 'id'>) => {
        try {
            const newDebt = await supabaseService.createDebt(userId, debt);
            setDebts(prev => [...prev, { ...debt, id: newDebt.id, accountType: 'debt' }]);
        } catch (err) {
            console.error('Error adding debt:', err);
        }
    };

    const handleUpdateDebt = async (updatedDebt: Debt, oldBalance?: number) => {
        try {
            await supabaseService.updateDebt(userId, updatedDebt.id, updatedDebt);
            setDebts(prev => prev.map(d => d.id === updatedDebt.id ? updatedDebt : d));
        } catch (err) {
            console.error('Error updating debt:', err);
        }
    };

    const handleDeleteDebt = async (debtId: string) => {
        try {
            await supabaseService.deleteDebt(userId, debtId);
            setDebts(prev => prev.filter(d => d.id !== debtId));
            setTransactions(prev => prev.filter(t => t.accountId !== debtId));
        } catch (err) {
            console.error('Error deleting debt:', err);
        }
    };

    const handleAddGoal = async (goal: Omit<Goal, 'id'>) => {
        try {
            const newGoal = await supabaseService.createGoal(userId, goal);
            setGoals(prev => [...prev, { ...goal, id: newGoal.id, currentAmount: 0 }]);
        } catch (err) {
            console.error('Error adding goal:', err);
        }
    };

    const handleUpdateGoal = async (updatedGoal: Goal) => {
        try {
            await supabaseService.updateGoal(userId, updatedGoal.id, updatedGoal);
            setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
        } catch (err) {
            console.error('Error updating goal:', err);
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        try {
            await supabaseService.deleteGoal(userId, goalId);
            setGoals(prev => prev.filter(g => g.id !== goalId));
        } catch (err) {
            console.error('Error deleting goal:', err);
        }
    };

    const handleAddBill = async (bill: Omit<Bill, 'id'>) => {
        try {
            const newBill = await supabaseService.createBill(userId, bill);
            setBills(prev => [...prev, { ...bill, id: newBill.id }]);
        } catch (err) {
            console.error('Error adding bill:', err);
        }
    };

    const handleUpdateBill = async (updatedBill: Bill) => {
        try {
            await supabaseService.updateBill(userId, updatedBill.id, updatedBill);
            setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
        } catch (err) {
            console.error('Error updating bill:', err);
        }
    };

    const handleDeleteBill = async (billId: string) => {
        try {
            await supabaseService.deleteBill(userId, billId);
            setBills(prev => prev.filter(b => b.id !== billId));
        } catch (err) {
            console.error('Error deleting bill:', err);
        }
    };

    const handleAddRecurringPayment = async (payment: Omit<RecurringPayment, 'id'>) => {
        try {
            const newPayment = await supabaseService.createRecurringPayment(userId, payment);
            setRecurringPayments(prev => [...prev, { ...payment, id: newPayment.id }]);
        } catch (err) {
            console.error('Error adding recurring payment:', err);
        }
    };

    const handleUpdateRecurringPayment = async (updatedPayment: RecurringPayment) => {
        try {
            await supabaseService.updateRecurringPayment(userId, updatedPayment.id, updatedPayment);
            setRecurringPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
        } catch (err) {
            console.error('Error updating recurring payment:', err);
        }
    };

    const handleDeleteRecurringPayment = async (paymentId: string) => {
        try {
            await supabaseService.deleteRecurringPayment(userId, paymentId);
            setRecurringPayments(prev => prev.filter(p => p.id !== paymentId));
        } catch (err) {
            console.error('Error deleting recurring payment:', err);
        }
    };

    const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        try {
            if (transaction.type === 'investing') {
                await handleInvestmentTransaction(transaction);
                return;
            }

            let finalTxData = { ...transaction };

            if (autoCategorize) {
                for (const rule of rules) {
                    if (finalTxData.merchant.toLowerCase().includes(rule.keyword.toLowerCase())) {
                        if (rule.categoryName) finalTxData.category = rule.categoryName;
                        if (rule.merchantName) finalTxData.merchant = rule.merchantName;
                        break;
                    }
                }
            }

            const newTx = await supabaseService.createTransaction(userId, finalTxData);
            setTransactions(prev => [{ ...finalTxData, id: newTx.id }, ...prev]);

            setAssets(prevAssets => prevAssets.map(asset => {
                if (asset.id === transaction.accountId) {
                    const newBalance = transaction.type === 'income' ? asset.balance + transaction.amount : asset.balance - transaction.amount;
                    handleUpdateAsset({ ...asset, balance: newBalance });
                    return { ...asset, balance: newBalance };
                }
                return asset;
            }));

            setDebts(prevDebts => prevDebts.map(debt => {
                if (debt.id === transaction.accountId) {
                    const newBalance = transaction.type === 'income' ? debt.balance - transaction.amount : debt.balance + transaction.amount;
                    handleUpdateDebt({ ...debt, balance: newBalance });
                    return { ...debt, balance: newBalance };
                }
                return debt;
            }));
        } catch (err) {
            console.error('Error adding transaction:', err);
        }
    };

    const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
        try {
            const oldTransaction = transactions.find(t => t.id === updatedTransaction.id);

            if (oldTransaction && (oldTransaction.amount !== updatedTransaction.amount || oldTransaction.type !== updatedTransaction.type || oldTransaction.accountId !== updatedTransaction.accountId)) {
                const accountChanged = oldTransaction.accountId !== updatedTransaction.accountId;

                setAssets(prevAssets => prevAssets.map(asset => {
                    if (asset.id === oldTransaction.accountId) {
                        let balance = asset.balance;
                        if (oldTransaction.type === 'income') {
                            balance -= oldTransaction.amount;
                        } else if (oldTransaction.type === 'expense') {
                            balance += oldTransaction.amount;
                        }
                        handleUpdateAsset({ ...asset, balance });
                        return { ...asset, balance };
                    }
                    if (accountChanged && asset.id === updatedTransaction.accountId) {
                        let balance = asset.balance;
                        if (updatedTransaction.type === 'income') {
                            balance += updatedTransaction.amount;
                        } else if (updatedTransaction.type === 'expense') {
                            balance -= updatedTransaction.amount;
                        }
                        handleUpdateAsset({ ...asset, balance });
                        return { ...asset, balance };
                    }
                    if (!accountChanged && asset.id === updatedTransaction.accountId) {
                        let balance = asset.balance;
                        if (updatedTransaction.type === 'income') {
                            balance += updatedTransaction.amount;
                        } else if (updatedTransaction.type === 'expense') {
                            balance -= updatedTransaction.amount;
                        }
                        handleUpdateAsset({ ...asset, balance });
                        return { ...asset, balance };
                    }
                    return asset;
                }));

                setDebts(prevDebts => prevDebts.map(debt => {
                    if (debt.id === oldTransaction.accountId) {
                        let balance = debt.balance;
                        if (oldTransaction.type === 'income') {
                            balance += oldTransaction.amount;
                        } else if (oldTransaction.type === 'expense') {
                            balance -= oldTransaction.amount;
                        }
                        handleUpdateDebt({ ...debt, balance });
                        return { ...debt, balance };
                    }
                    if (accountChanged && debt.id === updatedTransaction.accountId) {
                        let balance = debt.balance;
                        if (updatedTransaction.type === 'income') {
                            balance -= updatedTransaction.amount;
                        } else if (updatedTransaction.type === 'expense') {
                            balance += updatedTransaction.amount;
                        }
                        handleUpdateDebt({ ...debt, balance });
                        return { ...debt, balance };
                    }
                    if (!accountChanged && debt.id === updatedTransaction.accountId) {
                        let balance = debt.balance;
                        if (updatedTransaction.type === 'income') {
                            balance -= updatedTransaction.amount;
                        } else if (updatedTransaction.type === 'expense') {
                            balance += updatedTransaction.amount;
                        }
                        handleUpdateDebt({ ...debt, balance });
                        return { ...debt, balance };
                    }
                    return debt;
                }));
            }

            await supabaseService.updateTransaction(userId, updatedTransaction.id, updatedTransaction);
            setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
        } catch (err) {
            console.error('Error updating transaction:', err);
        }
    };

    const handleDeleteTransaction = async (transactionId: string) => {
        try {
            const transaction = transactions.find(t => t.id === transactionId);
            if (!transaction) return;

            setAssets(prevAssets => prevAssets.map(asset => {
                if (asset.id === transaction.accountId) {
                    let balance = asset.balance;
                    if (transaction.type === 'income') {
                        balance -= transaction.amount;
                    } else if (transaction.type === 'expense') {
                        balance += transaction.amount;
                    }
                    handleUpdateAsset({ ...asset, balance });
                    return { ...asset, balance };
                }
                return asset;
            }));

            setDebts(prevDebts => prevDebts.map(debt => {
                if (debt.id === transaction.accountId) {
                    let balance = debt.balance;
                    if (transaction.type === 'income') {
                        balance += transaction.amount;
                    } else if (transaction.type === 'expense') {
                        balance -= transaction.amount;
                    }
                    handleUpdateDebt({ ...debt, balance });
                    return { ...debt, balance };
                }
                return debt;
            }));

            await supabaseService.deleteTransaction(userId, transactionId);
            setTransactions(prev => prev.filter(t => t.id !== transactionId));
        } catch (err) {
            console.error('Error deleting transaction:', err);
        }
    };

    const handleImportTransactions = async (importedTransactions: Transaction[]) => {
        try {
            for (const tx of importedTransactions) {
                await supabaseService.createTransaction(userId, tx);
            }

            setTransactions(prev => [...prev, ...importedTransactions]);

            const balanceChanges = new Map<string, number>();
            importedTransactions.forEach(tx => {
                const currentChange = balanceChanges.get(tx.accountId) || 0;
                if (tx.type === 'income') {
                    balanceChanges.set(tx.accountId, currentChange + tx.amount);
                } else if (tx.type === 'expense') {
                    balanceChanges.set(tx.accountId, currentChange - tx.amount);
                }
            });

            setAssets(prevAssets => prevAssets.map(asset => {
                const change = balanceChanges.get(asset.id);
                if (change !== undefined) {
                    const newBalance = asset.balance + change;
                    handleUpdateAsset({ ...asset, balance: newBalance });
                    return { ...asset, balance: newBalance };
                }
                return asset;
            }));

            setDebts(prevDebts => prevDebts.map(debt => {
                const change = balanceChanges.get(debt.id);
                if (change !== undefined) {
                    const newBalance = debt.balance - change;
                    handleUpdateDebt({ ...debt, balance: newBalance });
                    return { ...debt, balance: newBalance };
                }
                return debt;
            }));
        } catch (err) {
            console.error('Error importing transactions:', err);
        }
    };

    const handleInvestmentTransaction = async (tx: Omit<Transaction, 'id'>) => {
        try {
            const assetName = marketData[tx.ticker!]?.name || tx.ticker!;
            const tickerNameForLogo = tx.ticker!.split('-')[0].toLowerCase();

            const newTx = {
                ...tx,
                logo: `https://logo.clearbit.com/${tickerNameForLogo}.com`,
                merchant: `${assetName} (${tx.ticker})`,
                category: 'Investment'
            };

            const createdTx = await supabaseService.createTransaction(userId, newTx);
            setTransactions(prev => [{ ...newTx, id: createdTx.id }, ...prev]);

            setAssets(prevAssets => {
                const newAssets = [...prevAssets];
                const sourceAssetIndex = newAssets.findIndex(a => a.id === tx.sourceAccountId);
                if(sourceAssetIndex > -1) {
                    newAssets[sourceAssetIndex].balance -= tx.amount;
                    handleUpdateAsset(newAssets[sourceAssetIndex]);
                }

                const investAssetIndex = newAssets.findIndex(a => a.id === tx.accountId);
                if(investAssetIndex > -1) {
                    const investmentAccount = newAssets[investAssetIndex];
                    if (!investmentAccount.holdings) investmentAccount.holdings = [];
                    const existingHoldingIndex = investmentAccount.holdings.findIndex(h => h.ticker === tx.ticker);
                    if (existingHoldingIndex > -1) {
                        const existingHolding = investmentAccount.holdings[existingHoldingIndex];
                        const totalShares = existingHolding.shares + tx.shares!;
                        const totalCost = (existingHolding.avgCost * existingHolding.shares) + (tx.purchasePrice! * tx.shares!);
                        existingHolding.avgCost = totalCost / totalShares;
                        existingHolding.shares = totalShares;
                    } else {
                        investmentAccount.holdings.push({
                            ticker: tx.ticker!,
                            name: marketData[tx.ticker!]?.name || tx.ticker!,
                            type: tx.category as 'Stock' | 'Crypto',
                            shares: tx.shares!,
                            avgCost: tx.purchasePrice!
                        });
                    }
                    handleUpdateAsset(investmentAccount);
                }
                return newAssets;
            });
        } catch (err) {
            console.error('Error handling investment transaction:', err);
        }
    };

    const handleUpdateBudgets = async (updatedBudgets: Budgets) => {
        try {
            await supabaseService.updateBudget(userId, updatedBudgets);
            setBudgets(updatedBudgets);
        } catch (err) {
            console.error('Error updating budgets:', err);
        }
    };

    const handleAddCategory = async (category: Omit<Category, 'id'>) => {
        try {
            const newCategory = await supabaseService.createCategory(userId, category);
            setCategories(prev => [...prev, { ...category, id: newCategory.id }]);
        } catch (err) {
            console.error('Error adding category:', err);
        }
    };

    const handleUpdateCategory = async (updatedCategory: Category) => {
        try {
            await supabaseService.updateCategory(userId, updatedCategory.id, updatedCategory);
            setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
        } catch (err) {
            console.error('Error updating category:', err);
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        try {
            await supabaseService.deleteCategory(userId, categoryId);
            setCategories(prev => prev.filter(c => c.id !== categoryId));
        } catch (err) {
            console.error('Error deleting category:', err);
        }
    };

    const handleAddRule = async (rule: Omit<TransactionRule, 'id'>) => {
        try {
            const newRule = await supabaseService.createTransactionRule(userId, rule);
            setRules(prev => [...prev, { ...rule, id: newRule.id }]);
        } catch (err) {
            console.error('Error adding rule:', err);
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        try {
            await supabaseService.deleteTransactionRule(userId, ruleId);
            setRules(prev => prev.filter(r => r.id !== ruleId));
        } catch (err) {
            console.error('Error deleting rule:', err);
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        try {
            await supabaseService.markAllNotificationsAsRead(userId);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Error marking notifications as read:', err);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        try {
            await supabaseService.markNotificationAsRead(userId, notification.id);
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));

            const idParts = notification.id.split('-');
            const type = idParts[0];
            const id = idParts[1];

            switch(type) {
                case 'bill':
                    setHighlightedItemId(id);
                    navigateTo(Page.Bills);
                    break;
                case 'goal':
                    setHighlightedItemId(id);
                    navigateTo(Page.Goals);
                    break;
                case 'welcome':
                    const newTransactions = transactions.filter(t => new Date(t.date) > new Date(lastLogin));
                    setSummaryTransactions(newTransactions);
                    setIsSummaryModalOpen(true);
                    break;
            }
        } catch (err) {
            console.error('Error handling notification click:', err);
        }
    };

    const handleCloseSummaryModal = () => setIsSummaryModalOpen(false);

    const handleToggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        try {
            await supabaseService.updateUserSettings(userId, { theme: newTheme });
            setTheme(newTheme);
        } catch (err) {
            console.error('Error toggling theme:', err);
        }
    };

    const handleWipeData = async (option: string) => {
        try {
            switch (option) {
                case 'allTransactions':
                    for (const tx of transactions) {
                        await supabaseService.deleteTransaction(userId, tx.id);
                    }
                    setTransactions([]);
                    alert("All transactions have been deleted.");
                    break;
                case 'oldTransactions':
                    const sixMonthsAgo = addMonths(new Date(), -6);
                    const oldTxs = transactions.filter(t => new Date(t.date) < sixMonthsAgo);
                    for (const tx of oldTxs) {
                        await supabaseService.deleteTransaction(userId, tx.id);
                    }
                    setTransactions(prev => prev.filter(t => new Date(t.date) >= sixMonthsAgo));
                    alert("Transactions older than 6 months have been deleted.");
                    break;
                case 'resetAccounts':
                    for (const asset of assets) {
                        await supabaseService.updateAsset(userId, asset.id, { ...asset, balance: 0 });
                    }
                    for (const debt of debts) {
                        await supabaseService.updateDebt(userId, debt.id, { ...debt, balance: 0 });
                    }
                    setAssets(prev => prev.map(asset => ({ ...asset, balance: 0 })));
                    setDebts(prev => prev.map(debt => ({ ...debt, balance: 0 })));
                    alert("All account balances have been reset to £0.");
                    break;
                case 'deleteAndResetBalances':
                    for (const tx of transactions) {
                        await supabaseService.deleteTransaction(userId, tx.id);
                    }
                    for (const asset of assets) {
                        await supabaseService.updateAsset(userId, asset.id, { ...asset, balance: 0 });
                    }
                    for (const debt of debts) {
                        await supabaseService.updateDebt(userId, debt.id, { ...debt, balance: 0 });
                    }
                    setTransactions([]);
                    setAssets(prev => prev.map(asset => ({ ...asset, balance: 0 })));
                    setDebts(prev => prev.map(debt => ({ ...debt, balance: 0 })));
                    alert("All transactions deleted and account balances reset to £0.");
                    break;
                case 'fullReset':
                    alert("Full reset not available in database mode.");
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.error('Error wiping data:', err);
            alert("Error performing operation. Please try again.");
        }
    };

    const handleDeleteTransactions = async (params: { accountId?: string; level?: string; beforeDate?: string }) => {
        try {
            const { accountId, level, beforeDate } = params;

            if (accountId) {
                if (level === 'all') {
                    const txsToDelete = transactions.filter(t => t.accountId === accountId);
                    for (const tx of txsToDelete) {
                        await supabaseService.deleteTransaction(userId, tx.id);
                    }
                    setTransactions(prev => prev.filter(t => t.accountId !== accountId));
                } else if (beforeDate) {
                    const txsToDelete = transactions.filter(t => t.accountId === accountId && new Date(t.date) < new Date(beforeDate));
                    for (const tx of txsToDelete) {
                        await supabaseService.deleteTransaction(userId, tx.id);
                    }
                    setTransactions(prev => prev.filter(t => {
                        if (t.accountId !== accountId) return true;
                        return new Date(t.date) >= new Date(beforeDate);
                    }));
                }
            }
        } catch (err) {
            console.error('Error deleting transactions:', err);
        }
    };

    const uncategorizedTransactions = transactions.filter(t => t.category === 'Uncategorized');

    const renderPage = () => {
        switch (currentPage) {
            case Page.Dashboard:
                return <Dashboard
                            navigateTo={navigateTo}
                            assets={assets}
                            debts={debts}
                            bills={bills}
                            transactions={transactions}
                            user={user}
                            onUpdateUser={handleUpdateUser}
                            notifications={notifications}
                            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
                            onNotificationClick={handleNotificationClick}
                            isSummaryModalOpen={isSummaryModalOpen}
                            summaryTransactions={summaryTransactions}
                            onCloseSummaryModal={handleCloseSummaryModal}
                            theme={theme}
                            onToggleTheme={handleToggleTheme}
                        />;
            case Page.Transactions:
                return <Transactions transactions={transactions} assets={assets} debts={debts} budgets={budgets} categories={categories} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateBudgets={handleUpdateBudgets} user={user} notifications={notifications} onUpdateUser={handleUpdateUser} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} onNotificationClick={handleNotificationClick} navigateTo={navigateTo} theme={theme} onToggleTheme={handleToggleTheme} onSignOut={signOut} />;
            case Page.Accounts:
                return <Accounts assets={assets} marketData={marketData} onAddAsset={handleAddAsset} onUpdateAsset={handleUpdateAsset} onDeleteAsset={handleDeleteAsset} onAddTransaction={handleAddTransaction} transactions={transactions} user={user} notifications={notifications} debts={debts} onUpdateUser={handleUpdateUser} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} onNotificationClick={handleNotificationClick} navigateTo={navigateTo} theme={theme} onToggleTheme={handleToggleTheme} onSignOut={signOut} />;
            case Page.Debts:
                return <Debts debts={debts} onAddDebt={handleAddDebt} onUpdateDebt={handleUpdateDebt} onDeleteDebt={handleDeleteDebt} onAddTransaction={handleAddTransaction} transactions={transactions} user={user} notifications={notifications} assets={assets} onUpdateUser={handleUpdateUser} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} onNotificationClick={handleNotificationClick} navigateTo={navigateTo} theme={theme} onToggleTheme={handleToggleTheme} onSignOut={signOut} />;
            case Page.Trends:
                return <Trends assets={assets} debts={debts} transactions={transactions} />;
            case Page.Goals:
                 return <Goals goals={goals} assets={assets} onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal} onDeleteGoal={handleDeleteGoal} highlightedItemId={highlightedItemId} setHighlightedItemId={setHighlightedItemId} user={user} notifications={notifications} debts={debts} onUpdateUser={handleUpdateUser} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} onNotificationClick={handleNotificationClick} navigateTo={navigateTo} theme={theme} onToggleTheme={handleToggleTheme} onSignOut={signOut} />;
            case Page.Bills:
                 return <Bills bills={bills} assets={assets} onAddBill={handleAddBill} onUpdateBill={handleUpdateBill} onDeleteBill={handleDeleteBill} highlightedItemId={highlightedItemId} setHighlightedItemId={setHighlightedItemId} user={user} notifications={notifications} debts={debts} onUpdateUser={handleUpdateUser} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} onNotificationClick={handleNotificationClick} navigateTo={navigateTo} theme={theme} onToggleTheme={handleToggleTheme} onSignOut={signOut} />;
            case Page.Recurring:
                return <Recurring payments={recurringPayments} assets={assets} debts={debts} onAddPayment={handleAddRecurringPayment} onUpdatePayment={handleUpdateRecurringPayment} onDeletePayment={handleDeleteRecurringPayment} user={user} notifications={notifications} onUpdateUser={handleUpdateUser} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} onNotificationClick={handleNotificationClick} navigateTo={navigateTo} theme={theme} onToggleTheme={handleToggleTheme} onSignOut={signOut} />;
            case Page.Categorize:
                 return <Categorize transactions={uncategorizedTransactions} onUpdateTransaction={handleUpdateTransaction} onAddRule={handleAddRule} assets={assets} debts={debts} categories={categories} />;
            case Page.Settings:
                return <Settings
                            categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory}
                            rules={rules} onAddRule={handleAddRule} onDeleteRule={handleDeleteRule}
                            onWipeData={handleWipeData}
                            notificationsEnabled={notificationsEnabled} onToggleNotifications={async () => {
                                const newValue = !notificationsEnabled;
                                await supabaseService.updateUserSettings(userId, { notifications_enabled: newValue });
                                setNotificationsEnabled(newValue);
                            }}
                            autoCategorize={autoCategorize} onToggleAutoCategorize={async () => {
                                const newValue = !autoCategorize;
                                await supabaseService.updateUserSettings(userId, { auto_categorize: newValue });
                                setAutoCategorize(newValue);
                            }}
                            smartSuggestions={smartSuggestions} onToggleSmartSuggestions={async () => {
                                const newValue = !smartSuggestions;
                                await supabaseService.updateUserSettings(userId, { smart_suggestions: newValue });
                                setSmartSuggestions(newValue);
                            }}
                            assets={assets} debts={debts} bills={bills} goals={goals} recurringPayments={recurringPayments}
                            onImportTransactions={handleImportTransactions}
                            onAddAsset={handleAddAsset}
                            onAddDebt={handleAddDebt}
                            onDeleteAsset={handleDeleteAsset}
                            onDeleteDebt={handleDeleteDebt}
                            onDeleteBill={handleDeleteBill}
                            onDeleteGoal={handleDeleteGoal}
                            onDeleteRecurring={handleDeleteRecurringPayment}
                            onDeleteTransactions={handleDeleteTransactions}
                        />;
            default:
                return <Dashboard
                            navigateTo={navigateTo}
                            assets={assets}
                            debts={debts}
                            bills={bills}
                            transactions={transactions}
                            user={user}
                            onUpdateUser={handleUpdateUser}
                            notifications={notifications}
                            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
                            onNotificationClick={handleNotificationClick}
                            isSummaryModalOpen={isSummaryModalOpen}
                            summaryTransactions={summaryTransactions}
                            onCloseSummaryModal={handleCloseSummaryModal}
                            theme={theme}
                            onToggleTheme={handleToggleTheme}
                        />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-app-bg flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="large" />
                    <p className="text-gray-400 mt-4">Loading your financial data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-app-bg flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 text-xl">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                        Reload
                    </button>
                </div>
            </div>
        );
    }

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency: async (newCurrency) => {
            await supabaseService.updateUserSettings(userId, { currency: newCurrency });
            setCurrency(newCurrency);
        }, formatCurrency }}>
            <div className={`flex min-h-screen bg-base-bg text-gray-200 ${theme}`}>
                <Sidebar currentPage={currentPage} navigateTo={navigateTo} />
                <main className="flex-1 p-8 bg-base-bg overflow-y-auto">
                    {renderPage()}
                </main>
            </div>
        </CurrencyContext.Provider>
    );
};

const App: React.FC = () => {
    const [userId, setUserId] = useState<string | null>(null);

    return (
        <AppWrapper onUserLoaded={setUserId}>
            {userId && <AppContent userId={userId} />}
        </AppWrapper>
    );
};

export default App;
