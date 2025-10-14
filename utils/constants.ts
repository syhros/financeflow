// Shared constants to eliminate magic numbers and duplicated code

export const FORM_INPUT_STYLES = "w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none transition-colors";

export const LABEL_STYLES = "block text-sm font-medium text-gray-300 mb-2";

export const BUTTON_PRIMARY_STYLES = "py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 transition-colors";

export const BUTTON_SECONDARY_STYLES = "py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors";

export const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case 'GBP':
      return '£';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    default:
      return '£';
  }
};

export const CURRENCIES = ['GBP', 'USD', 'EUR'] as const;

export type Currency = typeof CURRENCIES[number];

export const MAX_INTEREST_RATE = 100;
export const MIN_INTEREST_RATE = 0;

export const ACCOUNT_TYPES = ['Checking', 'Savings', 'Investing'] as const;
export const ACCOUNT_STATUS = ['Active', 'Closed'] as const;

export const TRANSACTION_TYPES = ['income', 'expense', 'investing'] as const;

export const DEBT_TYPES = ['Credit Card', 'Car Loan', 'Loan', 'Other'] as const;

export const PAYMENT_TYPES = ['Auto-pay', 'Manual', 'Reminder'] as const;

export const BILL_CATEGORIES = ['Entertainment', 'Utilities', 'Cloud Storage', 'Other'] as const;

export const RECURRING_TYPES = ['Expense', 'Income', 'Transfer'] as const;
export const RECURRING_FREQUENCIES = ['Weekly', 'Monthly', 'Yearly'] as const;

export const NOTIFICATION_TYPES = ['Bill', 'Goal', 'Summary', 'Info'] as const;

// Debounce delay for auto-save operations
export const AUTO_SAVE_DEBOUNCE_MS = 500;

// Local storage keys (for backward compatibility during migration)
export const STORAGE_KEYS = {
  USER: 'user',
  ASSETS: 'assets',
  DEBTS: 'debts',
  TRANSACTIONS: 'transactions',
  GOALS: 'goals',
  BILLS: 'bills',
  RECURRING_PAYMENTS: 'recurringPayments',
  CATEGORIES: 'categories',
  RULES: 'rules',
  BUDGET: 'budget',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
};
