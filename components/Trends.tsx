import React, { useMemo } from 'react';
import Card from './Card';
import { IncomeExpenseChart, NetWorthChart } from './charts';
import { mockNetWorthData } from '../data/mockData';
import { Asset, Debt } from '../types';
import { useCurrency } from '../App';

interface TrendsProps {
    assets: Asset[];
    debts: Debt[];
}

const Trends: React.FC<TrendsProps> = ({ assets, debts }) => {
    const totalAssets = useMemo(() => assets.filter(a => a.status === 'Active').reduce((sum, acc) => sum + acc.balance, 0), [assets]);
    const totalDebts = useMemo(() => debts.filter(d => d.status === 'Active').reduce((sum, acc) => sum + acc.balance, 0), [debts]);
    const netWorth = useMemo(() => totalAssets - totalDebts, [totalAssets, totalDebts]);
    const { formatCurrency } = useCurrency();

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white">Trends</h1>
            
             <Card>
                <h2 className="text-xl font-bold text-white mb-4">Net Worth Over Time</h2>
                <div className="h-80">
                   <NetWorthChart data={mockNetWorthData} />
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <Card>
                        <h2 className="text-xl font-bold text-white mb-4">Income vs Expenses</h2>
                        <div className="h-80">
                            <IncomeExpenseChart />
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <h2 className="text-xl font-bold text-white mb-4">Category Analysis</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 rounded-sm mr-3 bg-primary"></div>
                                    <span className="text-white">Shopping</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-semibold">{formatCurrency(2340)}</p>
                                    <p className="text-xs text-primary">+12% vs last month</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 bg-blue-500 rounded-sm mr-3"></div>
                                    <span className="text-white">Food & Dining</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-semibold">{formatCurrency(1890)}</p>
                                    <p className="text-xs text-red-400">-5% vs last month</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 bg-purple-500 rounded-sm mr-3"></div>
                                    <span className="text-white">Entertainment</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-semibold">{formatCurrency(567)}</p>
                                    <p className="text-xs text-gray-400">±0% vs last month</p>
                                </div>
                            </div>
                             <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 bg-indigo-500 rounded-sm mr-3"></div>
                                    <span className="text-white">Utilities</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-white font-semibold">{formatCurrency(312)}</p>
                                    <p className="text-xs text-primary">+2% vs last month</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Trends;
