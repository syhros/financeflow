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
    { id: '1', name: 'Coffee', icon: 'ShoppingBagIcon', color: 'bg-amber-500' },
    { id: '2', name: 'Drinks', icon: 'ShoppingBagIcon', color: 'bg-blue-500' },
    { id: '3', name: 'Food', icon: 'ReceiptIcon', color: 'bg-orange-500' },
    { id: '4', name: 'Fast Food', icon: 'ShoppingBagIcon', color: 'bg-red-500' },
    { id: '5', name: 'Outings', icon: 'FilmIcon', color: 'bg-purple-500' },
    { id: '6', name: 'Entertainment', icon: 'FilmIcon', color: 'bg-violet-500' },
    { id: '7', name: 'Holiday', icon: 'CalendarDaysIcon', color: 'bg-indigo-500' },
    { id: '8', name: 'Travel', icon: 'CarIcon', color: 'bg-cyan-500' },
    { id: '9', name: 'Games', icon: 'FilmIcon', color: 'bg-fuchsia-500' },
    { id: '10', name: 'Personal Care', icon: 'WrenchScrewdriverIcon', color: 'bg-pink-500' },
    { id: '11', name: 'Clothes', icon: 'ShoppingBagIcon', color: 'bg-rose-500' },
    { id: '12', name: 'Gifts', icon: 'GiftIcon', color: 'bg-rose-500' },
    { id: '13', name: 'Household', icon: 'HomeModernIcon', color: 'bg-slate-500' },
    { id: '14', name: 'Rent', icon: 'HomeModernIcon', color: 'bg-red-600' },
    { id: '15', name: 'Gym', icon: 'RefreshIcon', color: 'bg-green-500' },
    { id: '16', name: 'Petrol', icon: 'CarIcon', color: 'bg-orange-600' },
    { id: '17', name: 'Car Expenses', icon: 'CarIcon', color: 'bg-yellow-600' },
    { id: '18', name: 'Bills', icon: 'BillsIcon', color: 'bg-red-500' },
    { id: '19', name: 'Account Fees', icon: 'BanknotesIcon', color: 'bg-gray-600' },
    { id: '20', name: 'Debt', icon: 'DebtsIcon', color: 'bg-red-700' },
    { id: '21', name: 'Loan', icon: 'LoanIcon', color: 'bg-blue-600' },
    { id: '22', name: 'Gambling', icon: 'ShoppingBagIcon', color: 'bg-red-800' },
    { id: '23', name: 'Online Shopping', icon: 'ShoppingBagIcon', color: 'bg-blue-500' },
    { id: '24', name: 'Cash Withdrawal', icon: 'BanknotesIcon', color: 'bg-gray-700' },
    { id: '25', name: 'Income', icon: 'BanknotesIcon', color: 'bg-green-500' },
    { id: '26', name: 'Get Paid Too', icon: 'WalletIcon', color: 'bg-green-600' },
    { id: '27', name: 'Cashback', icon: 'BanknotesIcon', color: 'bg-green-500' },
    { id: '28', name: 'Refunds', icon: 'BanknotesIcon', color: 'bg-green-500' },
    { id: '29', name: 'Interest', icon: 'BanknotesIcon', color: 'bg-green-500' },
    { id: '30', name: 'Switch Offer', icon: 'GiftIcon', color: 'bg-green-500' },
    { id: '31', name: 'Crypto', icon: 'CloudIcon', color: 'bg-yellow-500' },
    { id: '32', name: 'Savings', icon: 'WalletIcon', color: 'bg-blue-500' },
    { id: '33', name: 'Expenses', icon: 'ReceiptIcon', color: 'bg-orange-500' },
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
    const now = new Date();
    const data: { name: string, value: number }[] = [];

    // Calculate initial net worth (current assets - current debts)
    const currentAssets = assets.filter((a: any) => a.status === 'Active').reduce((sum: number, a: any) => sum + a.balance, 0);
    const currentDebts = debts.filter((d: any) => d.status === 'Active').reduce((sum: number, d: any) => sum + d.balance, 0);

    const calculateNetWorthAtDate = (targetDate: Date): number => {
        let totalIncome = 0, totalExpenses = 0;
        transactions.forEach(tx => {
            const txDate = new Date(tx.date);
            if (txDate <= targetDate) {
                if (tx.type === 'income') totalIncome += tx.amount;
                else if (tx.type === 'expense') totalExpenses += tx.amount;
                else if (tx.type === 'debtpayment') totalExpenses += tx.amount;
            }
        });
        return currentAssets + totalIncome - totalExpenses - currentDebts;
    };

    if (timeFrame === 'day') {
        for (let i = 6; i >= 0; i--) {
            const date = addDays(now, -i);
            const dayName = format(date, 'EEE');
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            const netWorth = calculateNetWorthAtDate(dayEnd);
            data.push({ name: dayName, value: Math.round(netWorth) });
        }
    } else if (timeFrame === 'week') {
        for (let i = 6; i >= 0; i--) {
            const weekStart = addDays(now, -i * 7);
            const weekLabel = format(weekStart, 'MMM dd');
            const netWorth = calculateNetWorthAtDate(weekStart);
            data.push({ name: weekLabel, value: Math.round(netWorth) });
        }
    } else if (timeFrame === 'month') {
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = format(monthDate, 'MMM');
            const netWorth = calculateNetWorthAtDate(monthDate);
            data.push({ name: monthName, value: Math.round(netWorth) });
        }
    } else if (timeFrame === 'year') {
        for (let i = 5; i >= 0; i--) {
            const yearDate = new Date(now.getFullYear() - i, 0, 1);
            const yearName = yearDate.getFullYear().toString();
            const netWorth = calculateNetWorthAtDate(yearDate);
            data.push({ name: yearName, value: Math.round(netWorth) });
        }
    }

    return data;
};
