import React, { useState, useMemo, useRef } from 'react';
import { Asset, Debt, Transaction, MarketData } from '../types';
import { CloseIcon } from './icons';
import { format } from 'date-fns';
import { useCurrency } from '../App';
import { calculateHoldingMetrics } from '../utils/investmentUtils';
import { getMarketPriceForTicker } from '../utils/marketDataHelpers';

interface AccountDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: Asset | Debt;
    accountType: 'asset' | 'debt';
    transactions: Transaction[];
    marketData?: MarketData;
    onUpdateTransactions?: (transactions: Transaction[]) => void;
    onUpdateHolding?: (accountId: string, ticker: string, updates: { icon?: string; isLondonListed?: boolean; isPennyStock?: boolean }) => Promise<void>;
}

const AccountDetailModal: React.FC<AccountDetailModalProps> = ({ isOpen, onClose, account, accountType, transactions, marketData = {}, onUpdateTransactions, onUpdateHolding }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'transactions' | 'assets'>('transactions');
    const [perPage, setPerPage] = useState(10);
    const [holdingsPerPage, setHoldingsPerPage] = useState(10);
    const [holdingsPage, setHoldingsPage] = useState(1);
    const [showZeroHoldings, setShowZeroHoldings] = useState(false);
    const [editingHoldingTicker, setEditingHoldingTicker] = useState<string | null>(null);
    const [holdingIconUrl, setHoldingIconUrl] = useState('');
    const [editingLondonListed, setEditingLondonListed] = useState(false);
    const [editingPennyStock, setEditingPennyStock] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [holdingOverrides, setHoldingOverrides] = useState<Record<string, { isPennyStock?: boolean; isLondonListed?: boolean }>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { formatCurrency } = useCurrency();

    const getEffectiveHolding = (holding: any) => {
        const overrides = holdingOverrides[holding.ticker];
        if (!overrides) return holding;
        return {
            ...holding,
            ...overrides
        };
    };

    const handleClose = () => {
        setHoldingOverrides({});
        setEditingHoldingTicker(null);
        onClose();
    };

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

    const openEditModal = (ticker: string) => {
        const holding = (account as Asset).holdings?.find(h => h.ticker === ticker);
        setEditingHoldingTicker(ticker);
        setHoldingIconUrl('');
        setEditingLondonListed(holding?.isLondonListed || false);
        setEditingPennyStock(holding?.isPennyStock || false);
        setSaveMessage(null);
    };

    const handlePennyStockToggle = (checked: boolean) => {
        setEditingPennyStock(checked);
        if (editingHoldingTicker) {
            setHoldingOverrides(prev => ({
                ...prev,
                [editingHoldingTicker]: {
                    ...prev[editingHoldingTicker],
                    isPennyStock: checked,
                }
            }));
        }
    };

    const handleLondonListedToggle = (checked: boolean) => {
        setEditingLondonListed(checked);
        if (editingHoldingTicker) {
            setHoldingOverrides(prev => ({
                ...prev,
                [editingHoldingTicker]: {
                    ...prev[editingHoldingTicker],
                    isLondonListed: checked,
                }
            }));
        }
    };

    const handleSave = async () => {
        if (!editingHoldingTicker || !onUpdateHolding) return;

        const updates: { icon?: string; isLondonListed?: boolean; isPennyStock?: boolean } = {};
        const holding = (account as Asset).holdings?.find(h => h.ticker === editingHoldingTicker);
        if (!holding) return;

        if (holdingIconUrl) updates.icon = holdingIconUrl;
        updates.isLondonListed = editingLondonListed;
        updates.isPennyStock = editingPennyStock;

        setIsSaving(true);
        try {
            await onUpdateHolding(account.id, editingHoldingTicker, updates);
            setSaveMessage({ type: 'success', text: 'Saved successfully!' });
            setTimeout(() => {
                setSaveMessage(null);
                setEditingHoldingTicker(null);
                setHoldingIconUrl('');
                setHoldingOverrides(prev => {
                    const newOverrides = { ...prev };
                    delete newOverrides[editingHoldingTicker];
                    return newOverrides;
                });
            }, 1500);
        } catch (error) {
            console.error('Failed to save holding:', error);
            setSaveMessage({ type: 'error', text: 'Failed to save. Please try again.' });
            setTimeout(() => setSaveMessage(null), 3000);
        } finally {
            setIsSaving(false);
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
        let totalIncome = 0;
        const totalExpenses = accountTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        if (isInvestingAccount && 'holdings' in account && account.holdings) {
            account.holdings.forEach(holding => {
                const effectiveHolding = getEffectiveHolding(holding);
                const holdingMetrics = calculateHoldingMetrics(
                    effectiveHolding,
                    getMarketPriceForTicker(effectiveHolding.ticker, effectiveHolding.isLondonListed || false, effectiveHolding.isPennyStock || false, marketData),
                    effectiveHolding.ticker,
                    accountTransactions
                );
                totalIncome += holdingMetrics.totalPL;
            });
        } else {
            totalIncome = accountTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
        }

        const netChange = accountType === 'asset'
            ? totalIncome - totalExpenses
            : totalExpenses - totalIncome;

        return { totalIncome, totalExpenses, netChange };
    }, [accountTransactions, accountType, isInvestingAccount, account, marketData]);

    if (!isOpen) return null;

    const asset = account as Asset;

    const activeHoldings = useMemo(() => {
        if (!asset.holdings) return [];
        return asset.holdings
            .filter(h => h.shares > 0.1)
            .sort((a, b) => {
                const aEffective = getEffectiveHolding(a);
                const bEffective = getEffectiveHolding(b);
                const aValue = (getMarketPriceForTicker(aEffective.ticker, aEffective.isLondonListed || false, aEffective.isPennyStock || false, marketData) || aEffective.currentPrice || aEffective.avgCost) * aEffective.shares;
                const bValue = (getMarketPriceForTicker(bEffective.ticker, bEffective.isLondonListed || false, bEffective.isPennyStock || false, marketData) || bEffective.currentPrice || bEffective.avgCost) * bEffective.shares;
                return bValue - aValue;
            });
    }, [asset.holdings, marketData, holdingOverrides]);

    const zeroHoldings = useMemo(() => {
        if (!asset.holdings) return [];
        return asset.holdings.filter(h => h.shares <= 0.1);
    }, [asset.holdings]);

    const totalActivePages = Math.ceil(activeHoldings.length / holdingsPerPage);
    const paginatedActiveHoldings = useMemo(() => {
        return activeHoldings.slice((holdingsPage - 1) * holdingsPerPage, holdingsPage * holdingsPerPage);
    }, [activeHoldings, holdingsPage, holdingsPerPage]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-6xl border border-border-color max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-border-color">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{account.name}</h2>
                        <p className="text-sm text-gray-400 mt-1">{account.type} Account</p>
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="lg:col-span-2">
                        {isInvestingAccount && activeTab === 'assets' ? (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-white">Holdings</h3>
                                    <span className="text-sm text-gray-400">{activeHoldings.length} active {zeroHoldings.length > 0 ? `+ ${zeroHoldings.length} closed` : ''}</span>
                                </div>

                                {paginatedActiveHoldings.length > 0 ? (
                                    <div className="space-y-3 max-h-[calc(90vh-400px)] overflow-y-auto pr-2">
                                        {paginatedActiveHoldings.map(holding => {
                                            const effectiveHolding = getEffectiveHolding(holding);
                                            const marketPrice = getMarketPriceForTicker(effectiveHolding.ticker, effectiveHolding.isLondonListed || false, effectiveHolding.isPennyStock || false, marketData);
                                            const holdingMetrics = calculateHoldingMetrics(
                                              effectiveHolding,
                                              marketPrice,
                                              effectiveHolding.ticker,
                                              accountTransactions
                                            );
                                            const currentValue = holdingMetrics.currentPrice * effectiveHolding.shares;

                                            return (
                                                <div key={effectiveHolding.ticker} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-start gap-3">
                                                            {effectiveHolding.icon && (
                                                                <img src={effectiveHolding.icon} alt={effectiveHolding.name} className="w-10 h-10 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                            )}
                                                            <div>
                                                                <h4 className="text-white font-bold text-lg">{effectiveHolding.name}</h4>
                                                                <p className="text-gray-400 text-sm">
                                                                    {effectiveHolding.ticker}{effectiveHolding.isLondonListed && <span className="text-yellow-400">.L</span>} • {effectiveHolding.type}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex items-start gap-3">
                                                            <div>
                                                                <p className="text-white font-bold text-lg">{formatCurrency(currentValue)}</p>
                                                                <p className="text-gray-400 text-xs">Current Value</p>
                                                            </div>
                                                            <button
                                                                onClick={() => openEditModal(effectiveHolding.ticker)}
                                                                className="mt-1 p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                                                                title="Edit holding"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-4 pt-3 border-t border-gray-600">
                                                        <div>
                                                            <p className="text-gray-400 text-xs mb-1">Shares Held</p>
                                                            <p className="text-white font-semibold">{effectiveHolding.shares.toFixed(4)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-400 text-xs mb-1">Avg. Cost</p>
                                                            <p className="text-white font-semibold">{formatCurrency(effectiveHolding.avgCost)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-400 text-xs mb-1">Current Price</p>
                                                            <p className="text-white font-semibold">
                                                              {formatCurrency(holdingMetrics.currentPrice)}
                                                              {holdingMetrics.isEstimated && <span className="text-xs text-yellow-400 ml-1">(est.)</span>}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-400 text-xs mb-1">Total P/L</p>
                                                            <p className={`font-bold text-sm ${holdingMetrics.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                {holdingMetrics.totalPL >= 0 ? '+' : ''}{formatCurrency(holdingMetrics.totalPL)}
                                                                <span className="text-xs ml-1">({holdingMetrics.totalPLPercent >= 0 ? '+' : ''}{holdingMetrics.totalPLPercent.toFixed(2)}%)</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-700/30 rounded-lg">
                                        <p className="text-gray-400">No active holdings in this account</p>
                                    </div>
                                )}

                                {activeHoldings.length > holdingsPerPage && (
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-border-color">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-gray-400">Per page:</label>
                                            <select
                                                value={holdingsPerPage}
                                                onChange={(e) => {
                                                    setHoldingsPerPage(Number(e.target.value));
                                                    setHoldingsPage(1);
                                                }}
                                                className="bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600 focus:border-primary outline-none"
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setHoldingsPage(p => Math.max(1, p - 1))}
                                                disabled={holdingsPage === 1}
                                                className="px-3 py-1 text-sm rounded bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                ←
                                            </button>
                                            <span className="text-sm text-gray-400">
                                                Page {holdingsPage} of {totalActivePages}
                                            </span>
                                            <button
                                                onClick={() => setHoldingsPage(p => Math.min(totalActivePages, p + 1))}
                                                disabled={holdingsPage === totalActivePages}
                                                className="px-3 py-1 text-sm rounded bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                →
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {zeroHoldings.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-border-color">
                                        <button
                                            onClick={() => setShowZeroHoldings(!showZeroHoldings)}
                                            className="flex items-center gap-2 text-white font-semibold hover:text-gray-300 transition-colors"
                                        >
                                            <svg className={`w-4 h-4 transition-transform ${showZeroHoldings ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                            Closed Positions ({zeroHoldings.length})
                                        </button>
                                        {showZeroHoldings && (
                                            <div className="mt-3 space-y-2">
                                                {zeroHoldings.map(holding => {
                                                    const effectiveHolding = getEffectiveHolding(holding);
                                                    const marketPrice = getMarketPriceForTicker(effectiveHolding.ticker, effectiveHolding.isLondonListed || false, effectiveHolding.isPennyStock || false, marketData);
                                                    const holdingMetrics = calculateHoldingMetrics(
                                                      effectiveHolding,
                                                      marketPrice,
                                                      effectiveHolding.ticker,
                                                      accountTransactions
                                                    );
                                                    const currentValue = holdingMetrics.currentPrice * effectiveHolding.shares;

                                                    return (
                                                        <div key={holding.ticker} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div className="flex-1">
                                                                    <h4 className="text-white font-semibold text-sm">{effectiveHolding.name}</h4>
                                                                    <p className="text-gray-400 text-xs">
                                                                        {effectiveHolding.ticker}{effectiveHolding.isLondonListed && <span className="text-yellow-400">.L</span>} • {effectiveHolding.shares.toFixed(4)} shares • {formatCurrency(currentValue)}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className={`text-sm font-semibold ${holdingMetrics.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                        {holdingMetrics.totalPL >= 0 ? '+' : ''}{formatCurrency(holdingMetrics.totalPL)}
                                                                    </p>
                                                                    <button
                                                                        onClick={() => openEditModal(effectiveHolding.ticker)}
                                                                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                                                                        title="Edit holding"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
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

                            <div className={`p-4 rounded-lg border ${metrics.totalIncome >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                <p className="text-gray-400 text-sm mb-1">{accountType === 'debt' ? 'Total Payments' : isInvestingAccount ? 'Total P/L' : 'Total Income'}</p>
                                <p className={`text-2xl font-bold ${metrics.totalIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {metrics.totalIncome >= 0 ? '+' : ''}{formatCurrency(metrics.totalIncome).replace(/^[+-]/, '')}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{isInvestingAccount ? 'All holdings' : accountTransactions.filter(t => t.type === 'income').length + ' transactions'}</p>
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
                            <h2 className="text-xl font-bold text-white">Edit Holding</h2>
                            <button onClick={() => setEditingHoldingTicker(null)} className="text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                                <p className="text-sm text-gray-400 mb-1">Ticker</p>
                                <p className="text-white font-bold text-lg">{editingHoldingTicker}</p>
                            </div>

                            <div>
                                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editingLondonListed}
                                        onChange={(e) => handleLondonListedToggle(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-500 text-blue-500 focus:ring-blue-500 flex-shrink-0"
                                    />
                                    <div className="flex-1">
                                        <p className="text-white font-medium">London Stock Exchange (.L)</p>
                                        <p className="text-xs text-gray-400">Append .L suffix when fetching market data (e.g. VUSA.L)</p>
                                    </div>
                                </label>
                            </div>

                            <div>
                                <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editingPennyStock}
                                        onChange={(e) => handlePennyStockToggle(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-500 text-blue-500 focus:ring-blue-500 flex-shrink-0"
                                    />
                                    <div className="flex-1">
                                        <p className="text-white font-medium">Penny Stock</p>
                                        <p className="text-xs text-gray-400">Stock traded in pence (e.g. Shell RDBS.L, Evraz EVR.L). Prices divided by 100 for GBP conversion.</p>
                                    </div>
                                </label>
                            </div>

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
                            {saveMessage && (
                                <div className={`mt-3 p-3 rounded-lg text-sm font-medium ${
                                    saveMessage.type === 'success'
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                        : 'bg-red-500/20 text-red-400 border border-red-500/50'
                                }`}>
                                    {saveMessage.text}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        if (editingHoldingTicker) {
                                            setHoldingOverrides(prev => {
                                                const newOverrides = { ...prev };
                                                delete newOverrides[editingHoldingTicker];
                                                return newOverrides;
                                            });
                                        }
                                        setEditingHoldingTicker(null);
                                    }}
                                    className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
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
