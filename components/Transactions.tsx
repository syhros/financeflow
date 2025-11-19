import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card';
import { Transaction, Asset, Debt, Budgets, Category, User, Notification, Page } from '../types';
import { BudgetDoughnut } from './charts';
import { PlusIcon, PencilIcon, CloseIcon } from './icons';
import { format } from 'date-fns';
import { useCurrency } from '../App';
import UserHeader from './shared/UserHeader';

interface TransactionsProps {
    transactions: Transaction[];
    assets: Asset[];
    debts: Debt[];
    budgets: Budgets;
    categories: Category[];
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    onUpdateTransaction: (transaction: Transaction) => void;
    onDeleteTransaction: (transactionId: string) => void;
    onUpdateBudgets: (budgets: Budgets) => void;
    user: User;
    notifications: Notification[];
    onUpdateUser: (user: User) => void;
    onMarkAllNotificationsRead: () => void;
    onNotificationClick: (notification: Notification) => void;
    navigateTo: (page: Page) => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    onSignOut?: () => void;
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; className?: string; }> = ({ isOpen, onClose, title, children, className }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className={`bg-card-bg rounded-lg shadow-xl w-full border border-border-color overflow-hidden ${className || 'max-w-lg'}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border-color">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

const AddEditTransactionModal: React.FC<{ isOpen: boolean; onClose: () => void; transaction?: Transaction; assets: Asset[]; debts: Debt[]; categories: Category[]; onSave: (transaction: any) => void; onDelete?: (transactionId: string) => void; }> = ({ isOpen, onClose, transaction, assets, debts, categories, onSave, onDelete }) => {
    const [formData, setFormData] = useState<any>({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { currency } = useCurrency();
    const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';

    useEffect(() => {
        if (transaction) {
            setFormData({
                ...transaction,
                date: format(new Date(transaction.date), "yyyy-MM-dd'T'HH:mm")
            });
        } else {
            setFormData({
                merchant: '',
                amount: 0,
                type: 'expense',
                date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                category: '',
                accountId: '',
                logo: 'https://logo.clearbit.com/default.com'
            });
        }
    }, [transaction, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSave = () => {
        let dataToSave;
        if(formData.type === 'investing') {
            dataToSave = {
                ...formData,
                amount: (formData.shares || 0) * (formData.purchasePrice || 0),
                date: new Date(formData.date).toISOString()
            };
        } else {
             dataToSave = {
                ...formData,
                amount: parseFloat(formData.amount) || 0,
                date: new Date(formData.date).toISOString()
            };
        }
        onSave(dataToSave);
        onClose();
    };

    const handleDelete = () => {
        if (transaction?.id && onDelete) {
            onDelete(transaction.id);
            onClose();
            setShowDeleteConfirm(false);
        }
    };

    const commonInputStyles = "w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none transition-colors";
    const labelStyles = "block text-sm font-medium text-gray-300 mb-2";
    
    const cashAccounts = assets.filter(a => a.type === 'Checking' || a.type === 'Savings');
    const investingAccounts = assets.filter(a => a.type === 'Investing');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={transaction ? 'Edit Transaction' : 'Add Transaction'}>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="type" className={labelStyles}>Transaction Type</label>
                    <select id="type" value={formData.type || 'expense'} onChange={handleChange} className={commonInputStyles}>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                        <option value="investing">Investing</option>
                    </select>
                </div>
                
                {formData.type === 'investing' ? (
                    <>
                        <div><label htmlFor="ticker" className={labelStyles}>Ticker</label><input type="text" id="ticker" placeholder="e.g., AAPL, BTC-USD" value={formData.ticker || ''} onChange={handleChange} className={commonInputStyles} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label htmlFor="shares" className={labelStyles}>Amount / Shares</label><input type="number" id="shares" value={formData.shares || 0} onChange={e => setFormData({...formData, shares: parseFloat(e.target.value)})} className={commonInputStyles} /></div>
                            <div><label htmlFor="purchasePrice" className={labelStyles}>Price per Share</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span><input type="number" id="purchasePrice" value={formData.purchasePrice || 0} onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value)})} className={`${commonInputStyles} pl-7`} /></div></div>
                        </div>
                        <div>
                            <label htmlFor="accountId" className={labelStyles}>Investing Account</label>
                            <select id="accountId" value={formData.accountId || ''} onChange={handleChange} className={commonInputStyles}>
                                <option value="">Select Investing Account</option>
                                {investingAccounts.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label htmlFor="sourceAccountId" className={labelStyles}>Source of Funds</label>
                            <select id="sourceAccountId" value={formData.sourceAccountId || ''} onChange={handleChange} className={commonInputStyles}>
                                <option value="">Select Cash Account</option>
                                {cashAccounts.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                            </select>
                        </div>
                        <div><label htmlFor="category" className={labelStyles}>Asset Type</label><select id="category" value={formData.category || 'Stock'} onChange={handleChange} className={commonInputStyles}><option>Stock</option><option>Crypto</option></select></div>
                    </>
                ) : (
                    <>
                         <div><label htmlFor="merchant" className={labelStyles}>Merchant / Source</label><input type="text" id="merchant" value={formData.merchant || ''} onChange={handleChange} className={commonInputStyles} /></div>
                         <div>
                            <label htmlFor="amount" className={labelStyles}>Amount</label>
                            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span><input type="number" id="amount" value={formData.amount || 0} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className={`${commonInputStyles} pl-7`} /></div>
                        </div>
                        <div>
                            <label htmlFor="category" className={labelStyles}>Category</label>
                            <select id="category" value={formData.category || ''} onChange={handleChange} className={commonInputStyles}>
                                <option value="">Select Category</option>
                                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="accountId" className={labelStyles}>Account</label>
                            <select id="accountId" value={formData.accountId || ''} onChange={handleChange} className={commonInputStyles}>
                                <option value="">Select Account</option>
                                <optgroup label="Regular Accounts">
                                    {cashAccounts.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                                </optgroup>
                                <optgroup label="Debt Accounts">
                                    {debts.filter(d => d.status === 'Active').map(debt => <option key={debt.id} value={debt.id}>{debt.name}</option>)}
                                </optgroup>
                            </select>
                        </div>
                    </>
                )}
                 <div><label htmlFor="date" className={labelStyles}>Date & Time</label><input type="datetime-local" id="date" value={formData.date || ''} onChange={handleChange} className={commonInputStyles} /></div>

                {showDeleteConfirm && (
                    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                        <p className="text-white font-semibold mb-3">Confirm deletion</p>
                        <div className="flex gap-3">
                            <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">Yes</button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors">No</button>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <button className="w-full py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors" onClick={onClose}>Cancel</button>
                    {transaction && onDelete && (
                        <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors">Delete</button>
                    )}
                    <button onClick={handleSave} className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 transition-colors">{transaction ? 'Update' : 'Add'}</button>
                </div>
            </div>
        </Modal>
    );
};

const EditBudgetsModal: React.FC<{ isOpen: boolean; onClose: () => void; budgets: Budgets; onSave: (budgets: Budgets) => void; }> = ({ isOpen, onClose, budgets, onSave }) => {
    const [formData, setFormData] = useState<Budgets>(budgets);
    const { currency } = useCurrency();
    const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';

    useEffect(() => {
        setFormData(budgets);
    }, [budgets, isOpen]);
    
    const handleSave = () => {
        onSave({
            income: Number(formData.income),
            expense: Number(formData.expense)
        });
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Budgets">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Monthly Expense Budget</label>
                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span><input type="number" value={formData.expense} onChange={e => setFormData(f => ({...f, expense: Number(e.target.value)}))} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none transition-colors pl-7" /></div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Monthly Income Goal</label>
                     <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span><input type="number" value={formData.income} onChange={e => setFormData(f => ({...f, income: Number(e.target.value)}))} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none transition-colors pl-7" /></div>
                </div>
                 <div className="flex gap-4 pt-4">
                    <button className="w-full py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors" onClick={onClose}>Cancel</button>
                    <button onClick={handleSave} className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 transition-colors">Save Budgets</button>
                </div>
            </div>
        </Modal>
    );
};


const TransactionItem: React.FC<{ tx: Transaction, onEdit: (tx: Transaction) => void, isSelecting?: boolean, isSelected?: boolean, onToggleSelect?: (txId: string) => void }> = ({ tx, onEdit, isSelecting, isSelected, onToggleSelect }) => {
    const { formatCurrency } = useCurrency();

    const handleClick = () => {
        if (isSelecting) {
            onToggleSelect?.(tx.id);
        }
    };

    return (
        <div
            className={`flex items-center justify-between py-4 ${isSelecting ? 'cursor-pointer hover:bg-gray-700/30 rounded-lg px-2 -mx-2 transition-colors' : ''}`}
            onClick={handleClick}
        >
            <div className="flex items-center gap-3">
                {isSelecting && (
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                            e.stopPropagation();
                            onToggleSelect?.(tx.id);
                        }}
                        className="w-5 h-5 rounded border-gray-500 text-primary focus:ring-primary pointer-events-none"
                    />
                )}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-700">
                    <img src={tx.logo} alt={tx.merchant} className="w-6 h-6 rounded-md" />
                </div>
                <div>
                    <p className="font-semibold text-white">{tx.merchant}</p>
                    <p className="text-xs text-gray-400">{tx.category} &bull; {format(new Date(tx.date), 'dd MMM, p')}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <p className={`font-bold ${tx.type === 'income' ? 'text-primary' : 'text-white'}`}>
                    {tx.type === 'income' ? '+' : tx.type === 'investing' ? '' : '-'}{formatCurrency(tx.amount).replace(/[+-]/g, '')}
                </p>
                {!isSelecting && <button onClick={(e) => { e.stopPropagation(); onEdit(tx); }} className="text-gray-500 hover:text-white"><PencilIcon className="w-4 h-4" /></button>}
            </div>
        </div>
    );
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, assets, debts, budgets, categories, onAddTransaction, onUpdateTransaction, onDeleteTransaction, onUpdateBudgets, user, notifications, onUpdateUser, onMarkAllNotificationsRead, onNotificationClick, navigateTo, theme, onToggleTheme, onSignOut }) => {
    const [filter, setFilter] = useState<'all' | 'expense' | 'income' | 'investing'>('all');
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
    const [chartView, setChartView] = useState<'expense' | 'income'>('expense');
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | undefined>(undefined);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(() => {
        const saved = localStorage.getItem('zenith-transactions-per-page');
        return saved ? parseInt(saved) : 12;
    });
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const { formatCurrency } = useCurrency();

    // Save per page preference
    useEffect(() => {
        localStorage.setItem('zenith-transactions-per-page', perPage.toString());
    }, [perPage]);
    
    useEffect(() => {
        if(filter === 'income' || filter === 'expense') {
            setChartView(filter);
        } else {
            setChartView('expense');
        }
    }, [filter]);

    const handleOpenTxModal = (tx?: Transaction) => {
        setEditingTx(tx);
        setIsTxModalOpen(true);
    }
    
    const handleSaveTransaction = (data: any) => {
        if(data.id) {
            onUpdateTransaction(data);
        } else {
            onAddTransaction(data);
        }
    }

    const handleToggleSelect = (txId: string) => {
        if (selectedTxIds.includes(txId)) {
            setSelectedTxIds(selectedTxIds.filter(id => id !== txId));
        } else {
            setSelectedTxIds([...selectedTxIds, txId]);
        }
    };

    const handleCancelSelect = () => {
        setIsSelecting(false);
        setSelectedTxIds([]);
        setShowBulkDeleteConfirm(false);
    };

    const handleBulkDelete = () => {
        selectedTxIds.forEach(txId => {
            onDeleteTransaction(txId);
        });
        handleCancelSelect();
    };

    const { totalExpenses, totalIncome } = useMemo(() => {
        const now = new Date();
        const thisMonthTxs = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        });
        return {
            totalExpenses: thisMonthTxs.filter(t => t.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0),
            totalIncome: thisMonthTxs.filter(t => t.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
        }
    }, [transactions]);


    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true;
        return tx.type === filter;
    });

    // Sort transactions
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        switch(sortBy) {
            case 'date-desc':
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            case 'date-asc':
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            case 'amount-desc':
                return b.amount - a.amount;
            case 'amount-asc':
                return a.amount - b.amount;
            default:
                return 0;
        }
    });

    // Pagination
    const totalPages = Math.ceil(sortedTransactions.length / perPage);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    return (
        <>
        <AddEditTransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} transaction={editingTx} assets={assets} debts={debts} categories={categories} onSave={handleSaveTransaction} onDelete={onDeleteTransaction} />
        <EditBudgetsModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} budgets={budgets} onSave={onUpdateBudgets} />
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Transactions</h1>
                <UserHeader
                    user={user}
                    notifications={notifications}
                    onUpdateUser={onUpdateUser}
                    onMarkAllNotificationsRead={onMarkAllNotificationsRead}
                    onNotificationClick={onNotificationClick}
                    navigateTo={navigateTo}
                    theme={theme}
                    onToggleTheme={onToggleTheme}
                    assets={assets}
                    debts={debts}
                    onSignOut={onSignOut}
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <div className="space-y-4 mb-4">
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
                                        <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm rounded-md ${filter === 'all' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>All</button>
                                        <button onClick={() => setFilter('expense')} className={`px-4 py-2 text-sm rounded-md ${filter === 'expense' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Expenses</button>
                                        <button onClick={() => setFilter('income')} className={`px-4 py-2 text-sm rounded-md ${filter === 'income' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Income</button>
                                        <button onClick={() => setFilter('investing')} className={`px-4 py-2 text-sm rounded-md ${filter === 'investing' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Investing</button>
                                    </div>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="bg-gray-900 text-white px-4 py-2 text-sm rounded-lg border border-gray-700 focus:border-primary outline-none"
                                    >
                                        <option value="date-desc">Date (Newest First)</option>
                                        <option value="date-asc">Date (Oldest First)</option>
                                        <option value="amount-desc">Amount (High to Low)</option>
                                        <option value="amount-asc">Amount (Low to High)</option>
                                    </select>
                                    <button onClick={() => handleOpenTxModal()} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        Add New
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    {isSelecting ? (
                                        <>
                                            {selectedTxIds.length > 0 && (
                                                <button onClick={() => setShowBulkDeleteConfirm(true)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">Delete All ({selectedTxIds.length})</button>
                                            )}
                                            <button onClick={handleCancelSelect} className="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors">Cancel</button>
                                        </>
                                    ) : (
                                        <button onClick={() => setIsSelecting(true)} className="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors">Select</button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {showBulkDeleteConfirm && (
                            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-4">
                                <p className="text-white font-semibold mb-3">Are you sure you want to delete {selectedTxIds.length} transaction{selectedTxIds.length !== 1 ? 's' : ''}? This cannot be undone.</p>
                                <div className="flex gap-3">
                                    <button onClick={handleBulkDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">Yes</button>
                                    <button onClick={() => setShowBulkDeleteConfirm(false)} className="flex-1 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors">No</button>
                                </div>
                            </div>
                        )}
                         <div className="divide-y divide-border-color">
                            {paginatedTransactions.map(tx => <TransactionItem key={tx.id} tx={tx} onEdit={handleOpenTxModal} isSelecting={isSelecting} isSelected={selectedTxIds.includes(tx.id)} onToggleSelect={handleToggleSelect} />)}
                        </div>
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-color">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">Per page:</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => setPerPage(Number(e.target.value))}
                                    className="bg-gray-800 text-white text-sm rounded-md px-3 py-1 border border-gray-600 focus:border-primary outline-none"
                                >
                                    <option value={12}>12</option>
                                    <option value={24}>24</option>
                                    <option value={48}>48</option>
                                    <option value={96}>96</option>
                                </select>
                                <span className="text-sm text-gray-400">
                                    Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm rounded-md bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm rounded-md bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                         <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg w-min mb-4 mx-auto">
                            <button onClick={() => setChartView('expense')} className={`px-4 py-1.5 text-xs rounded-md ${chartView === 'expense' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Expenses</button>
                            <button onClick={() => setChartView('income')} className={`px-4 py-1.5 text-xs rounded-md ${chartView === 'income' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Income</button>
                        </div>
                        {chartView === 'expense' ? (
                            <BudgetDoughnut value={totalExpenses} total={budgets.expense} label="Total Expenses" color="#26c45d" />
                        ) : (
                             <BudgetDoughnut value={totalIncome} total={budgets.income} label="Total Income" color="#3b82f6" />
                        )}
                    </Card>
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                             <h2 className="text-xl font-bold">Budgets</h2>
                             <button onClick={() => setIsBudgetModalOpen(true)} className="text-gray-400 hover:text-white"><PencilIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Expense Budget</span>
                                <span className="font-bold text-white">{formatCurrency(budgets.expense)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="font-semibold">Income Goal</span>
                                <span className="font-bold text-white">{formatCurrency(budgets.income)}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
        </>
    );
};

export default Transactions;
