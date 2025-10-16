import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart, Line } from 'recharts';
import { useCurrency } from '../App';

interface BalanceChartProps {
    data: { name: string; value: number }[];
    chartColor: string;
}

export const BalanceChart: React.FC<BalanceChartProps> = ({ data, chartColor }) => {
    const { formatCurrency } = useCurrency();
    const gradientId = `color-${chartColor.replace('#', '')}`;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} dy={10} interval={0} />
                <YAxis hide={true} domain={['dataMin - 1000', 'dataMax + 1000']} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#101010', border: '1px solid #2D2D2D', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#9ca3af' }}
                    itemStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
                    formatter={(value: number) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} fillOpacity={1} fill={`url(#${gradientId})`} />
            </AreaChart>
        </ResponsiveContainer>
    );
}
interface NetWorthChartProps {
    data: { name: string; value: number }[];
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ data }) => {
    const { currency } = useCurrency();
    const tickFormatter = (value: number) => {
        const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';
        return `${symbol}${(value / 1000).toFixed(0)}k`;
    };
    const tooltipFormatter = (value: number) => {
        const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';
        return `${symbol}${value.toLocaleString()}`;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="netWorthColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={tickFormatter} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#101010', border: '1px solid #2D2D2D', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#9ca3af' }}
                    itemStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
                    formatter={tooltipFormatter}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#netWorthColor)" />
            </AreaChart>
        </ResponsiveContainer>
    );
};

interface BudgetDoughnutProps {
    value: number;
    total: number;
    label: string;
    color: string;
}

export const BudgetDoughnut: React.FC<BudgetDoughnutProps> = ({ value, total, label, color }) => {
    const { formatCurrency } = useCurrency();
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const data = [
        { name: 'Spent', value: value },
        { name: 'Remaining', value: Math.max(0, total - value) },
    ];
    
    return (
        <div className="relative w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={[{ value: 100 }]}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius="80%"
                        outerRadius="100%"
                        fill="#374151"
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={0}
                        isAnimationActive={false}
                    />
                    <Pie
                        data={data}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius="80%"
                        outerRadius="100%"
                        fill={color}
                        startAngle={90}
                        endAngle={90 - (percentage * 3.6)}
                        stroke="none"
                        cornerRadius={10}
                    >
                         <Cell fill={color} />
                         <Cell fill="transparent" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-4xl font-bold text-white mt-1">{formatCurrency(value)}</p>
                <p className="text-xs text-gray-500 mt-1">Out of {formatCurrency(total)} Budget</p>
            </div>
        </div>
    );
};

const incomeExpenseData = [
  { name: 'Jul', income: 4000, expenses: 2400 },
  { name: 'Aug', income: 3000, expenses: 1398 },
  { name: 'Sep', income: 2000, expenses: 9800 },
  { name: 'Oct', income: 2780, expenses: 3908 },
  { name: 'Nov', income: 1890, expenses: 4800 },
  { name: 'Dec', income: 2390, expenses: 3800 },
];

export const IncomeExpenseChart: React.FC = () => {
    const { currency } = useCurrency();
    const tickFormatter = (value: number) => {
        const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';
        return `${symbol}${(value / 1000).toFixed(0)}k`;
    };
    const tooltipFormatter = (value: number) => {
        const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';
        return `${symbol}${value.toLocaleString()}`;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={incomeExpenseData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#26c45d" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#26c45d" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} dy={10}/>
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={tickFormatter}/>
                <Tooltip
                    contentStyle={{ backgroundColor: '#101010', border: '1px solid #2D2D2D', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#9ca3af' }}
                    itemStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
                    formatter={tooltipFormatter}
                />
                <Legend wrapperStyle={{fontSize: "14px", paddingTop: "20px"}}/>
                <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#26c45d"
                    strokeWidth={2}
                    name="Income"
                    fillOpacity={1}
                    fill="url(#incomeGradient)"
                />
                <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#6366f1"
                    strokeWidth={2}
                    name="Expenses"
                    fillOpacity={1}
                    fill="url(#expenseGradient)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}