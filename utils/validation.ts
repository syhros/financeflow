// Input validation utilities

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount >= 0;
};

export const validatePercentage = (percentage: number): boolean => {
  return !isNaN(percentage) && isFinite(percentage) && percentage >= 0 && percentage <= 100;
};

export const validateDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

export const validateFutureDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  return parsedDate.getTime() > Date.now();
};

export const validatePastDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  return parsedDate.getTime() <= Date.now();
};

export const validateTickerSymbol = (ticker: string): boolean => {
  // Ticker symbols are typically 1-5 uppercase letters, sometimes with a dot
  const tickerRegex = /^[A-Z]{1,5}(\.[A-Z]+)?$/;
  return tickerRegex.test(ticker);
};

export const validateRequired = (value: string | number | undefined | null): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

export const validateInterestRate = (rate: number): boolean => {
  return !isNaN(rate) && isFinite(rate) && rate >= 0 && rate <= 100;
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start.getTime() < end.getTime();
};

export const validateAccountsDifferent = (fromId: string, toId: string): boolean => {
  return fromId !== toId;
};
