// Helper utility functions

import { sanitizeMerchantName } from './sanitization';

// Generate unique ID (fixes the Date.now() collision bug)
let idCounter = 0;
export const generateUniqueId = (): string => {
  const timestamp = Date.now();
  const counter = idCounter++;
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${counter}-${random}`;
};

// Safe debt payoff calculation (fixes the NaN crash bug)
export const calculateDebtPayoff = (
  balance: number,
  interestRate: number,
  minPayment: number,
  promotionalOffer?: {
    apr: number;
    offerPayment: number;
    endDate: string;
  }
): { label: 'Payoff Date' | 'Shortfall'; value: string | React.ReactNode } => {
  const today = new Date();

  // Handle promotional offers
  if (promotionalOffer && new Date(promotionalOffer.endDate) > today) {
    const endDate = new Date(promotionalOffer.endDate);
    const monthsLeft =
      (endDate.getFullYear() - today.getFullYear()) * 12 +
      (endDate.getMonth() - today.getMonth());

    if (monthsLeft > 0) {
      const totalPromoPayments = promotionalOffer.offerPayment * monthsLeft;

      if (balance > totalPromoPayments) {
        const shortfall = balance - totalPromoPayments;
        return {
          label: 'Shortfall',
          value: shortfall,
        };
      } else {
        const monthsToPayoff = Math.ceil(balance / promotionalOffer.offerPayment);
        const payoffDate = new Date(new Date().setMonth(today.getMonth() + monthsToPayoff));
        return {
          label: 'Payoff Date',
          value: payoffDate.toLocaleString('en-GB', { month: 'short', year: '2-digit' }).toUpperCase(),
        };
      }
    }
  }

  // Regular debt calculation with safety checks
  if (minPayment <= 0) {
    return { label: 'Payoff Date', value: 'N/A' };
  }

  const i = interestRate / 100 / 12;

  // Handle zero interest rate
  if (i === 0) {
    const monthsToPayoff = Math.ceil(balance / minPayment);
    if (!isFinite(monthsToPayoff)) {
      return { label: 'Payoff Date', value: 'N/A' };
    }
    const payoffDate = new Date(new Date().setMonth(today.getMonth() + monthsToPayoff));
    return {
      label: 'Payoff Date',
      value: payoffDate.toLocaleString('en-GB', { month: 'short', year: '2-digit' }).toUpperCase(),
    };
  }

  // Check if minimum payment covers interest
  const monthlyInterest = balance * i;
  if (minPayment <= monthlyInterest) {
    return { label: 'Payoff Date', value: 'Never (payment < interest)' };
  }

  // Calculate payoff months with safety checks
  const numerator = 1 - (balance * i) / minPayment;
  if (numerator <= 0) {
    return { label: 'Payoff Date', value: 'N/A' };
  }

  const n = -Math.log(numerator) / Math.log(1 + i);

  // Validate result
  if (!isFinite(n) || isNaN(n) || n <= 0) {
    return { label: 'Payoff Date', value: 'N/A' };
  }

  const monthsToPayoff = Math.ceil(n);
  const payoffDate = new Date(new Date().setMonth(today.getMonth() + monthsToPayoff));

  return {
    label: 'Payoff Date',
    value: payoffDate.toLocaleString('en-GB', { month: 'short', year: '2-digit' }).toUpperCase(),
  };
};

// Generate safe logo URL (fixes XSS vulnerability)
export const generateLogoUrl = (merchantName: string): string => {
  if (!merchantName) return '';

  const sanitized = sanitizeMerchantName(merchantName);
  const normalized = sanitized.toLowerCase().replace(/\s+/g, '');

  if (normalized.length === 0) return '';

  return `https://logo.clearbit.com/${normalized}.com`;
};

// Debounce function for performance optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Format date consistently
export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return 'Invalid date';

  if (format === 'short') {
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Check if localStorage is available and has space
export const checkLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// Safe localStorage operations
export const safeLocalStorageSet = (key: string, value: any): boolean => {
  if (!checkLocalStorageAvailable()) return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('localStorage quota exceeded or not available:', error);
    return false;
  }
};

export const safeLocalStorageGet = <T>(key: string, defaultValue: T): T => {
  if (!checkLocalStorageAvailable()) return defaultValue;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const safeLocalStorageRemove = (key: string): void => {
  if (!checkLocalStorageAvailable()) return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};
