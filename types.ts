import React from 'react';

export enum Page {
    Dashboard = 'Dashboard',
    Transactions = 'Transactions',
    Accounts = 'Accounts',
    Debts = 'Debts',
    Trends = 'Trends',
    Goals = 'Goals',
    Bills = 'Bills',
    Recurring = 'Recurring',
    Categorize = 'Categorize',
    Settings = 'Settings'
}

export type Currency = 'GBP' | 'USD' | 'EUR';

export interface User {
    name: string;
    username: string;
    email: string;
    avatarUrl: string;
    accountSelection?: {
        mode: 'automatic' | 'manual';
        selectedAssetIds: string[];
        selectedDebtIds: string[];
        automaticCounts: {
            assets: number;
            debts: number;
        };
    };
}

export type NotificationType = 'Bill' | 'Goal' | 'Summary' | 'Info';

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    date: string; // ISO String
    read: boolean;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export interface Transaction {
    id: string;
    logo: string;
    merchant: string;
    category: string;
    date: string; // ISO String
    amount: number;
    type: 'income' | 'expense' | 'investing' | 'debtpayment' | 'transfer';
    accountId: string; // The primary account (e.g., the investing account or debt account)
    // For investing transactions
    ticker?: string;
    shares?: number;
    purchasePrice?: number;
    pricePerShare?: number;
    action?: 'buy' | 'sell' | 'dividend';
    name?: string;
    currencyPrice?: string;
    exchangeRate?: number;
    total?: number;
    currencyTotal?: string;
    sourceAccountId?: string; // The cash account used for purchases or debt payments
    recipientAccountId?: string; // The recipient account for transfers
}

export interface TransactionRule {
  id: string;
  keyword: string;
  categoryName?: string;
  merchantName?: string;
}

export interface PromotionalOffer {
    description: string;
    apr: number;
    offerPayment: number;
    endDate: string; // YYYY-MM-DD
}

export interface BaseAccount {
    id: string;
    name: string;
    status: 'Active' | 'Closed';
    lastUpdated: string;
    icon: string;
    color: string;
}

export interface Holding {
    id: string;
    type: 'Stock' | 'Crypto';
    ticker: string;
    name: string;
    shares: number;
    avgCost: number;
    currentPrice?: number;
    icon?: string;
    isLondonListed?: boolean;
}

export interface Asset extends BaseAccount {
    accountType: 'asset';
    type: 'Checking' | 'Savings' | 'Investing' | string;
    balance: number;
    interestRate?: number;
    holdings?: Holding[];
}

export interface Debt extends BaseAccount {
    accountType: 'debt';
    type: 'Credit Card' | 'Car Loan' | 'Loan' | string;
    balance: number;
    interestRate: number;
    minPayment: number;
    originalBalance: number;
    promotionalOffer?: PromotionalOffer;
}

export type Account = Asset | Debt;

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    targetDate: string; // YYYY-MM-DD
    description?: string;
    linkedAccountIds: string[];
    allocations: { [accountId: string]: number }; // e.g. { 'acc1': 50, 'acc2': 100 }
}

export interface Bill {
    id: string;
    name: string;
    category: 'Entertainment' | 'Utilities' | 'Cloud Storage' | 'Other';
    amount: number;
    dueDate: string; // YYYY-MM-DD
    paymentType: 'Auto-pay' | 'Manual' | 'Reminder';
    linkedAccountId?: string;
    lastProcessedDate?: string; // YYYY-MM-DD
}

export interface RecurringPayment {
    id: string;
    name: string;
    type: 'Expense' | 'Income' | 'Transfer';
    fromAccountId: string;
    toAccountId?: string; // Only for transfers
    amount: number;
    frequency: 'Weekly' | 'Monthly' | 'Yearly';
    startDate: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    category?: string;
    description?: string;
    lastProcessedDate?: string; // YYYY-MM-DD
}

export interface Budgets {
    income: number;
    expense: number;
}

export interface MarketData {
    [ticker: string]: {
        price: number;
        name: string;
    };
}