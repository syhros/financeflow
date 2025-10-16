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
import { mockAssets, mockDebts, mockGoals, mockBills, mockRecurringPayments, allTransactions, mockBudgets, mockCategories, mockRules, mockUser } from './data/mockData';
import { fetchMarketData } from './services/marketData';
import { generateNotifications } from './services/notificationService';
// FIX: Removed `subMonths` as it was causing an import error. `addMonths` with a negative value will be used instead.
import { addWeeks, addMonths, addYears, isAfter } from 'date-fns';

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

    // --- Interactive Notification State ---
    const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [summaryTransactions, setSummaryTransactions] = useState<Transaction[]>([]);


    const formatCurrency = useCallback((amount: number) => {
        const options = {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
        };
        const locale = currency === 'GBP' ? 'en-GB' : currency === 'USD' ? 'en-US' : 'de-DE';
        return new Intl.NumberFormat(locale, options).format(amount);
    }, [currency]);

    // Memoize tickers to prevent unnecessary API calls
    const investmentTickersJson = useMemo(() => {
        const tickers = assets
            .filter(a => a.type === 'Investing' && a.holdings)
            .flatMap(a => a.holdings!.map(h => h.ticker));
        return JSON.stringify([...new Set(tickers)].sort());
    }, [assets]);
    
    // Fetch market data only when tickers change
    useEffect(() => {
        const uniqueTickers = JSON.parse(investmentTickersJson);
        if (uniqueTickers.length > 0) {
            fetchMarketData(uniqueTickers).then(setMarketData);
        }
    }, [investmentTickersJson]);

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
            const newAssets = prevAssets.map(asset => {
                if (asset.type === 'Investing' && asset.holdings) {
                    const newBalance = asset.holdings.reduce((total, holding) => {
                        const currentPrice = marketData[holding.ticker]?.price || 0;
                        return total + (currentPrice * holding.shares);
                    }, 0);

                    // Compare balances with a tolerance for floating point issues
                    if (Math.abs(asset.balance - newBalance) > 0.01) {
                        needsUpdate = true;
                        return { ...asset, balance: newBalance };
                    }
                }
                return asset;
            });

            // Only return new array if something actually changed to prevent re-render loop
            return needsUpdate ? newAssets : prevAssets;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketData]);

    const navigateTo = useCallback((page: Page) => {
        setCurrentPage(page);
    }, []);

    // User Handler
    const handleUpdateUser = (updatedUser: User) => setUser(updatedUser);

    // Asset Handlers
    const handleAddAsset = (asset: Omit<Asset, 'id'>) => setAssets(prev => [...prev, { ...asset, id: new Date().toISOString() }]);
    const handleUpdateAsset = (updatedAsset: Asset, oldBalance?: number) => {
        // Update the asset with all new properties
        setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    };

    // Debt Handlers
    const handleAddDebt = (debt: Omit<Debt, 'id'>) => setDebts(prev => [...prev, { ...debt, id: new Date().toISOString() }]);
    const handleUpdateDebt = (updatedDebt: Debt, oldBalance?: number) => {
        // Update the debt with all new properties
        setDebts(prev => prev.map(d => d.id === updatedDebt.id ? updatedDebt : d));
    };

    // Goal Handlers
    const handleAddGoal = (goal: Omit<Goal, 'id'>) => setGoals(prev => [...prev, { ...goal, id: new Date().toISOString() }]);
    const handleUpdateGoal = (updatedGoal: Goal) => setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    
    // Bill Handlers
    const handleAddBill = (bill: Omit<Bill, 'id'>) => setBills(prev => [...prev, { ...bill, id: new Date().toISOString() }]);
    const handleUpdateBill = (updatedBill: Bill) => setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
    
    // Recurring Payment Handlers
    const handleAddRecurringPayment = (payment: Omit<RecurringPayment, 'id'>) => setRecurringPayments(prev => [...prev, { ...payment, id: new Date().toISOString() }]);
    const handleUpdateRecurringPayment = (updatedPayment: RecurringPayment) => setRecurringPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
    
    // Transaction Handlers
    const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
        if (transaction.type === 'investing') {
            handleInvestmentTransaction(transaction);
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

        if (oldTransaction && (oldTransaction.amount !== updatedTransaction.amount || oldTransaction.type !== updatedTransaction.type || oldTransaction.accountId !== updatedTransaction.accountId)) {
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
    };

    const handleDeleteTransaction = (transactionId: string) => {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;

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

        // Remove the transaction
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
    };

    const handleImportTransactions = (importedTransactions: Transaction[]) => {
        setTransactions(prev => [...prev, ...importedTransactions]);
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
                        ticker: tx.ticker!,
                        name: marketData[tx.ticker!]?.name || tx.ticker!,
                        type: tx.category as 'Stock' | 'Crypto',
                        shares: tx.shares!,
                        avgCost: tx.purchasePrice!
                    });
                }
            }
            return newAssets;
        });
    };

    // Budget Handlers
    const handleUpdateBudgets = (updatedBudgets: Budgets) => setBudgets(updatedBudgets);

    // Category Handlers
    const handleAddCategory = (category: Omit<Category, 'id'>) => setCategories(prev => [...prev, { ...category, id: new Date().toISOString() }]);
    const handleUpdateCategory = (updatedCategory: Category) => setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    const handleDeleteCategory = (categoryId: string) => setCategories(prev => prev.filter(c => c.id !== categoryId));
    
    // Rule Handlers
    const handleAddRule = (rule: Omit<TransactionRule, 'id'>) => setRules(prev => [...prev, { ...rule, id: new Date().toISOString() }]);
    const handleDeleteRule = (ruleId: string) => setRules(prev => prev.filter(r => r.id !== ruleId));

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

    // Data Wipe Handler
    const handleWipeData = (option: string) => {
        switch (option) {
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
                return <Transactions transactions={transactions} assets={assets} debts={debts} budgets={budgets} categories={categories} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onUpdateBudgets={handleUpdateBudgets} />;
            case Page.Accounts:
                return <Accounts assets={assets} marketData={marketData} onAddAsset={handleAddAsset} onUpdateAsset={handleUpdateAsset} onAddTransaction={handleAddTransaction} transactions={transactions} />;
            case Page.Debts:
                return <Debts debts={debts} onAddDebt={handleAddDebt} onUpdateDebt={handleUpdateDebt} onAddTransaction={handleAddTransaction} transactions={transactions} />;
            case Page.Trends:
                return <Trends assets={assets} debts={debts} transactions={transactions} />;
            case Page.Goals:
                 return <Goals goals={goals} assets={assets} onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal} highlightedItemId={highlightedItemId} setHighlightedItemId={setHighlightedItemId} />;
            case Page.Bills:
                 return <Bills bills={bills} assets={assets} onAddBill={handleAddBill} onUpdateBill={handleUpdateBill} highlightedItemId={highlightedItemId} setHighlightedItemId={setHighlightedItemId} />;
            case Page.Recurring:
                return <Recurring payments={recurringPayments} assets={assets} debts={debts} onAddPayment={handleAddRecurringPayment} onUpdatePayment={handleUpdateRecurringPayment} />;
            case Page.Categorize:
                 return <Categorize transactions={uncategorizedTransactions} onUpdateTransaction={handleUpdateTransaction} onAddRule={handleAddRule} assets={assets} debts={debts} categories={categories} />;
            case Page.Settings:
                return <Settings
                            categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory}
                            rules={rules} onAddRule={handleAddRule} onDeleteRule={handleDeleteRule}
                            onWipeData={handleWipeData}
                            notificationsEnabled={notificationsEnabled} onToggleNotifications={() => setNotificationsEnabled(prev => !prev)}
                            autoCategorize={autoCategorize} onToggleAutoCategorize={() => setAutoCategorize(prev => !prev)}
                            smartSuggestions={smartSuggestions} onToggleSmartSuggestions={() => setSmartSuggestions(prev => !prev)}
                            assets={assets} debts={debts}
                            onImportTransactions={handleImportTransactions}
                            onAddAsset={handleAddAsset}
                            onAddDebt={handleAddDebt}
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