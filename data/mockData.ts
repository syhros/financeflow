import { Asset, Debt, Goal, Bill, Transaction, RecurringPayment, Budgets, Holding, Category, TransactionRule, User } from '../types';
// FIX: Removed `subDays` as it was causing an import error. `addDays` with a negative value will be used instead.
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';

const today = new Date();

const mondayOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
const weekLabels = Array.from({ length: 7 }, (_, i) => {
    const weekStart = addWeeks(mondayOfThisWeek, i - 6);
    return format(weekStart, 'dd/MM');
});

export const mockUser: User = {
    name: 'Jane Doe',
    username: 'janedoe',
    email: 'jane.doe@example.com',
    avatarUrl: 'https://randomuser.me/api/portraits/women/17.jpg',
};

export const mockHoldings: Holding[] = [
    { type: 'Stock', ticker: 'AAPL', name: 'Apple Inc.', shares: 10, avgCost: 150.75 },
    { type: 'Stock', ticker: 'TSLA', name: 'Tesla Inc.', shares: 5, avgCost: 220.40 },
    { type: 'Crypto', ticker: 'BTC-USD', name: 'Bitcoin', shares: 0.5, avgCost: 40000.00 },
];

export const mockAssets: Asset[] = [
  { id: '1', accountType: 'asset', name: 'Main Current', type: 'Checking', balance: 15340.75, status: 'Active', lastUpdated: '2h ago', icon: 'AccountsIcon', color: 'bg-green-500', interestRate: 0.1 },
  { id: '2', accountType: 'asset', name: 'Holiday Fund', type: 'Savings', balance: 2499.50, status: 'Active', lastUpdated: '1d ago', icon: 'WalletIcon', color: 'bg-blue-500', interestRate: 2.5 },
  { id: '3', accountType: 'asset', name: 'Emergency Savings', type: 'Savings', balance: 10500.00, status: 'Active', lastUpdated: '3d ago', icon: 'WalletIcon', color: 'bg-teal-500', interestRate: 3.0 },
  { id: '4', accountType: 'asset', name: 'Stocks & Shares ISA', type: 'Investing', balance: 0, status: 'Active', lastUpdated: '1h ago', icon: 'WalletIcon', color: 'bg-purple-500', holdings: mockHoldings },
  { id: '5', accountType: 'asset', name: 'Chase Debit', type: 'Checking', balance: 1234.56, status: 'Active', lastUpdated: 'just now', icon: 'AccountsIcon', color: 'bg-sky-500' },
  { id: '6', accountType: 'asset', name: 'Crypto Wallet', type: 'Investing', balance: 0, status: 'Active', lastUpdated: '5m ago', icon: 'WalletIcon', color: 'bg-yellow-500', holdings: [] },
  { id: '7', accountType: 'asset', name: 'Old Student Account', type: 'Checking', balance: 0.00, status: 'Closed', lastUpdated: 'Archived', icon: 'AccountsIcon', color: 'bg-gray-600' },
];

export const mockDebts: Debt[] = [
   { id: '8', accountType: 'debt', name: 'Nissan PCP', type: 'Car Loan', balance: 6799.00, originalBalance: 12000.00, interestRate: 5.9, minPayment: 211.06, status: 'Active', lastUpdated: '3d ago', icon: 'CarIcon', color: 'bg-gray-700',
    promotionalOffer: { description: 'Reduced interest for 24 months', apr: 2.9, offerPayment: 250, endDate: format(addDays(today, 540), 'yyyy-MM-dd') }
  },
  { id: '9', accountType: 'debt', name: 'Amex Gold', type: 'Credit Card', balance: 1245.67, originalBalance: 1245.67, interestRate: 22.9, minPayment: 50.00, status: 'Active', lastUpdated: '1d ago', icon: 'CreditCardIcon', color: 'bg-amber-800' },
  { id: '10', accountType: 'debt', name: 'Personal Loan', type: 'Loan', balance: 4500.00, originalBalance: 10000.00, interestRate: 7.5, minPayment: 300, status: 'Active', lastUpdated: '5d ago', icon: 'LoanIcon', color: 'bg-indigo-700' },
];

export const mockGoals: Goal[] = [
    {
        id: 'g1',
        name: 'Emergency Fund',
        targetAmount: 2500,
        targetDate: format(addDays(today, 365), 'yyyy-MM-dd'),
        linkedAccountIds: ['2', '3'],
        allocations: { '2': 50, '3': 10 }
    },
    {
        id: 'g2',
        name: 'New Car',
        targetAmount: 5000,
        targetDate: format(addDays(today, 730), 'yyyy-MM-dd'),
        linkedAccountIds: ['4'],
        allocations: { '4': 10 }
    }
];

export const mockBills: Bill[] = [
    { id: 'b1', name: 'Spotify', category: 'Entertainment', amount: 9.99, dueDate: format(addDays(today, 2), 'yyyy-MM-dd'), paymentType: 'Auto-pay', linkedAccountId: '1'},
    { id: 'b2', name: 'Netflix', category: 'Entertainment', amount: 15.99, dueDate: format(addDays(today, 1), 'yyyy-MM-dd'), paymentType: 'Auto-pay', linkedAccountId: '1'},
    { id: 'b3', name: 'iCloud+', category: 'Cloud Storage', amount: 2.49, dueDate: format(addDays(today, 10), 'yyyy-MM-dd'), paymentType: 'Reminder', linkedAccountId: '5'},
    { id: 'b4', name: 'British Gas', category: 'Utilities', amount: 85.00, dueDate: format(addDays(today, 15), 'yyyy-MM-dd'), paymentType: 'Manual'},
    { id: 'b5', name: 'Gym Membership', category: 'Other', amount: 45.00, dueDate: format(addDays(today, 20), 'yyyy-MM-dd'), paymentType: 'Auto-pay', linkedAccountId: '5'},
    { id: 'b6', name: 'Car Insurance', category: 'Utilities', amount: 55.50, dueDate: format(addDays(today, 25), 'yyyy-MM-dd'), paymentType: 'Manual', linkedAccountId: '1'},
];

export const mockTransactions: Transaction[] = [
    { id: '1', logo: 'https://logo.clearbit.com/apple.com', merchant: 'Apple Store', category: 'Shopping', date: addDays(today, -1).toISOString(), amount: 999.00, type: 'expense', accountId: '9' },
    { id: '2', logo: 'https://logo.clearbit.com/amazon.co.uk', merchant: 'Amazon UK', category: 'Shopping', date: addDays(today, -1).toISOString(), amount: 42.50, type: 'expense', accountId: '1' },
    { id: '3', logo: 'https://logo.clearbit.com/upwork.com', merchant: 'Freelance Client', category: 'Income', date: addDays(today, -2).toISOString(), amount: 1200.00, type: 'income', accountId: '1' },
    { id: '4', logo: 'https://logo.clearbit.com/spotify.com', merchant: 'Spotify Premium', category: 'Subscription', date: addDays(today, -2).toISOString(), amount: 9.99, type: 'expense', accountId: '1' },
    { id: '5', logo: 'https://logo.clearbit.com/tesco.com', merchant: 'Tesco', category: 'Groceries', date: addDays(today, -3).toISOString(), amount: 67.23, type: 'expense', accountId: '5' },
    // New Uncategorized Transactions
    { id: 't-uncat-1', logo: 'https://logo.clearbit.com/starbucks.com', merchant: 'STARBUCKS 5982', category: 'Uncategorized', date: addDays(today, 0).toISOString(), amount: 4.80, type: 'expense', accountId: '1' },
    { id: 't-uncat-2', logo: 'https://logo.clearbit.com/tfl.gov.uk', merchant: 'TFL TRAVEL CH', category: 'Uncategorized', date: addDays(today, -1).toISOString(), amount: 12.50, type: 'expense', accountId: '9' },
    { id: 't-uncat-3', logo: 'https://logo.clearbit.com/amazon.com', merchant: 'AMZN Mktp UK', category: 'Uncategorized', date: addDays(today, -1).toISOString(), amount: 25.49, type: 'expense', accountId: '1' },
    { id: 't-uncat-4', logo: 'https://logo.clearbit.com/ubereats.com', merchant: 'UBER EATS', category: 'Uncategorized', date: addDays(today, -2).toISOString(), amount: 33.10, type: 'expense', accountId: '9' },
    { id: 't-uncat-5', logo: 'https://logo.clearbit.com/pret.com', merchant: 'PRET A MANGER', category: 'Uncategorized', date: addDays(today, -2).toISOString(), amount: 8.75, type: 'expense', accountId: '5' },
    { id: 't-uncat-6', logo: 'https://logo.clearbit.com/sainsburys.co.uk', merchant: 'SAINSBURYS S/MKTS', category: 'Uncategorized', date: addDays(today, -3).toISOString(), amount: 54.80, type: 'expense', accountId: '1' },
    { id: 't-uncat-7', logo: 'https://logo.clearbit.com/cineworld.co.uk', merchant: 'CINEWORLD', category: 'Uncategorized', date: addDays(today, -3).toISOString(), amount: 25.00, type: 'expense', accountId: '9' },
    { id: 't-uncat-8', logo: 'https://logo.clearbit.com/shell.com', merchant: 'SHELL SERVICE', category: 'Uncategorized', date: addDays(today, -4).toISOString(), amount: 65.20, type: 'expense', accountId: '1' },
    { id: 't-uncat-9', logo: 'https://logo.clearbit.com/trainline.com', merchant: 'THE TRAINLINE', category: 'Uncategorized', date: addDays(today, -4).toISOString(), amount: 88.90, type: 'expense', accountId: '5' },
    { id: 't-uncat-10', logo: 'https://logo.clearbit.com/costa.co.uk', merchant: 'COSTA COFFEE', category: 'Uncategorized', date: addDays(today, -5).toISOString(), amount: 6.20, type: 'expense', accountId: '1' },
    { id: 't-uncat-11', logo: 'https://logo.clearbit.com/deliveroo.co.uk', merchant: 'DELIVEROO', category: 'Uncategorized', date: addDays(today, -5).toISOString(), amount: 28.45, type: 'expense', accountId: '9' },
    { id: 't-uncat-12', logo: 'https://logo.clearbit.com/asda.com', merchant: 'ASDA SUPERSTORE', category: 'Uncategorized', date: addDays(today, -6).toISOString(), amount: 72.13, type: 'expense', accountId: '1' },
    { id: 't-uncat-13', logo: 'https://logo.clearbit.com/amazon.com', merchant: 'Amazon Prime', category: 'Uncategorized', date: addDays(today, -6).toISOString(), amount: 8.99, type: 'expense', accountId: '5' },
    { id: 't-uncat-14', logo: 'https://logo.clearbit.com/greggs.co.uk', merchant: 'GREGGS', category: 'Uncategorized', date: addDays(today, -7).toISOString(), amount: 5.50, type: 'expense', accountId: '1' },
    { id: 't-uncat-15', logo: 'https://logo.clearbit.com/ikea.com', merchant: 'IKEA', category: 'Uncategorized', date: addDays(today, -8).toISOString(), amount: 152.00, type: 'expense', accountId: '9' },
    { id: 't-uncat-16', logo: 'https://logo.clearbit.com/aldi.co.uk', merchant: 'ALDI', category: 'Uncategorized', date: addDays(today, -9).toISOString(), amount: 43.12, type: 'expense', accountId: '1' },
    { id: 't-uncat-17', logo: 'https://logo.clearbit.com/boots.com', merchant: 'BOOTS', category: 'Uncategorized', date: addDays(today, -10).toISOString(), amount: 19.99, type: 'expense', accountId: '5' },
    { id: 't-uncat-18', logo: 'https://logo.clearbit.com/hm.com', merchant: 'H&M', category: 'Uncategorized', date: addDays(today, -11).toISOString(), amount: 45.50, type: 'expense', accountId: '9' },
    { id: 't-uncat-19', logo: 'https://logo.clearbit.com/just-eat.co.uk', merchant: 'JUST EAT', category: 'Uncategorized', date: addDays(today, -12).toISOString(), amount: 21.80, type: 'expense', accountId: '1' },
    { id: 't-uncat-20', logo: 'https://logo.clearbit.com/nationalrail.co.uk', merchant: 'NATIONAL RAIL', category: 'Uncategorized', date: addDays(today, -13).toISOString(), amount: 112.40, type: 'expense', accountId: '5' },
];

export const mockRecurringPayments: RecurringPayment[] = [
    { id: 'r1', name: 'Salary', type: 'Income', fromAccountId: '1', amount: 2500, frequency: 'Monthly', startDate: '2023-01-28', category: 'Salary', lastProcessedDate: format(addDays(today, -20), 'yyyy-MM-dd') },
    { id: 'r2', name: 'Savings Transfer', type: 'Transfer', fromAccountId: '1', toAccountId: '3', amount: 500, frequency: 'Monthly', startDate: '2023-02-01', lastProcessedDate: format(addDays(today, -18), 'yyyy-MM-dd') },
    { id: 'r3', name: 'Rent', type: 'Expense', fromAccountId: '1', amount: 1200, frequency: 'Monthly', startDate: '2023-02-01', category: 'Housing', lastProcessedDate: format(addDays(today, -18), 'yyyy-MM-dd') },
    { id: 'r4', name: 'Pocket Money', type: 'Transfer', fromAccountId: '1', toAccountId: '5', amount: 50, frequency: 'Weekly', startDate: '2023-01-01', lastProcessedDate: format(addDays(today, -5), 'yyyy-MM-dd') },
];

export const assetDayData = [{name:"Mon",value:27350},{name:"Tue",value:27269},{name:"Wed",value:27213},{name:"Thu",value:27158},{name:"Fri",value:26200},{name:"Sat",value:26150},{name:"Sun",value:26400}];
export const assetWeekData = [
    { name: weekLabels[0], value: 25800 },
    { name: weekLabels[1], value: 26100 },
    { name: weekLabels[2], value: 25950 },
    { name: weekLabels[3], value: 26300 },
    { name: weekLabels[4], value: 26700 },
    { name: weekLabels[5], value: 26500 },
    { name: weekLabels[6], value: 26400 }
];
export const assetMonthData = [{name:"May",value:24500},{name:"Jun",value:25100},{name:"Jul",value:25800},{name:"Aug",value:25300},{name:"Sep",value:26100},{name:"Oct",value:26400}];
export const assetYearData = [{name:"2020",value:18000},{name:"2021",value:21000},{name:"2022",value:20500},{name:"2023",value:23000},{name:"2024",value:26400},{name:"2025",value:27000}];

export const debtDayData = [{name:"Mon",value:12550},{name:"Tue",value:12550},{name:"Wed",value:12540},{name:"Thu",value:12540},{name:"Fri",value:12520},{name:"Sat",value:12520},{name:"Sun",value:12544}];
export const debtWeekData = [
    { name: weekLabels[0], value: 12800 },
    { name: weekLabels[1], value: 12750 },
    { name: weekLabels[2], value: 12700 },
    { name: weekLabels[3], value: 12650 },
    { name: weekLabels[4], value: 12600 },
    { name: weekLabels[5], value: 12550 },
    { name: weekLabels[6], value: 12544 }
];
export const debtMonthData = [{name:"May",value:13500},{name:"Jun",value:13300},{name:"Jul",value:13100},{name:"Aug",value:12900},{name:"Sep",value:12700},{name:"Oct",value:12544}];
export const debtYearData = [{name:"2020",value:18000},{name:"2021",value:16500},{name:"2022",value:15000},{name:"2023",value:14000},{name:"2024",value:12544},{name:"2025",value:11000}];


export const mockNetWorthData = [
  { name: 'Jan', value: 38500 },
  { name: 'Feb', value: 39200 },
  { name: 'Mar', value: 41000 },
  { name: 'Apr', value: 40500 },
  { name: 'May', value: 42300 },
  { name: 'Jun', value: 43500 },
];

export const mockBudgets: Budgets = {
    income: 5000,
    expense: 3000
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

// Generate 6+ years of realistic transaction data (4 income + 4 expense per week)
const generateHistoricalTransactions = (): Transaction[] => {
    const transactions: Transaction[] = [];
    const startDate = addDays(today, -365 * 6); // 6 years ago

    // Base 8 transactions per week (4 income, 4 expense)
    const baseWeeklyTransactions = [
        // Income transactions
        { logo: 'https://logo.clearbit.com/company.com', merchant: 'Salary Deposit', category: 'Salary', amount: 2500, type: 'income' as const, accountId: '1' },
        { logo: 'https://logo.clearbit.com/upwork.com', merchant: 'Freelance Work', category: 'Income', amount: 450, type: 'income' as const, accountId: '1' },
        { logo: 'https://logo.clearbit.com/ebay.com', merchant: 'eBay Sale', category: 'Income', amount: 75, type: 'income' as const, accountId: '5' },
        { logo: 'https://logo.clearbit.com/paypal.com', merchant: 'Refund', category: 'Income', amount: 32.50, type: 'income' as const, accountId: '1' },

        // Expense transactions
        { logo: 'https://logo.clearbit.com/tesco.com', merchant: 'Tesco Groceries', category: 'Groceries', amount: 85.40, type: 'expense' as const, accountId: '1' },
        { logo: 'https://logo.clearbit.com/shell.com', merchant: 'Shell Petrol', category: 'Transport', amount: 62.00, type: 'expense' as const, accountId: '5' },
        { logo: 'https://logo.clearbit.com/amazon.co.uk', merchant: 'Amazon Shopping', category: 'Shopping', amount: 45.99, type: 'expense' as const, accountId: '9' },
        { logo: 'https://logo.clearbit.com/starbucks.com', merchant: 'Starbucks Coffee', category: 'Coffee', amount: 12.50, type: 'expense' as const, accountId: '1' },
    ];

    let txId = 1000;
    let currentDate = new Date(startDate);

    // Generate transactions week by week for 6 years
    while (currentDate <= today) {
        baseWeeklyTransactions.forEach((baseTx, index) => {
            const dayOffset = Math.floor(index / 1.5); // Spread across different days
            const txDate = addDays(currentDate, dayOffset);

            if (txDate <= today) {
                transactions.push({
                    id: `hist-${txId++}`,
                    ...baseTx,
                    date: txDate.toISOString(),
                    // Add slight randomness to amounts (±10%)
                    amount: Number((baseTx.amount * (0.9 + Math.random() * 0.2)).toFixed(2))
                });
            }
        });

        currentDate = addDays(currentDate, 7); // Next week
    }

    return transactions;
};

export const historicalTransactions = generateHistoricalTransactions();

// Combine with existing mock transactions
export const allTransactions = [...historicalTransactions, ...mockTransactions];

// Generate dynamic chart data from transactions
export const generateIncomeExpenseData = (transactions: Transaction[], timeFilter: 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    const now = new Date();

    if (timeFilter === 'weekly') {
        const weeksData: { name: string, income: number, expenses: number }[] = [];
        // Last 12 weeks
        for (let i = 11; i >= 0; i--) {
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
        // Get all unique years from transactions
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
        // Monthly (last 12 months)
        const monthsData: { month: string, year: number, income: number, expenses: number }[] = [];
        for (let i = 11; i >= 0; i--) {
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
    const baseNetWorth = 40000;

    if (timeFilter === 'weekly') {
        const weeksData: { name: string, value: number }[] = [];
        // Last 12 weeks
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
        // Get all unique years from transactions
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
        // Monthly (last 12 months)
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

// Export dynamic data
export const dynamicIncomeExpenseData = generateIncomeExpenseData(allTransactions);
export const dynamicNetWorthData = generateNetWorthData(allTransactions);

// Dynamic Asset/Debt chart data generation
export const generateAssetChartData = (transactions: Transaction[], assets: any[], timeFrame: 'day' | 'week' | 'month' | 'year') => {
    const now = new Date();
    const data: { name: string, value: number }[] = [];

    // Calculate current total assets
    const currentTotalAssets = assets.filter(a => a.status === 'Active').reduce((sum, a) => sum + a.balance, 0);

    if (timeFrame === 'day') {
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = addDays(now, -i);
            const dayName = format(date, 'EEE');

            // Calculate balance at end of that day
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const balance = calculateBalanceAtDate(transactions, assets, dayEnd);
            data.push({ name: dayName, value: Math.round(balance) });
        }
    } else if (timeFrame === 'week') {
        // Last 7 weeks
        for (let i = 6; i >= 0; i--) {
            const weekStart = addDays(now, -i * 7);
            const weekLabel = format(weekStart, 'MMM dd');

            const balance = calculateBalanceAtDate(transactions, assets, weekStart);
            data.push({ name: weekLabel, value: Math.round(balance) });
        }
    } else if (timeFrame === 'month') {
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = format(monthDate, 'MMM');

            const balance = calculateBalanceAtDate(transactions, assets, monthDate);
            data.push({ name: monthName, value: Math.round(balance) });
        }
    } else if (timeFrame === 'year') {
        // Last 6 years
        for (let i = 5; i >= 0; i--) {
            const yearDate = new Date(now.getFullYear() - i, 0, 1);
            const yearName = yearDate.getFullYear().toString();

            const balance = calculateBalanceAtDate(transactions, assets, yearDate);
            data.push({ name: yearName, value: Math.round(balance) });
        }
    }

    return data;
};

export const generateDebtChartData = (transactions: Transaction[], debts: any[], timeFrame: 'day' | 'week' | 'month' | 'year') => {
    const now = new Date();
    const data: { name: string, value: number }[] = [];

    // Calculate current total debts
    const currentTotalDebts = debts.filter(d => d.status === 'Active').reduce((sum, d) => sum + d.balance, 0);

    if (timeFrame === 'day') {
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = addDays(now, -i);
            const dayName = format(date, 'EEE');

            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const balance = calculateBalanceAtDate(transactions, debts, dayEnd);
            data.push({ name: dayName, value: Math.round(balance) });
        }
    } else if (timeFrame === 'week') {
        // Last 7 weeks
        for (let i = 6; i >= 0; i--) {
            const weekStart = addDays(now, -i * 7);
            const weekLabel = format(weekStart, 'MMM dd');

            const balance = calculateBalanceAtDate(transactions, debts, weekStart);
            data.push({ name: weekLabel, value: Math.round(balance) });
        }
    } else if (timeFrame === 'month') {
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = format(monthDate, 'MMM');

            const balance = calculateBalanceAtDate(transactions, debts, monthDate);
            data.push({ name: monthName, value: Math.round(balance) });
        }
    } else if (timeFrame === 'year') {
        // Last 6 years
        for (let i = 5; i >= 0; i--) {
            const yearDate = new Date(now.getFullYear() - i, 0, 1);
            const yearName = yearDate.getFullYear().toString();

            const balance = calculateBalanceAtDate(transactions, debts, yearDate);
            data.push({ name: yearName, value: Math.round(balance) });
        }
    }

    return data;
};

// Helper function to calculate balance at a specific date
const calculateBalanceAtDate = (transactions: Transaction[], accounts: any[], targetDate: Date): number => {
    // Start with current balances
    const currentTotal = accounts.filter(a => a.status === 'Active').reduce((sum, a) => sum + a.balance, 0);

    // Calculate transactions that happened AFTER target date
    const futureTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate > targetDate;
    });

    // Subtract future transactions to get balance at target date
    let balanceAtDate = currentTotal;
    futureTransactions.forEach(tx => {
        if (tx.type === 'income') {
            balanceAtDate -= tx.amount; // Remove income that hasn't happened yet
        } else if (tx.type === 'expense') {
            balanceAtDate += tx.amount; // Add back expenses that haven't happened yet
        }
    });

    return balanceAtDate;
};