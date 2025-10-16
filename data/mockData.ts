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
    return [];
};

export const generateNetWorthData = (transactions: Transaction[], timeFilter: 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    return [];
};

export const dynamicIncomeExpenseData: any[] = [];
export const dynamicNetWorthData: any[] = [];

export const generateAssetChartData = (transactions: Transaction[], assets: any[], timeFrame: 'day' | 'week' | 'month' | 'year') => {
    return [];
};

export const generateDebtChartData = (transactions: Transaction[], debts: any[], timeFrame: 'day' | 'week' | 'month' | 'year') => {
    return [];
};
