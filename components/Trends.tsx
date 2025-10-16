import React, { useMemo, useState } from 'react';
import Card from './Card';
import { IncomeExpenseChart, NetWorthChart } from './charts';
import { dynamicNetWorthData, dynamicIncomeExpenseData, generateIncomeExpenseData, generateNetWorthData } from '../data/mockData';
import { Asset, Debt, Transaction } from '../types';
import { useCurrency } from '../App';

interface TrendsProps {
    assets: Asset[];
    debts: Debt[];
    transactions: Transaction[];
}

interface CategoryData {
    name: string;
    current: number;
    previous: number;
    change: number;
    color: string;
}

const Trends: React.FC<TrendsProps> = ({ assets, debts, transactions }) => {
    const [netWorthFilter, setNetWorthFilter] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [incomeExpenseFilter, setIncomeExpenseFilter] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const totalAssets = useMemo(() => assets.filter(a => a.status === 'Active').reduce((sum, acc) => sum + acc.balance, 0), [assets]);
    const totalDebts = useMemo(() => debts.filter(d => d.status === 'Active').reduce((sum, acc) => sum + acc.balance, 0), [debts]);
    const netWorth = useMemo(() => totalAssets - totalDebts, [totalAssets, totalDebts]);
    const { formatCurrency } = useCurrency();

    // Generate dynamic chart data from transactions with filtering
    const incomeExpenseData = useMemo(() => generateIncomeExpenseData(transactions, incomeExpenseFilter), [transactions, incomeExpenseFilter]);
    const netWorthData = useMemo(() => generateNetWorthData(transactions, netWorthFilter), [transactions, netWorthFilter]);

    // Generate category analysis based on income/expense filter
    const categoryAnalysis = useMemo((): CategoryData[] => {
        const now = new Date();
        const categories: {[key: string]: {current: number, previous: number}} = {};

        let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

        if (incomeExpenseFilter === 'weekly') {
            currentEnd = now;
            currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            previousEnd = new Date(currentStart.getTime() - 1);
            previousStart = new Date(previousEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (incomeExpenseFilter === 'monthly') {
            currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
            currentEnd = now;
            previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            previousEnd = new Date(currentStart.getTime() - 1);
        } else {
            currentStart = new Date(now.getFullYear(), 0, 1);
            currentEnd = now;
            previousStart = new Date(now.getFullYear() - 1, 0, 1);
            previousEnd = new Date(now.getFullYear() - 1, 11, 31);
        }

        transactions.forEach(tx => {
            if (tx.type !== 'expense' || !tx.category) return;
            const txDate = new Date(tx.date);

            if (!categories[tx.category]) {
                categories[tx.category] = {current: 0, previous: 0};
            }

            if (txDate >= currentStart && txDate <= currentEnd) {
                categories[tx.category].current += tx.amount;
            } else if (txDate >= previousStart && txDate <= previousEnd) {
                categories[tx.category].previous += tx.amount;
            }
        });

        const colors = ['bg-primary', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500'];

        return Object.entries(categories)
            .map(([name, data], index) => ({
                name,
                current: Math.round(data.current),
                previous: Math.round(data.previous),
                change: data.previous > 0
                    ? Math.round(((data.current - data.previous) / data.previous) * 100)
                    : 0,
                color: colors[index % colors.length]
            }))
            .sort((a, b) => b.current - a.current)
            .slice(0, 6);
    }, [transactions, incomeExpenseFilter]);

    const periodLabel = incomeExpenseFilter === 'weekly' ? 'week' : incomeExpenseFilter === 'monthly' ? 'month' : 'year';

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white">Trends</h1>

             <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Net Worth Over Time</h2>
                    <div className="flex space-x-2 bg-gray-900 p-1 rounded-lg">
                        <button onClick={() => setNetWorthFilter('weekly')} className={`px-4 py-2 text-sm rounded-md transition-colors ${netWorthFilter === 'weekly' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Weekly</button>
                        <button onClick={() => setNetWorthFilter('monthly')} className={`px-4 py-2 text-sm rounded-md transition-colors ${netWorthFilter === 'monthly' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Monthly</button>
                        <button onClick={() => setNetWorthFilter('yearly')} className={`px-4 py-2 text-sm rounded-md transition-colors ${netWorthFilter === 'yearly' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Yearly</button>
                    </div>
                </div>
                <div className="h-80">
                   <NetWorthChart data={netWorthData} />
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Income vs Expenses</h2>
                            <div className="flex space-x-2 bg-gray-900 p-1 rounded-lg">
                                <button onClick={() => setIncomeExpenseFilter('weekly')} className={`px-4 py-2 text-sm rounded-md transition-colors ${incomeExpenseFilter === 'weekly' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Weekly</button>
                                <button onClick={() => setIncomeExpenseFilter('monthly')} className={`px-4 py-2 text-sm rounded-md transition-colors ${incomeExpenseFilter === 'monthly' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Monthly</button>
                                <button onClick={() => setIncomeExpenseFilter('yearly')} className={`px-4 py-2 text-sm rounded-md transition-colors ${incomeExpenseFilter === 'yearly' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Yearly</button>
                            </div>
                        </div>
                        <div className="h-80">
                            <IncomeExpenseChart data={incomeExpenseData} />
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <h2 className="text-xl font-bold text-white mb-2">Category Analysis</h2>
                        <p className="text-sm text-gray-400 mb-4">Top spending categories this {periodLabel}</p>
                        {categoryAnalysis.length > 0 ? (
                            <div className="space-y-4">
                                {categoryAnalysis.map((cat, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <div className="flex items-center flex-1">
                                            <div className={`w-4 h-4 rounded-sm mr-3 ${cat.color}`}></div>
                                            <span className="text-white text-sm">{cat.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-semibold">{formatCurrency(cat.current)}</p>
                                            {cat.previous > 0 && (
                                                <p className={`text-xs flex items-center justify-end gap-1 ${cat.change > 0 ? 'text-red-400' : cat.change < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                                    {cat.change > 0 ? '↑' : cat.change < 0 ? '↓' : ''}
                                                    {cat.change !== 0 ? `${Math.abs(cat.change)}%` : '±0%'} vs last {periodLabel}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-400">No expense data for this period</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Trends;
