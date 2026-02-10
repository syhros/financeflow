import { Asset, Debt, Goal, Bill, Transaction, RecurringPayment, Budgets, Holding, Category, TransactionRule, User } from '../types';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';

const today = new Date();

const mondayOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
const weekLabels = Array.from({ length: 7 }, (_, i) => {
    const weekStart = addWeeks(mondayOfThisWeek, i - 6);
    return format(weekStart, 'dd/MM');
});

export const mockUser: User = {
    name: 'User',
    username: 'user',
    email: 'user@example.com',
    avatarUrl: 'https://randomuser.me/api/portraits/lego/1.jpg',
};

export const mockHoldings: Holding[] = [];

export const mockAssets: Asset[] = [];

export const mockDebts: Debt[] = [];

export const mockGoals: Goal[] = [];

export const mockBills: Bill[] = [];

export const mockTransactions: Transaction[] = [];

export const mockRecurringPayments: RecurringPayment[] = [];

export const assetDayData: any[] = [];
export const assetWeekData: any[] = [];
export const assetMonthData: any[] = [];
export const assetYearData: any[] = [];

export const debtDayData: any[] = [];
export const debtWeekData: any[] = [];
export const debtMonthData: any[] = [];
export const debtYearData: any[] = [];

export const mockNetWorthData: any[] = [];

export const mockBudgets: Budgets = {
    income: 0,
    expense: 0
};

export const mockCategories: Category[] = [
    { id: '1', name: 'Shopping', icon: 'ShoppingBagIcon', color: 'bg-blue-500' },
    { id: '2', name: 'Gifts', icon: 'GiftIcon', color: 'bg-pink-500' },
    { id: '3', name: 'Entertainment', icon: 'FilmIcon', color: 'bg-purple-500' },
    { id: '4', name: 'Cloud Storage', icon: 'CloudIcon', color: 'bg-sky-500' },
    { id: '5', name: 'Utilities', icon: 'WrenchScrewdriverIcon', color: 'bg-orange-500' },
    { id: '6', name: 'Salary', icon: 'BanknotesIcon', color: 'bg-green-500' },
    { id: '7', name: 'Housing', icon: 'HomeModernIcon', color: 'bg-yellow-500' },
    { id: '8', name: 'Transport', icon: 'CarIcon', color: 'bg-red-500' },
    { id: '9', name: 'Groceries', icon: 'ShoppingBagIcon', color: 'bg-teal-500' },
    { id: '10', name: 'Subscription', icon: 'RefreshIcon', color: 'bg-indigo-500' },
    { id: '11', name: 'Coffee', icon: 'ShoppingBagIcon', color: 'bg-amber-800' },
    { id: '12', name: 'Food & Dining', icon: 'ShoppingBagIcon', color: 'bg-rose-500' },
];

export const mockRules: TransactionRule[] = [];

export const historicalTransactions: Transaction[] = [];

export const allTransactions: Transaction[] = [];

export const generateIncomeExpenseData = (transactions: Transaction[], timeFilter: 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    const now = new Date();

    if (timeFilter === 'weekly') {
        const weeksData: { name: string, income: number, expenses: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const weekStart = addDays(now, -i * 7);
            const weekEnd = addDays(weekStart, 6);
            const weekLabel = format(weekStart, 'MMM dd');

            let income = 0, expenses = 0;
            transactions.forEach(tx => {
                const txDate = new Date(tx.date);
                if (txDate >= weekStart && txDate <= weekEnd) {
                    if (tx.type === 'income') income += tx.amount;
                    else if (tx.type === 'expense') expenses += tx.amount;
                }
            });
            weeksData.push({ name: weekLabel, income: Math.round(income), expenses: Math.round(expenses) });
        }
        return weeksData;
    } else if (timeFilter === 'yearly') {
        const years = Array.from(new Set(transactions.map(tx => new Date(tx.date).getFullYear()))).sort();
        const yearsData = years.map(year => {
            let income = 0, expenses = 0;
            transactions.forEach(tx => {
                const txDate = new Date(tx.date);
                if (txDate.getFullYear() === year) {
                    if (tx.type === 'income') income += tx.amount;
                    else if (tx.type === 'expense') expenses += tx.amount;
                }
            });
            return { name: year.toString(), income: Math.round(income), expenses: Math.round(expenses) };
        });
        return yearsData;
    } else {
        const monthsData: { month: string, year: number, income: number, expenses: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = format(date, 'MMM');
            monthsData.push({
                month: monthName,
                year: date.getFullYear(),
                income: 0,
                expenses: 0
            });
        }

        transactions.forEach(tx => {
            const txDate = new Date(tx.date);
            const monthName = format(txDate, 'MMM');
            const txYear = txDate.getFullYear();

            const monthEntry = monthsData.find(m => m.month === monthName && m.year === txYear);
            if (monthEntry) {
                if (tx.type === 'income') monthEntry.income += tx.amount;
                else if (tx.type === 'expense') monthEntry.expenses += tx.amount;
            }
        });

        return monthsData.map(data => ({
            name: data.month,
            income: Math.round(data.income),
            expenses: Math.round(data.expenses)
        }));
    }
};

export const generateNetWorthData = (transactions: Transaction[], timeFilter: 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    const now = new Date();
    const baseNetWorth = 0;

    if (timeFilter === 'weekly') {
        const weeksData: { name: string, value: number }[] = [];
        for (let i = 11; i >= 0; i--) {
            const weekEnd = addDays(now, -i * 7);
            const weekLabel = format(weekEnd, 'MMM dd');

            let totalIncome = 0, totalExpenses = 0;
            transactions.forEach(tx => {
                const txDate = new Date(tx.date);
                if (txDate <= weekEnd) {
                    if (tx.type === 'income') totalIncome += tx.amount;
                    else if (tx.type === 'expense') totalExpenses += tx.amount;
                }
            });
            weeksData.push({ name: weekLabel, value: Math.round(baseNetWorth + totalIncome - totalExpenses) });
        }
        return weeksData;
    } else if (timeFilter === 'yearly') {
        const years = Array.from(new Set(transactions.map(tx => new Date(tx.date).getFullYear()))).sort();
        const yearsData = years.map(year => {
            const yearEnd = new Date(year, 11, 31);
            let totalIncome = 0, totalExpenses = 0;
            transactions.forEach(tx => {
                const txDate = new Date(tx.date);
                if (txDate <= yearEnd) {
                    if (tx.type === 'income') totalIncome += tx.amount;
                    else if (tx.type === 'expense') totalExpenses += tx.amount;
                }
            });
            return { name: year.toString(), value: Math.round(baseNetWorth + totalIncome - totalExpenses) };
        });
        return yearsData;
    } else {
        const monthsData: { name: string, value: number }[] = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = format(date, 'MMM');

            let totalIncome = 0, totalExpenses = 0;
            transactions.forEach(tx => {
                const txDate = new Date(tx.date);
                if (txDate <= date) {
                    if (tx.type === 'income') totalIncome += tx.amount;
                    else if (tx.type === 'expense') totalExpenses += tx.amount;
                }
            });

            monthsData.push({ name: monthName, value: Math.round(baseNetWorth + totalIncome - totalExpenses) });
        }
        return monthsData;
    }
};

export const dynamicIncomeExpenseData: any[] = [];
export const dynamicNetWorthData: any[] = [];

export const generateAssetChartData = (transactions: Transaction[], assets: any[], timeFrame: 'day' | 'week' | 'month' | 'year') => {
    const now = new Date();
    const data: { name: string, value: number }[] = [];

    const calculateBalanceAtDate = (targetDate: Date): number => {
        const currentTotal = assets.filter((a: any) => a.status === 'Active').reduce((sum: number, a: any) => sum + a.balance, 0);
        const futureTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate > targetDate;
        });

        let balanceAtDate = currentTotal;
        futureTransactions.forEach(tx => {
            if (tx.type === 'income') {
                balanceAtDate -= tx.amount;
            } else if (tx.type === 'expense') {
                balanceAtDate += tx.amount;
            }
        });
        return balanceAtDate;
    };

    if (timeFrame === 'day') {
        for (let i = 6; i >= 0; i--) {
            const date = addDays(now, -i);
            const dayName = format(date, 'EEE');
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            const balance = calculateBalanceAtDate(dayEnd);
            data.push({ name: dayName, value: Math.round(balance) });
        }
    } else if (timeFrame === 'week') {
        for (let i = 6; i >= 0; i--) {
            const weekStart = addDays(now, -i * 7);
            const weekLabel = format(weekStart, 'MMM dd');
            const balance = calculateBalanceAtDate(weekStart);
            data.push({ name: weekLabel, value: Math.round(balance) });
        }
    } else if (timeFrame === 'month') {
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = format(monthDate, 'MMM');
            const balance = calculateBalanceAtDate(monthDate);
            data.push({ name: monthName, value: Math.round(balance) });
        }
    } else if (timeFrame === 'year') {
        for (let i = 5; i >= 0; i--) {
            const yearDate = new Date(now.getFullYear() - i, 0, 1);
            const yearName = yearDate.getFullYear().toString();
            const balance = calculateBalanceAtDate(yearDate);
            data.push({ name: yearName, value: Math.round(balance) });
        }
    }

    return data;
};

export const generateDebtChartData = (transactions: Transaction[], debts: any[], timeFrame: 'day' | 'week' | 'month' | 'year') => {
    const now = new Date();
    const data: { name: string, value: number }[] = [];

    const calculateBalanceAtDate = (targetDate: Date): number => {
        const currentTotal = debts.filter((d: any) => d.status === 'Active').reduce((sum: number, d: any) => sum + d.balance, 0);
        const futureTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate > targetDate;
        });

        let balanceAtDate = currentTotal;
        futureTransactions.forEach(tx => {
            if (tx.type === 'income') {
                balanceAtDate -= tx.amount;
            } else if (tx.type === 'expense') {
                balanceAtDate += tx.amount;
            }
        });
        return balanceAtDate;
    };

    if (timeFrame === 'day') {
        for (let i = 6; i >= 0; i--) {
            const date = addDays(now, -i);
            const dayName = format(date, 'EEE');
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            const balance = calculateBalanceAtDate(dayEnd);
            data.push({ name: dayName, value: Math.round(balance) });
        }
    } else if (timeFrame === 'week') {
        for (let i = 6; i >= 0; i--) {
            const weekStart = addDays(now, -i * 7);
            const weekLabel = format(weekStart, 'MMM dd');
            const balance = calculateBalanceAtDate(weekStart);
            data.push({ name: weekLabel, value: Math.round(balance) });
        }
    } else if (timeFrame === 'month') {
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = format(monthDate, 'MMM');
            const balance = calculateBalanceAtDate(monthDate);
            data.push({ name: monthName, value: Math.round(balance) });
        }
    } else if (timeFrame === 'year') {
        for (let i = 5; i >= 0; i--) {
            const yearDate = new Date(now.getFullYear() - i, 0, 1);
            const yearName = yearDate.getFullYear().toString();
            const balance = calculateBalanceAtDate(yearDate);
            data.push({ name: yearName, value: Math.round(balance) });
        }
    }

    return data;
};

export const generateNetWorthChartData = (transactions: Transaction[], assets: any[], debts: any[], timeFrame: 'day' | 'week' | 'month' | 'year') => {
    const assetData = generateAssetChartData(transactions, assets, timeFrame);
    const debtData = generateDebtChartData(transactions, debts, timeFrame);

    return assetData.map((assetPoint, index) => ({
        name: assetPoint.name,
        value: Math.round(assetPoint.value - debtData[index].value)
    }));
};
