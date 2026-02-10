import React, { useState, useMemo, useRef } from 'react';
import { Asset, Debt, Transaction, MarketData } from '../types';
import { CloseIcon } from './icons';
import { format } from 'date-fns';
import { useCurrency } from '../App';
import { holdingsService } from '../services/database';

interface AccountDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: Asset | Debt;
    accountType: 'asset' | 'debt';
    transactions: Transaction[];
    marketData?: MarketData;
    onUpdateTransactions?: (transactions: Transaction[]) => void;
}

const AccountDetailModal: React.FC<AccountDetailModalProps> = ({ isOpen, onClose, account, accountType, transactions, marketData = {}, onUpdateTransactions }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'transactions' | 'assets'>('transactions');
    const [perPage, setPerPage] = useState(10);
    const [editingHoldingTicker, setEditingHoldingTicker] = useState<string | null>(null);
    const [holdingIconUrl, setHoldingIconUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { formatCurrency } = useCurrency();

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setHoldingIconUrl(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const isInvestingAccount = accountType === 'asset' && 'holdings' in account && account.type === 'Investing';

    const accountTransactions = useMemo(() => {
        return transactions
            .filter(t => t.accountId === account.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, account.id]);

    const totalPages = Math.ceil(accountTransactions.length / perPage);
    const paginatedTxs = useMemo(() => {
        return accountTransactions.slice((currentPage - 1) * perPage, currentPage * perPage);
    }, [accountTransactions, currentPage, perPage]);

    const metrics = useMemo(() => {
        const totalIncome = accountTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = accountTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const netChange = accountType === 'asset'
            ? totalIncome - totalExpenses
            : totalExpenses - totalIncome;

        return { totalIncome, totalExpenses, netChange };
    }, [accountTransactions, accountType]);

    if (!isOpen) return null;

    const asset = account as Asset;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-6xl border border-border-color max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-border-color">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{account.name}</h2>
                        <p className="text-sm text-gray-400 mt-1">{account.type} Account</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {isInvestingAccount && (
                    <div className="flex gap-2 px-6 pt-4">
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                activeTab === 'transactions'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            Transactions
                        </button>
                        <button
                            onClick={() => setActiveTab('assets')}
                            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                activeTab === 'assets'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            Assets
                        </button>
                    </div>
                )}

                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 ${perPage > 10 ? 'overflow-y-auto max-h-[calc(90vh-180px)]' : ''}`}>
                    <div className="lg:col-span-2">
                        {isInvestingAccount && activeTab === 'assets' ? (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-white">Holdings</h3>
                                    <span className="text-sm text-gray-400">{asset.holdings?.length || 0} assets</span>
                                </div>

                                {asset.holdings && asset.holdings.length > 0 ? (
                                    <div className="space-y-3">
                                        {asset.holdings.map(holding => {
                                            const currentPrice = holding.currentPrice || marketData[holding.ticker]?.price || holding.avgCost;
                                            const currentValue = currentPrice * holding.shares;
                                            const totalCost = holding.avgCost * holding.shares;
                                            const profitLoss = currentValue - totalCost;
                                            const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

                                            return (
                                                <div key={holding.ticker} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-start gap-3">
                                                            {holding.icon && (
                                                                <img src={holding.icon} alt={holding.name} className="w-10 h-10 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                            )}
                                                            <div>
                                                                <h4 className="text-white font-bold text-lg">{holding.name}</h4>
                                                                <p className="text-gray-400 text-sm">{holding.ticker} • {holding.type}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex items-start gap-3">
                                                            <div>
                                                                <p className="text-white font-bold text-lg">{formatCurrency(currentValue)}</p>
                                                                <p className="text-gray-400 text-xs">Current Value</p>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingHoldingTicker(holding.ticker);
                                                                    setHoldingIconUrl('');
                                                                }}
                                                                className="mt-1 p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                                                                title="Edit icon"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-600">
                                                        <div>
                                                            <p className="text-gray-400 text-xs mb-1">Shares Held</p>
                                                            <p className="text-white font-semibold">{holding.shares.toFixed(4)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-400 text-xs mb-1">Avg. Cost</p>
                                                            <p className="text-white font-semibold">{formatCurrency(holding.avgCost)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-400 text-xs mb-1">P/L</p>
                                                            <p className={`font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                                                                <span className="text-xs ml-1">({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-700/30 rounded-lg">
                                        <p className="text-gray-400">No holdings in this account</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-white">Transaction History</h3>
                                    <span className="text-sm text-gray-400">{accountTransactions.length} total</span>
                                </div>

                                {paginatedTxs.length > 0 ? (
                                    <div className="space-y-2">
                                        {paginatedTxs.map(tx => (
                                            <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-600">
                                                        <img src={tx.logo} alt={tx.merchant} className="w-6 h-6 rounded-md" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{tx.merchant}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {tx.category} • {format(new Date(tx.date), 'MMM dd, yyyy HH:mm')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className={`font-bold text-lg ${tx.type === 'income' ? 'text-primary' : 'text-white'}`}>
                                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount).replace(/[+-]/g, '')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-700/30 rounded-lg">
                                        <p className="text-gray-400">No transactions for this account</p>
                                    </div>
                                )}

                                {accountTransactions.length > 0 && (
                                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-color">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm text-gray-400">Per page:</label>
                                                <select
                                                    value={perPage}
                                                    onChange={(e) => {
                                                        setPerPage(Number(e.target.value));
                                                        setCurrentPage(1);
                                                    }}
                                                    className="bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600 focus:border-primary outline-none"
                                                >
                                                    <option value={10}>10</option>
                                                    <option value={25}>25</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                            </div>
                                            <span className="text-sm text-gray-400">
                                                Showing {Math.min((currentPage - 1) * perPage + 1, accountTransactions.length)}-{Math.min(currentPage * perPage, accountTransactions.length)} of {accountTransactions.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-4 py-1 text-sm rounded bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-sm text-gray-400">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="px-4 py-1 text-sm rounded bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Account Summary</h3>
                        <div className="space-y-4">
                            <div className="p-5 bg-gray-700/50 rounded-lg border border-gray-600">
                                <p className="text-gray-400 text-sm mb-1">Current Balance</p>
                                <p className={`text-3xl font-bold ${accountType === 'debt' ? 'text-red-300' : 'text-white'}`}>{formatCurrency(account.balance)}</p>
                            </div>

                            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                                <p className="text-gray-400 text-sm mb-1">{accountType === 'debt' ? 'Total Payments' : 'Total Income'}</p>
                                <p className="text-2xl font-bold text-green-400">+{formatCurrency(metrics.totalIncome).replace(/[+-]/g, '')}</p>
                                <p className="text-xs text-gray-500 mt-1">{accountTransactions.filter(t => t.type === 'income').length} transactions</p>
                            </div>

                            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                                <p className="text-gray-400 text-sm mb-1">Total Expenses</p>
                                <p className="text-2xl font-bold text-red-400">-{formatCurrency(metrics.totalExpenses).replace(/[+-]/g, '')}</p>
                                <p className="text-xs text-gray-500 mt-1">{accountTransactions.filter(t => t.type === 'expense').length} transactions</p>
                            </div>

                            {accountType === 'asset' && (
                                <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                                    <p className="text-gray-400 text-sm mb-1">Net Change</p>
                                    <p className={`text-2xl font-bold ${metrics.netChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {metrics.netChange >= 0 ? '+' : ''}{formatCurrency(metrics.netChange)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Income minus expenses</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {editingHoldingTicker && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={() => setEditingHoldingTicker(null)}>
                    <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-md border border-border-color" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-border-color">
                            <h2 className="text-xl font-bold text-white">Edit Holding Icon</h2>
                            <button onClick={() => setEditingHoldingTicker(null)} className="text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Icon URL for {editingHoldingTicker}</label>
                                <input
                                    type="text"
                                    value={holdingIconUrl}
                                    onChange={(e) => setHoldingIconUrl(e.target.value)}
                                    placeholder="e.g., https://logo.clearbit.com/apple.com"
                                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Or Upload Image</label>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-3 px-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-300 hover:border-primary hover:text-primary transition-colors font-medium"
                                >
                                    Upload Image
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>
                            {holdingIconUrl && (
                                <div className="mt-4 flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                                    <img src={holdingIconUrl} alt="preview" className="w-12 h-12 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    <span className="text-sm text-gray-300">Preview</span>
                                    <button
                                        type="button"
                                        onClick={() => setHoldingIconUrl('')}
                                        className="ml-auto text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setEditingHoldingTicker(null)}
                                    className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (holdingIconUrl && editingHoldingTicker) {
                                            const matchingHolding = asset.holdings?.find(h => h.ticker === editingHoldingTicker);
                                            if (matchingHolding) {
                                                try {
                                                    await holdingsService.updateHolding(matchingHolding.id, { icon: holdingIconUrl });
                                                } catch (error) {
                                                    console.error('Failed to save icon for holding:', error);
                                                }
                                            }
                                        }
                                        setEditingHoldingTicker(null);
                                        setHoldingIconUrl('');
                                    }}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors"
                                    disabled={!holdingIconUrl}
                                >
                                    Save Icon
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountDetailModal;
