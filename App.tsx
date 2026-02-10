import React, { useState, useCallback, useEffect, createContext, useContext, useMemo, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthContainer from './components/auth/AuthContainer';
import LoadingSpinner from './components/shared/LoadingSpinner';
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
import { mockAssets, mockDebts, mockGoals, mockBills, mockRecurringPayments, allTransactions, mockBudgets, mockCategories, mockRules, mockUser } from './data/mockData';
import { fetchMarketData, clearMarketDataCache } from './services/marketData';
import { generateNotifications } from './services/notificationService';
import { userService, assetsService, debtsService, transactionsService, goalsService, billsService, recurringPaymentsService, categoriesService, transactionRulesService, budgetService, settingsService, holdingsService } from './services/database';
import { fetchMarketDataWithLondonSuffix, getTickerToLondonFlagMap, fetchAndMapMarketData, getMarketPriceForTicker } from './utils/marketDataHelpers';
import { addMonths } from 'date-fns';

// --- Context for Currency ---
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

// --- Custom Hook for Persistent State ---
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}


const App: React.FC = () => {
    const { user: authUser, loading: authLoading } = useAuth();
    const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);

    // --- Persistent State Management ---
    const [assets, setAssets] = usePersistentState<Asset[]>('zenith-assets', mockAssets);
    const [debts, setDebts] = usePersistentState<Debt[]>('zenith-debts', mockDebts);
    const [goals, setGoals] = usePersistentState<Goal[]>('zenith-goals', mockGoals);
    const [bills, setBills] = usePersistentState<Bill[]>('zenith-bills', mockBills);
    const [recurringPayments, setRecurringPayments] = usePersistentState<RecurringPayment[]>('zenith-recurring', mockRecurringPayments);
    const [transactions, setTransactions] = usePersistentState<Transaction[]>('zenith-transactions', allTransactions);
    const [budgets, setBudgets] = usePersistentState<Budgets>('zenith-budgets', mockBudgets);
    const [categories, setCategories] = usePersistentState<Category[]>('zenith-categories', mockCategories);
    const [rules, setRules] = usePersistentState<TransactionRule[]>('zenith-rules', mockRules);
    const [currency, setCurrency] = usePersistentState<Currency>('zenith-currency', 'GBP');
    const [user, setUser] = usePersistentState<User>('zenith-user', mockUser);
    const [notifications, setNotifications] = usePersistentState<Notification[]>('zenith-notifications', []);
    const [lastLogin, setLastLogin] = usePersistentState<string>('zenith-lastLogin', new Date(0).toISOString());
    
    // Settings State
    const [notificationsEnabled, setNotificationsEnabled] = usePersistentState('zenith-notifications-enabled', true);
    const [autoCategorize, setAutoCategorize] = usePersistentState('zenith-autoCategorize', true);
    const [smartSuggestions, setSmartSuggestions] = usePersistentState('zenith-smartSuggestions', true);
    const [theme, setTheme] = usePersistentState<'light' | 'dark'>('zenith-theme', 'dark');

    const [marketData, setMarketData] = useState<MarketData>({});
    const [isDataLoading, setIsDataLoading] = useState(false);
    const lastMarketDataFetch = useRef<number>(0);
    const MARKET_DATA_THROTTLE_MS = 3600000;

    // --- Interactive Notification State ---
    const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [summaryTransactions, setSummaryTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (!authUser || isDataLoading) return;

        const loadUserData = async () => {
            try {
                setIsDataLoading(true);

                const [userProfile, userAssets, userDebts, userTransactions, userGoals, userBills, userRecurring, userCategories, userRules, userBudget, userSettings] = await Promise.all([
                    userService.getUser(authUser.id),
                    assetsService.getAssets(authUser.id),
                    debtsService.getDebts(authUser.id),
                    transactionsService.getTransactions(authUser.id),
                    goalsService.getGoals(authUser.id),
                    billsService.getBills(authUser.id),
                    recurringPaymentsService.getRecurringPayments(authUser.id),
                    categoriesService.getCategories(authUser.id),
                    transactionRulesService.getRules(authUser.id),
                    budgetService.getBudget(authUser.id),
                    settingsService.getSettings(authUser.id),
                ]);

                if (userProfile) {
                    setUser({
                        name: userProfile.name || '',
                        username: userProfile.username || '',
                        email: userProfile.email || '',
                        avatarUrl: userProfile.avatar_url || ''
                    });
                }

                if (userAssets && userAssets.length > 0) {
                    const assetsWithMetadata = await Promise.all(userAssets.map(async (asset: any) => {
                        if (asset.type === 'Investing' && asset.holdings && asset.holdings.length > 0) {
                            const metadata = await holdingsService.getHoldingsMetadata(asset.id);
                            const metadataMap = new Map(metadata.map((m: any) => [m.ticker, m]));
                            const holdings = asset.holdings.map((h: any) => {
                                const meta = metadataMap.get(h.ticker);
                                const currencyPrice = meta?.currency_price || h.currencyPrice || 'GBP';
                                const isPennyStock = meta?.is_penny_stock ?? (currencyPrice === 'GBX');
                                const isLondonListed = meta?.is_london_listed ?? isPennyStock;

                                return {
                                    ...h,
                                    id: meta?.id || h.id,
                                    icon: meta?.icon || h.icon,
                                    isLondonListed,
                                    isPennyStock,
                                    currencyPrice,
                                };
                            });

                            const updatedAsset = {
                                ...asset,
                                holdings
                            };

                            // Sync corrected flags to database
                            if (holdings.some(h => h.isPennyStock || h.isLondonListed)) {
                                syncHoldingsToDatabase(updatedAsset).catch(err =>
                                    console.error('Failed to sync holdings on load:', err)
                                );
                            }

                            return updatedAsset;
                        }
                        return asset;
                    }));
                    setAssets(assetsWithMetadata);
                }
                if (userDebts && userDebts.length > 0) setDebts(userDebts);
                if (userTransactions && userTransactions.length > 0) setTransactions(userTransactions);
                if (userGoals && userGoals.length > 0) setGoals(userGoals);
                if (userBills && userBills.length > 0) setBills(userBills);
                if (userRecurring && userRecurring.length > 0) setRecurringPayments(userRecurring);
                if (userCategories && userCategories.length > 0) setCategories(userCategories);
                if (userRules && userRules.length > 0) setRules(userRules);
                if (userBudget) setBudgets(userBudget);

                if (userSettings) {
                    setCurrency(userSettings.currency || 'GBP');
                    setNotificationsEnabled(userSettings.notifications_enabled ?? true);
                    setAutoCategorize(userSettings.auto_categorize ?? true);
                    setSmartSuggestions(userSettings.smart_suggestions ?? true);
                    setTheme(userSettings.theme || 'dark');
                }
            } catch (error) {
                console.error('Failed to load user data:', error);
            } finally {
                setIsDataLoading(false);
            }
        };

        loadUserData();
    }, [authUser]);

    const formatCurrency = useCallback((amount: number) => {
        const options = {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        };
        const locale = currency === 'GBP' ? 'en-GB' : currency === 'USD' ? 'en-US' : 'de-DE';
        return new Intl.NumberFormat(locale, options).format(amount);
    }, [currency]);

    // Memoize tickers to prevent unnecessary API calls (only holdings with >0.1 shares)
    const investmentTickerInfo = useMemo(() => {
        const tickerMap: Record<string, boolean> = {};
        assets
            .filter(a => a.type === 'Investing' && a.holdings)
            .forEach(a => a.holdings!.forEach(h => {
                if (Math.abs(h.shares) > 0.1) {
                    tickerMap[h.ticker] = h.isLondonListed || false;
                }
            }));
        return tickerMap;
    }, [assets]);

    const investmentTickersJson = useMemo(() => {
        return JSON.stringify(Object.keys(investmentTickerInfo).sort());
    }, [investmentTickerInfo]);

    // Fetch market data only when tickers change (throttled to 1 hour)
    useEffect(() => {
        const uniqueTickers: string[] = JSON.parse(investmentTickersJson);
        if (uniqueTickers.length === 0) return;

        const now = Date.now();
        const timeSinceLastFetch = now - lastMarketDataFetch.current;

        if (timeSinceLastFetch < MARKET_DATA_THROTTLE_MS) {
            return;
        }

        lastMarketDataFetch.current = now;
        fetchAndMapMarketData(uniqueTickers, investmentTickerInfo).then(mapped => {
            setMarketData(prev => ({ ...prev, ...mapped }));
        });
    }, [investmentTickersJson, investmentTickerInfo]);

    // Notification Generation
    useEffect(() => {
        if(notificationsEnabled) {
            const newNotifications = generateNotifications(bills, goals, assets, debts, transactions, lastLogin);
            if (newNotifications.length > 0) {
                setNotifications(prev => [...newNotifications, ...prev.filter(n => !newNotifications.find(nn => nn.id === n.id))]);
            }
        }
        setLastLogin(new Date().toISOString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bills, goals, assets, debts, transactions]); // Run when data changes


    // Recalculate investment account balances when market data changes, preventing re-render loops
    useEffect(() => {
        if (Object.keys(marketData).length === 0) return;

        setAssets(prevAssets => {
            let needsUpdate = false;
            const assetsToUpdate: Asset[] = [];
            const newAssets = prevAssets.map(asset => {
                if (asset.type === 'Investing' && asset.holdings) {
                    const newBalance = asset.holdings.reduce((total, holding) => {
                        const currentPrice = getMarketPriceForTicker(
                            holding.ticker,
                            holding.isLondonListed || false,
                            holding.isPennyStock || false,
                            marketData
                        ) || holding.avgCost || 0;
                        return total + (currentPrice * holding.shares);
                    }, 0);

                    // Compare balances with a tolerance for floating point issues
                    if (Math.abs(asset.balance - newBalance) > 0.01) {
                        needsUpdate = true;
                        const updatedAsset = { ...asset, balance: newBalance };
                        assetsToUpdate.push(updatedAsset);
                        return updatedAsset;
                    }
                }
                return asset;
            });

            // Update balances in database
            if (assetsToUpdate.length > 0 && authUser) {
                assetsToUpdate.forEach(asset => {
                    assetsService.updateAsset(asset.id, { balance: asset.balance }).catch(err =>
                        console.error('Failed to update asset balance:', err)
                    );
                });
            }

            // Only return new array if something actually changed to prevent re-render loop
            return needsUpdate ? newAssets : prevAssets;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketData]);

    useEffect(() => {
        const interval = setInterval(async () => {
            const investingAssets = assets.filter(a => a.type === 'Investing' && a.holdings && a.holdings.length > 0);
            if (investingAssets.length === 0) return;

            try {
                clearMarketDataCache();
                const marketData = await fetchMarketDataWithLondonSuffix(investingAssets);
                setMarketData(marketData);
            } catch (error) {
                console.error('Failed to auto-refresh market data:', error);
            }
        }, 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, [assets]);

    const navigateTo = useCallback((page: Page) => {
        setCurrentPage(page);
    }, []);

    // User Handler
    const handleUpdateUser = (updatedUser: User) => {
        setUser(updatedUser);
        if (authUser) {
            userService.updateUser(authUser.id, {
                name: updatedUser.name,
                username: updatedUser.username,
                avatar_url: updatedUser.avatarUrl
            }).catch(err => console.error('Failed to update user:', err));
        }
    };

    // Asset Handlers
    const handleAddAsset = (asset: Omit<Asset, 'id'>) => {
        const newAsset = { ...asset, id: new Date().toISOString() };
        setAssets(prev => [...prev, newAsset]);
        if (authUser) {
            assetsService.createAsset(authUser.id, asset).catch(err => console.error('Failed to add asset:', err));
        }
    };
    const handleUpdateAsset = (updatedAsset: Asset, oldBalance?: number) => {
        setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
        if (authUser) {
            assetsService.updateAsset(updatedAsset.id, updatedAsset).catch(err => console.error('Failed to update asset:', err));
        }
    };
    const handleDeleteAsset = (assetId: string) => {
        setAssets(prev => prev.filter(a => a.id !== assetId));
        setTransactions(prev => prev.filter(t => t.accountId !== assetId));
        if (authUser) {
            assetsService.deleteAsset(assetId).catch(err => console.error('Failed to delete asset:', err));
        }
    };

    // Debt Handlers
    const handleAddDebt = (debt: Omit<Debt, 'id'>) => {
        const newDebt = { ...debt, id: new Date().toISOString() };
        setDebts(prev => [...prev, newDebt]);
        if (authUser) {
            debtsService.createDebt(authUser.id, debt).catch(err => console.error('Failed to add debt:', err));
        }
    };
    const handleUpdateDebt = (updatedDebt: Debt, oldBalance?: number) => {
        setDebts(prev => prev.map(d => d.id === updatedDebt.id ? updatedDebt : d));
        if (authUser) {
            debtsService.updateDebt(updatedDebt.id, updatedDebt).catch(err => console.error('Failed to update debt:', err));
        }
    };
    const handleDeleteDebt = (debtId: string) => {
        setDebts(prev => prev.filter(d => d.id !== debtId));
        setTransactions(prev => prev.filter(t => t.accountId !== debtId));
        if (authUser) {
            debtsService.deleteDebt(debtId).catch(err => console.error('Failed to delete debt:', err));
        }
    };

    // Goal Handlers
    const handleAddGoal = (goal: Omit<Goal, 'id'>) => {
        const newGoal = { ...goal, id: new Date().toISOString() };
        setGoals(prev => [...prev, newGoal]);
        if (authUser) {
            goalsService.createGoal(authUser.id, goal).catch(err => console.error('Failed to add goal:', err));
        }
    };
    const handleUpdateGoal = (updatedGoal: Goal) => {
        setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
        if (authUser) {
            goalsService.updateGoal(updatedGoal.id, updatedGoal).catch(err => console.error('Failed to update goal:', err));
        }
    };
    const handleDeleteGoal = (goalId: string) => {
        setGoals(prev => prev.filter(g => g.id !== goalId));
        if (authUser) {
            goalsService.deleteGoal(goalId).catch(err => console.error('Failed to delete goal:', err));
        }
    };

    // Bill Handlers
    const handleAddBill = (bill: Omit<Bill, 'id'>) => {
        const newBill = { ...bill, id: new Date().toISOString() };
        setBills(prev => [...prev, newBill]);
        if (authUser) {
            billsService.createBill(authUser.id, bill).catch(err => console.error('Failed to add bill:', err));
        }
    };
    const handleUpdateBill = (updatedBill: Bill) => {
        setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
        if (authUser) {
            billsService.updateBill(updatedBill.id, updatedBill).catch(err => console.error('Failed to update bill:', err));
        }
    };
    const handleDeleteBill = (billId: string) => {
        setBills(prev => prev.filter(b => b.id !== billId));
        if (authUser) {
            billsService.deleteBill(billId).catch(err => console.error('Failed to delete bill:', err));
        }
    };

    // Recurring Payment Handlers
    const handleAddRecurringPayment = (payment: Omit<RecurringPayment, 'id'>) => {
        const newPayment = { ...payment, id: new Date().toISOString() };
        setRecurringPayments(prev => [...prev, newPayment]);
        if (authUser) {
            recurringPaymentsService.createRecurringPayment(authUser.id, payment).catch(err => console.error('Failed to add recurring payment:', err));
        }
    };
    const handleUpdateRecurringPayment = (updatedPayment: RecurringPayment) => {
        setRecurringPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
        if (authUser) {
            recurringPaymentsService.updateRecurringPayment(updatedPayment.id, updatedPayment).catch(err => console.error('Failed to update recurring payment:', err));
        }
    };
    const handleDeleteRecurringPayment = (paymentId: string) => {
        setRecurringPayments(prev => prev.filter(p => p.id !== paymentId));
        if (authUser) {
            recurringPaymentsService.deleteRecurringPayment(paymentId).catch(err => console.error('Failed to delete recurring payment:', err));
        }
    };
    
    // Transaction Handlers
    const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
        if (transaction.type === 'investing') {
            handleInvestmentTransaction(transaction);
            return;
        }

        if (transaction.type === 'debtpayment') {
            const newTx = { ...transaction, id: new Date().toISOString() };
            setTransactions(prev => [newTx, ...prev]);

            if (authUser) {
                transactionsService.createTransaction(authUser.id, transaction).catch(err => console.error('Failed to add transaction:', err));
            }

            // Decrease source account balance (payment leaving account)
            if (transaction.sourceAccountId) {
                setAssets(prevAssets => prevAssets.map(asset => {
                    if (asset.id === transaction.sourceAccountId) {
                        return { ...asset, balance: asset.balance - transaction.amount };
                    }
                    return asset;
                }));
            }

            // Decrease debt balance (paying down debt)
            setDebts(prevDebts => prevDebts.map(debt => {
                if (debt.id === transaction.accountId) {
                    return { ...debt, balance: debt.balance - transaction.amount };
                }
                return debt;
            }));
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

        const newTx = { ...finalTxData, id: new Date().toISOString() };
        setTransactions(prev => [newTx, ...prev]);

        if (authUser) {
            transactionsService.createTransaction(authUser.id, finalTxData).catch(err => console.error('Failed to add transaction:', err));
        }

        // Update assets
        setAssets(prevAssets => prevAssets.map(asset => {
            if (asset.id === transaction.accountId) {
                const newBalance = transaction.type === 'income' ? asset.balance + transaction.amount : asset.balance - transaction.amount;
                return { ...asset, balance: newBalance };
            }
            return asset;
        }));

        // Update debts
        setDebts(prevDebts => prevDebts.map(debt => {
            if (debt.id === transaction.accountId) {
                const newBalance = transaction.type === 'income' ? debt.balance - transaction.amount : debt.balance + transaction.amount;
                return { ...debt, balance: newBalance };
            }
            return debt;
        }));
    };
    const handleUpdateTransaction = (updatedTransaction: Transaction) => {
        // Find the old transaction to calculate balance adjustment
        const oldTransaction = transactions.find(t => t.id === updatedTransaction.id);

        if (oldTransaction && (oldTransaction.amount !== updatedTransaction.amount || oldTransaction.type !== updatedTransaction.type || oldTransaction.accountId !== updatedTransaction.accountId || oldTransaction.sourceAccountId !== updatedTransaction.sourceAccountId)) {

            // Handle debt payment transactions specially
            if (oldTransaction.type === 'debtpayment' || updatedTransaction.type === 'debtpayment') {
                // Reverse old debt payment
                if (oldTransaction.type === 'debtpayment') {
                    if (oldTransaction.sourceAccountId) {
                        setAssets(prevAssets => prevAssets.map(asset => {
                            if (asset.id === oldTransaction.sourceAccountId) {
                                return { ...asset, balance: asset.balance + oldTransaction.amount };
                            }
                            return asset;
                        }));
                    }
                    setDebts(prevDebts => prevDebts.map(debt => {
                        if (debt.id === oldTransaction.accountId) {
                            return { ...debt, balance: debt.balance + oldTransaction.amount };
                        }
                        return debt;
                    }));
                }

                // Apply new debt payment
                if (updatedTransaction.type === 'debtpayment') {
                    if (updatedTransaction.sourceAccountId) {
                        setAssets(prevAssets => prevAssets.map(asset => {
                            if (asset.id === updatedTransaction.sourceAccountId) {
                                return { ...asset, balance: asset.balance - updatedTransaction.amount };
                            }
                            return asset;
                        }));
                    }
                    setDebts(prevDebts => prevDebts.map(debt => {
                        if (debt.id === updatedTransaction.accountId) {
                            return { ...debt, balance: debt.balance - updatedTransaction.amount };
                        }
                        return debt;
                    }));
                }

                setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
                return;
            }

            const accountChanged = oldTransaction.accountId !== updatedTransaction.accountId;

            // Update assets
            setAssets(prevAssets => prevAssets.map(asset => {
                // Handle old account (reverse the transaction)
                if (asset.id === oldTransaction.accountId) {
                    let balance = asset.balance;
                    if (oldTransaction.type === 'income') {
                        balance -= oldTransaction.amount;
                    } else if (oldTransaction.type === 'expense') {
                        balance += oldTransaction.amount;
                    }
                    return { ...asset, balance };
                }
                // Handle new account (apply the transaction) - only if account changed
                if (accountChanged && asset.id === updatedTransaction.accountId) {
                    let balance = asset.balance;
                    if (updatedTransaction.type === 'income') {
                        balance += updatedTransaction.amount;
                    } else if (updatedTransaction.type === 'expense') {
                        balance -= updatedTransaction.amount;
                    }
                    return { ...asset, balance };
                }
                // If same account, just update with new values
                if (!accountChanged && asset.id === updatedTransaction.accountId) {
                    let balance = asset.balance;
                    if (updatedTransaction.type === 'income') {
                        balance += updatedTransaction.amount;
                    } else if (updatedTransaction.type === 'expense') {
                        balance -= updatedTransaction.amount;
                    }
                    return { ...asset, balance };
                }
                return asset;
            }));

            // Update debts
            setDebts(prevDebts => prevDebts.map(debt => {
                // Handle old account (reverse the transaction)
                if (debt.id === oldTransaction.accountId) {
                    let balance = debt.balance;
                    if (oldTransaction.type === 'income') {
                        balance += oldTransaction.amount;
                    } else if (oldTransaction.type === 'expense') {
                        balance -= oldTransaction.amount;
                    }
                    return { ...debt, balance };
                }
                // Handle new account (apply the transaction) - only if account changed
                if (accountChanged && debt.id === updatedTransaction.accountId) {
                    let balance = debt.balance;
                    if (updatedTransaction.type === 'income') {
                        balance -= updatedTransaction.amount;
                    } else if (updatedTransaction.type === 'expense') {
                        balance += updatedTransaction.amount;
                    }
                    return { ...debt, balance };
                }
                // If same account, just update with new values
                if (!accountChanged && debt.id === updatedTransaction.accountId) {
                    let balance = debt.balance;
                    if (updatedTransaction.type === 'income') {
                        balance -= updatedTransaction.amount;
                    } else if (updatedTransaction.type === 'expense') {
                        balance += updatedTransaction.amount;
                    }
                    return { ...debt, balance };
                }
                return debt;
            }));
        }

        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));

        if (authUser) {
            transactionsService.updateTransaction(updatedTransaction.id, updatedTransaction).catch(err => console.error('Failed to update transaction:', err));
        }
    };

    const handleDeleteTransaction = (transactionId: string) => {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        // Handle debt payment deletions
        if (transaction.type === 'debtpayment') {
            // Reverse the payment from source account (add money back)
            if (transaction.sourceAccountId) {
                setAssets(prevAssets => prevAssets.map(asset => {
                    if (asset.id === transaction.sourceAccountId) {
                        return { ...asset, balance: asset.balance + transaction.amount };
                    }
                    return asset;
                }));
            }
            // Reverse the payment to debt (increase debt back)
            setDebts(prevDebts => prevDebts.map(debt => {
                if (debt.id === transaction.accountId) {
                    return { ...debt, balance: debt.balance + transaction.amount };
                }
                return debt;
            }));
            setTransactions(prev => prev.filter(t => t.id !== transactionId));

            if (authUser) {
                transactionsService.deleteTransaction(transactionId).catch(err => console.error('Failed to delete transaction:', err));
            }

            return;
        }

        // Reverse the transaction's effect on account/debt balances
        setAssets(prevAssets => prevAssets.map(asset => {
            if (asset.id === transaction.accountId) {
                let balance = asset.balance;
                // Reverse the transaction
                if (transaction.type === 'income') {
                    balance -= transaction.amount;
                } else if (transaction.type === 'expense') {
                    balance += transaction.amount;
                }
                return { ...asset, balance };
            }
            return asset;
        }));

        setDebts(prevDebts => prevDebts.map(debt => {
            if (debt.id === transaction.accountId) {
                let balance = debt.balance;
                // Reverse the transaction (income reduces debt, expense increases debt)
                if (transaction.type === 'income') {
                    balance += transaction.amount;
                } else if (transaction.type === 'expense') {
                    balance -= transaction.amount;
                }
                return { ...debt, balance };
            }
            return debt;
        }));

        // Handle investing transactions
        if (transaction.type === 'investing' && transaction.ticker) {
            const accountId = transaction.accountId;

            // Remove the transaction first
            setTransactions(prev => prev.filter(t => t.id !== transactionId));

            if (authUser) {
                transactionsService.deleteTransaction(transactionId).catch(err => console.error('Failed to delete transaction:', err));
            }

            // Recalculate holdings for this account based on remaining transactions
            setAssets(prevAssets => {
                const asset = prevAssets.find(a => a.id === accountId);
                if (!asset || asset.type !== 'Investing') return prevAssets;

                // Get all remaining investing transactions for this account
                const remainingTxs = transactions.filter(tx =>
                    tx.id !== transactionId &&
                    tx.type === 'investing' &&
                    tx.accountId === accountId
                );

                // Recalculate holdings from scratch
                const holdingsMap = new Map<string, any>();

                remainingTxs.forEach(tx => {
                    if (tx.action === 'dividend' || !tx.ticker) return;

                    let pricePerShare = tx.pricePerShare || (tx.total! / Math.abs(tx.shares!));
                    const currencyPrice = tx.currencyPrice || 'GBP';
                    const isPennyStock = currencyPrice === 'GBX';
                    const isLondonListed = isPennyStock;

                    // Convert GBX to GBP by dividing by 100
                    if (isPennyStock) {
                        pricePerShare = pricePerShare / 100;
                    }

                    const exchangeRate = tx.exchangeRate || 1;
                    const priceInGBP = pricePerShare * exchangeRate;

                    const existing = holdingsMap.get(tx.ticker);
                    if (existing) {
                        const currentShares = existing.shares;
                        const newShares = currentShares + tx.shares!;

                        // Treat shares within floating point precision as zero
                        if (Math.abs(newShares) < 0.0001) {
                            holdingsMap.delete(tx.ticker);
                        } else if (newShares > 0) {
                            const totalCost = (existing.avgCost * currentShares) + (priceInGBP * tx.shares!);
                            existing.avgCost = totalCost / newShares;
                            existing.shares = newShares;
                        } else {
                            existing.shares = newShares;
                        }
                    } else if (tx.action === 'buy' && tx.shares! > 0) {
                        holdingsMap.set(tx.ticker, {
                            id: `holding-${Date.now()}-${Math.random()}`,
                            ticker: tx.ticker,
                            name: tx.name || tx.ticker,
                            type: 'Stock',
                            shares: tx.shares,
                            avgCost: priceInGBP,
                            currencyPrice: currencyPrice,
                            isPennyStock: isPennyStock,
                            isLondonListed: isLondonListed
                        });
                    }
                });

                const updatedAssets = prevAssets.map(a => {
                    if (a.id !== accountId) return a;

                    const updatedAsset = {
                        ...a,
                        holdings: Array.from(holdingsMap.values()).filter(h => h.shares > 0.0001)
                    };

                    // Sync to database
                    syncHoldingsToDatabase(updatedAsset);

                    return updatedAsset;
                });

                return updatedAssets;
            });

            return;
        }

        // Remove the transaction
        setTransactions(prev => prev.filter(t => t.id !== transactionId));

        if (authUser) {
            transactionsService.deleteTransaction(transactionId).catch(err => console.error('Failed to delete transaction:', err));
        }
    };

    const handleImportTransactions = (importedTransactions: Transaction[]) => {
        const investingTransactions = importedTransactions.filter(tx => tx.type === 'investing');
        const bankingTransactions = importedTransactions.filter(tx => tx.type !== 'investing');

        setTransactions(prev => [...prev, ...importedTransactions]);

        // Persist imported transactions to database
        if (authUser) {
            importedTransactions.forEach(tx => {
                transactionsService.createTransaction(authUser.id, tx).catch(err => console.error('Failed to import transaction:', err));
            });
        }

        // Get unique tickers from investing transactions to fetch current prices
        const uniqueTickers = [...new Set(investingTransactions.map(tx => tx.ticker).filter(Boolean))];

        // Fetch current market data for all tickers
        if (uniqueTickers.length > 0) {
            const updateHoldingsFromTxs = (prevAssets: Asset[], marketDataResponse?: MarketData) => {
                return prevAssets.map(asset => {
                    const investingTxs = investingTransactions.filter(tx => tx.accountId === asset.id);
                    if (investingTxs.length === 0) return asset;

                    const updatedAsset = { ...asset, holdings: asset.holdings ? [...asset.holdings] : [] };
                    let portfolioValue = 0;

                    investingTxs.forEach(tx => {
                        if (!updatedAsset.holdings) updatedAsset.holdings = [];
                        if (tx.action === 'dividend') return;

                        const existingHoldingIndex = updatedAsset.holdings.findIndex(h => h.ticker === tx.ticker);
                        let pricePerShare = tx.pricePerShare || (tx.total! / Math.abs(tx.shares!));

                        // Auto-detect penny stock from currency
                        const currencyPrice = tx.currencyPrice || 'GBP';
                        const isPennyStock = currencyPrice === 'GBX';
                        const isLondonListed = isPennyStock;

                        // Convert GBX to GBP by dividing by 100
                        if (isPennyStock) {
                            pricePerShare = pricePerShare / 100;
                        }

                        // Apply exchange rate conversion to get price in GBP
                        const exchangeRate = tx.exchangeRate || 1;
                        const priceInGBP = pricePerShare * exchangeRate;

                        if (existingHoldingIndex > -1) {
                            const existingHolding = updatedAsset.holdings[existingHoldingIndex];
                            const currentShares = existingHolding.shares;
                            const newShares = currentShares + tx.shares!;

                            // Treat shares within floating point precision as zero
                            if (Math.abs(newShares) < 0.0001) {
                                updatedAsset.holdings.splice(existingHoldingIndex, 1);
                            } else if (newShares > 0) {
                                const totalCost = (existingHolding.avgCost * currentShares) + (priceInGBP * tx.shares!);
                                existingHolding.avgCost = totalCost / newShares;
                                existingHolding.shares = newShares;
                            } else {
                                existingHolding.shares = newShares;
                            }

                            // Update currency info if not set
                            if (!existingHolding.currencyPrice) existingHolding.currencyPrice = currencyPrice;
                            if (existingHolding.isPennyStock === undefined) existingHolding.isPennyStock = isPennyStock;
                            if (existingHolding.isLondonListed === undefined) existingHolding.isLondonListed = isLondonListed;
                        } else if (tx.action === 'buy' && tx.shares! > 0) {
                            updatedAsset.holdings.push({
                                id: `holding-${Date.now()}-${Math.random()}`,
                                ticker: tx.ticker!,
                                name: tx.name || tx.ticker!,
                                type: 'Stock',
                                shares: tx.shares!,
                                avgCost: priceInGBP,
                                currencyPrice: currencyPrice,
                                isPennyStock: isPennyStock,
                                isLondonListed: isLondonListed
                            });
                        }
                    });

                    if (marketDataResponse && updatedAsset.holdings && updatedAsset.holdings.length > 0) {
                        updatedAsset.holdings.forEach(holding => {
                            const marketPrice = getMarketPriceForTicker(
                                holding.ticker,
                                holding.isLondonListed || false,
                                holding.isPennyStock || false,
                                marketDataResponse
                            );

                            // Only set currentPrice if we have actual market data
                            if (marketPrice) {
                                holding.currentPrice = marketPrice;
                                portfolioValue += holding.shares * marketPrice;
                            } else {
                                // Use avgCost for portfolio calculation but don't set currentPrice
                                portfolioValue += holding.shares * holding.avgCost;
                            }
                        });
                        updatedAsset.balance = portfolioValue;
                    }

                    return updatedAsset;
                });
            };

            setAssets(prevAssets => {
                const tickerMap = getTickerToLondonFlagMap(prevAssets);
                fetchAndMapMarketData(uniqueTickers, tickerMap).then(mapped => {
                    setAssets(prevAssets => {
                        const updatedAssets = updateHoldingsFromTxs(prevAssets, mapped);
                        updatedAssets.forEach(asset => {
                            if (asset.type === 'Investing') {
                                syncHoldingsToDatabase(asset);
                            }
                        });
                        return updatedAssets;
                    });
                }).catch(err => {
                    console.error('Failed to fetch market data:', err);
                    setAssets(prevAssets => {
                        const updatedAssets = updateHoldingsFromTxs(prevAssets);
                        updatedAssets.forEach(asset => {
                            if (asset.type === 'Investing') {
                                syncHoldingsToDatabase(asset);
                            }
                        });
                        return updatedAssets;
                    });
                });

                return prevAssets;
            });
        }

        // Calculate balance changes per account for banking transactions
        const balanceChanges = new Map<string, number>();

        bankingTransactions.forEach(tx => {
            if (tx.type === 'transfer' && tx.recipientAccountId) {
                // Transfer: deduct from source, add to recipient
                const sourceChange = balanceChanges.get(tx.accountId) || 0;
                balanceChanges.set(tx.accountId, sourceChange - tx.amount);

                const recipientChange = balanceChanges.get(tx.recipientAccountId) || 0;
                balanceChanges.set(tx.recipientAccountId, recipientChange + tx.amount);
            } else if (tx.type === 'income') {
                const currentChange = balanceChanges.get(tx.accountId) || 0;
                balanceChanges.set(tx.accountId, currentChange + tx.amount);
            } else if (tx.type === 'expense') {
                const currentChange = balanceChanges.get(tx.accountId) || 0;
                balanceChanges.set(tx.accountId, currentChange - tx.amount);
            }
        });

        // Update asset balances for banking transactions
        setAssets(prevAssets => prevAssets.map(asset => {
            const change = balanceChanges.get(asset.id);
            if (change !== undefined) {
                return { ...asset, balance: asset.balance + change };
            }
            return asset;
        }));

        // Update debt balances
        setDebts(prevDebts => prevDebts.map(debt => {
            const change = balanceChanges.get(debt.id);
            if (change !== undefined) {
                // For debts: expenses increase debt, income decreases debt
                return { ...debt, balance: debt.balance - change };
            }
            return debt;
        }));
    };

    const handleInvestmentTransaction = (tx: Omit<Transaction, 'id'>) => {
        const assetName = marketData[tx.ticker!]?.name || tx.ticker!;
        const tickerNameForLogo = tx.ticker!.split('-')[0].toLowerCase();

        const newTx = {
            ...tx,
            id: new Date().toISOString(),
            logo: `https://logo.clearbit.com/${tickerNameForLogo}.com`,
            merchant: `${assetName} (${tx.ticker})`,
            category: 'Investment'
        };

        setTransactions(prev => [newTx, ...prev]);

        if (authUser) {
            transactionsService.createTransaction(authUser.id, tx).catch(err => console.error('Failed to add transaction:', err));
        }

        setAssets(prevAssets => {
            const newAssets = [...prevAssets];
            const sourceAssetIndex = newAssets.findIndex(a => a.id === tx.sourceAccountId);
            if(sourceAssetIndex > -1) newAssets[sourceAssetIndex].balance -= tx.amount;
            
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
                        id: `holding-${Date.now()}-${Math.random()}`,
                        ticker: tx.ticker!,
                        name: marketData[tx.ticker!]?.name || tx.ticker!,
                        type: tx.category as 'Stock' | 'Crypto',
                        shares: tx.shares!,
                        avgCost: tx.purchasePrice!
                    });
                }

                // Sync holdings to database
                syncHoldingsToDatabase(investmentAccount);
            }
            return newAssets;
        });
    };

    const handleUpdateHolding = async (accountId: string, ticker: string, updates: { icon?: string; isLondonListed?: boolean; isPennyStock?: boolean; currencyPrice?: string }) => {
        const holding = assets.find(a => a.id === accountId)?.holdings?.find(h => h.ticker === ticker);
        if (!holding) return;

        setAssets(prevAssets => prevAssets.map(asset => {
            if (asset.id !== accountId || !asset.holdings) return asset;
            return {
                ...asset,
                holdings: asset.holdings.map(h => h.ticker === ticker ? { ...h, ...updates } : h)
            };
        }));

        try {
            const dbUpdates: Record<string, any> = {};
            if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
            if (updates.isLondonListed !== undefined) dbUpdates.is_london_listed = updates.isLondonListed;
            if (updates.isPennyStock !== undefined) dbUpdates.is_penny_stock = updates.isPennyStock;
            if (updates.currencyPrice !== undefined) dbUpdates.currency_price = updates.currencyPrice;
            dbUpdates.name = holding.name;
            dbUpdates.type = holding.type;
            dbUpdates.shares = holding.shares;
            dbUpdates.avg_cost = holding.avgCost;

            const saved = await holdingsService.upsertByTicker(accountId, ticker, dbUpdates);

            setAssets(prevAssets => prevAssets.map(asset => {
                if (asset.id !== accountId || !asset.holdings) return asset;
                return {
                    ...asset,
                    holdings: asset.holdings.map(h => h.ticker === ticker ? { ...h, id: saved.id } : h)
                };
            }));
        } catch (err) {
            console.error('Failed to update holding:', err);
        }
    };

    const syncHoldingsToDatabase = async (asset: Asset) => {
        if (asset.type !== 'Investing' || !asset.holdings) return;

        try {
            for (const holding of asset.holdings) {
                // Treat shares within floating point precision as zero
                if (holding.shares > 0.0001) {
                    const dbUpdates: Record<string, any> = {
                        name: holding.name,
                        type: holding.type,
                        shares: holding.shares,
                        avg_cost: holding.avgCost,
                        is_london_listed: holding.isLondonListed ?? false,
                        is_penny_stock: holding.isPennyStock ?? false,
                        currency_price: holding.currencyPrice || 'GBP'
                    };
                    if (holding.icon) dbUpdates.icon = holding.icon;

                    await holdingsService.upsertByTicker(asset.id, holding.ticker, dbUpdates);
                } else {
                    await holdingsService.deleteHoldingByTicker(asset.id, holding.ticker);
                }
            }

            // Calculate and update account balance
            const newBalance = asset.holdings.reduce((total, holding) => {
                if (holding.shares > 0.0001) {
                    const currentPrice = holding.currentPrice || holding.avgCost || 0;
                    return total + (currentPrice * holding.shares);
                }
                return total;
            }, 0);

            await assetsService.updateAsset(asset.id, { balance: newBalance });
        } catch (err) {
            console.error('Failed to sync holdings to database:', err);
        }
    };

    // Budget Handlers
    const handleUpdateBudgets = (updatedBudgets: Budgets) => {
        setBudgets(updatedBudgets);
        if (authUser) {
            budgetService.upsertBudget(authUser.id, updatedBudgets).catch(err => console.error('Failed to update budgets:', err));
        }
    };

    // Category Handlers
    const handleAddCategory = (category: Omit<Category, 'id'>) => {
        const newCategory = { ...category, id: new Date().toISOString() };
        setCategories(prev => [...prev, newCategory]);
        if (authUser) {
            categoriesService.createCategory(authUser.id, category).catch(err => console.error('Failed to add category:', err));
        }
    };
    const handleUpdateCategory = (updatedCategory: Category) => {
        setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
        if (authUser) {
            categoriesService.updateCategory(updatedCategory.id, updatedCategory).catch(err => console.error('Failed to update category:', err));
        }
    };
    const handleDeleteCategory = (categoryId: string) => {
        setCategories(prev => prev.filter(c => c.id !== categoryId));
        if (authUser) {
            categoriesService.deleteCategory(categoryId).catch(err => console.error('Failed to delete category:', err));
        }
    };

    // Rule Handlers
    const handleAddRule = (rule: Omit<TransactionRule, 'id'>) => {
        const newRule = { ...rule, id: new Date().toISOString() };
        setRules(prev => [...prev, newRule]);
        if (authUser) {
            transactionRulesService.createRule(authUser.id, rule).catch(err => console.error('Failed to add rule:', err));
        }
    };
    const handleUpdateRule = (updatedRule: TransactionRule) => {
        setRules(prev => prev.map(r => r.id === updatedRule.id ? updatedRule : r));
        if (authUser) {
            transactionRulesService.updateRule(updatedRule.id, updatedRule).catch(err => console.error('Failed to update rule:', err));
        }
    };
    const handleDeleteRule = (ruleId: string) => {
        setRules(prev => prev.filter(r => r.id !== ruleId));
        if (authUser) {
            transactionRulesService.deleteRule(ruleId).catch(err => console.error('Failed to delete rule:', err));
        }
    };

    // Notification Handlers
    const handleMarkAllNotificationsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const handleNotificationClick = (notification: Notification) => {
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
    };
    const handleCloseSummaryModal = () => setIsSummaryModalOpen(false);


    // Theme Handler
    const handleToggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

    // Market Data Refresh Handler
    const handleRefreshMarketData = async () => {
        const investingAssets = assets.filter(a => a.type === 'Investing' && a.holdings && a.holdings.length > 0);

        if (investingAssets.length === 0) {
            alert('No investment holdings to refresh.');
            return;
        }

        clearMarketDataCache();
        const marketData = await fetchMarketDataWithLondonSuffix(investingAssets);
        setMarketData(marketData);
        alert(`Refreshed market data for ${Object.keys(marketData).length} tickers.`);
    };

    // Data Wipe Handler
    const handleWipeData = (option: string) => {
        switch (option) {
            case 'restoreDefaultCategories':
                // Add missing default categories while preserving existing ones
                const existingCategoryNames = new Set(categories.map(c => c.name));
                const defaultCatNames = new Set(mockCategories.map(c => c.name));
                const categoriesToAdd = mockCategories.filter(cat => !existingCategoryNames.has(cat.name));

                if (categoriesToAdd.length > 0) {
                    const maxId = categories.length > 0 ? Math.max(...categories.map(c => parseInt(c.id) || 0)) : 0;
                    const newCategories = categoriesToAdd.map((cat, idx) => ({
                        ...cat,
                        id: (maxId + idx + 1).toString()
                    }));
                    setCategories(prev => [...prev, ...newCategories]);
                    alert(`Added ${categoriesToAdd.length} default categories!`);
                } else {
                    alert("All default categories are already present.");
                }
                break;
            case 'allTransactions':
                setTransactions([]);
                alert("All transactions have been deleted.");
                break;
            case 'oldTransactions':
                const sixMonthsAgo = addMonths(new Date(), -6);
                setTransactions(prev => prev.filter(t => new Date(t.date) >= sixMonthsAgo));
                alert("Transactions older than 6 months have been deleted.");
                break;
            case 'resetAccounts':
                // Reset all account balances to £0 while keeping the accounts
                setAssets(prev => prev.map(asset => ({ ...asset, balance: 0 })));
                setDebts(prev => prev.map(debt => ({ ...debt, balance: 0 })));
                alert("All account balances have been reset to £0.");
                break;
            case 'deleteAndResetBalances':
                // Delete all transactions and reset balances to £0
                setTransactions([]);
                setAssets(prev => prev.map(asset => ({ ...asset, balance: 0 })));
                setDebts(prev => prev.map(debt => ({ ...debt, balance: 0 })));
                alert("All transactions deleted and account balances reset to £0.");
                break;
            case 'fullReset':
                setAssets(mockAssets); setDebts(mockDebts); setGoals(mockGoals); setBills(mockBills);
                setRecurringPayments(mockRecurringPayments); setTransactions(allTransactions); setBudgets(mockBudgets);
                setCategories(mockCategories); setRules(mockRules); setNotifications([]); setCurrency('GBP');
                setNotificationsEnabled(true); setAutoCategorize(true); setSmartSuggestions(true);
                alert("Application data has been fully reset.");
                break;
            default:
                break;
        }
    };

    // Custom Transaction Deletion Handler
    const handleDeleteTransactions = (params: { accountId?: string; level?: string; beforeDate?: string }) => {
        const { accountId, level, beforeDate } = params;

        if (accountId) {
            if (level === 'all') {
                setTransactions(prev => prev.filter(t => t.accountId !== accountId));
            } else if (beforeDate) {
                setTransactions(prev => prev.filter(t => {
                    if (t.accountId !== accountId) return true;
                    return new Date(t.date) >= new Date(beforeDate);
                }));
            }
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
                return <Transactions transactions={transactions} assets={assets} debts={debts} budgets={budgets} categories={categories} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateBudgets={handleUpdateBudgets} user={user} notifications={notifications} onUpdateUser={handleUpdateUser} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} onNotificationClick={handleNotificationClick} navigateTo={navigateTo} theme={theme} onToggleTheme={handleToggleTheme} />;
            case Page.Accounts:
                return <Accounts assets={assets} marketData={marketData} onAddAsset={handleAddAsset} onUpdateAsset={handleUpdateAsset} onDeleteAsset={handleDeleteAsset} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} transactions={transactions} user={user} notifications={notifications} debts={debts} onUpdateUser={handleUpdateUser} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} onNotificationClick={handleNotificationClick} navigateTo={navigateTo} theme={theme} onToggleTheme={handleToggleTheme} onUpdateHolding={handleUpdateHolding} />;
            case Page.Debts:
                return <Debts debts={debts} onAddDebt={handleAddDebt} onUpdateDebt={handleUpdateDebt} onDeleteDebt={handleDeleteDebt} onAddTransaction={handleAddTransaction} transactions={transactions} user={user} notifications={notifications} assets={assets} onUpdateUser={handleUpdateUser} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} onNotificationClick={handleNotificationClick} navigateTo={navigateTo} theme={theme} onToggleTheme={handleToggleTheme} />;
            case Page.Trends:
                return <Trends assets={assets} debts={debts} transactions={transactions} user={user} notifications={notifications} onUpdateUser={handleUpdateUser} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} onNotificationClick={handleNotificationClick} navigateTo={navigateTo} theme={theme} onToggleTheme={handleToggleTheme} />;
            case Page.Goals:
                 return <Goals goals={goals} assets={assets} onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal} onDeleteGoal={handleDeleteGoal} highlightedItemId={highlightedItemId} setHighlightedItemId={setHighlightedItemId} user={user} notifications={notifications} debts={debts} onUpdateUser={handleUpdateUser} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} onNotificationClick={handleNotificationClick} navigateTo={navigateTo} theme={theme} onToggleTheme={handleToggleTheme} />;
            case Page.Bills:
                 return <Bills bills={bills} assets={assets} onAddBill={handleAddBill} onUpdateBill={handleUpdateBill} onDeleteBill={handleDeleteBill} highlightedItemId={highlightedItemId} setHighlightedItemId={setHighlightedItemId} user={user} notifications={notifications} debts={debts} onUpdateUser={handleUpdateUser} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} onNotificationClick={handleNotificationClick} navigateTo={navigateTo} theme={theme} onToggleTheme={handleToggleTheme} />;
            case Page.Recurring:
                return <Recurring payments={recurringPayments} assets={assets} debts={debts} onAddPayment={handleAddRecurringPayment} onUpdatePayment={handleUpdateRecurringPayment} onDeletePayment={handleDeleteRecurringPayment} user={user} notifications={notifications} onUpdateUser={handleUpdateUser} onMarkAllNotificationsRead={handleMarkAllNotificationsRead} onNotificationClick={handleNotificationClick} navigateTo={navigateTo} theme={theme} onToggleTheme={handleToggleTheme} />;
            case Page.Categorize:
                 return <Categorize transactions={uncategorizedTransactions} onUpdateTransaction={handleUpdateTransaction} onAddRule={handleAddRule} assets={assets} debts={debts} categories={categories} />;
            case Page.Settings:
                return <Settings
                            categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory}
                            rules={rules} onAddRule={handleAddRule} onUpdateRule={handleUpdateRule} onDeleteRule={handleDeleteRule}
                            onWipeData={handleWipeData}
                            notificationsEnabled={notificationsEnabled} onToggleNotifications={() => setNotificationsEnabled(prev => !prev)}
                            autoCategorize={autoCategorize} onToggleAutoCategorize={() => setAutoCategorize(prev => !prev)}
                            smartSuggestions={smartSuggestions} onToggleSmartSuggestions={() => setSmartSuggestions(prev => !prev)}
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
                            onRefreshMarketData={handleRefreshMarketData}
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

    if (authLoading || (authUser && isDataLoading)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900">
                <LoadingSpinner />
            </div>
        );
    }

    if (!authUser) {
        return <AuthContainer />;
    }

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
            <div className={`flex min-h-screen bg-base-bg text-gray-200 ${theme}`}>
                <Sidebar currentPage={currentPage} navigateTo={navigateTo} />
                <main className="flex-1 p-8 bg-base-bg overflow-y-auto">
                    {renderPage()}
                </main>
            </div>
        </CurrencyContext.Provider>
    );
};

export default App;