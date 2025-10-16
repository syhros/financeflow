import React, { useState, useMemo } from 'react';
import { Asset, Debt, Transaction } from '../types';
import { CloseIcon } from './icons';
import { format } from 'date-fns';
import { useCurrency } from '../App';

interface AccountDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: Asset | Debt;
    accountType: 'asset' | 'debt';
    transactions: Transaction[];
}

const AccountDetailModal: React.FC<AccountDetailModalProps> = ({ isOpen, onClose, account, accountType, transactions }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 12;
    const { formatCurrency } = useCurrency();

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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="lg:col-span-2">
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

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-6">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                                >
                                    Previous
                                </button>
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-3 py-2 rounded-lg transition-colors ${
                                                    pageNum === currentPage
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                                >
                                    Next
                                </button>
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
        </div>
    );
};

export default AccountDetailModal;
