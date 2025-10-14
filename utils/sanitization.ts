// Input sanitization utilities to prevent XSS attacks

export const sanitizeString = (input: string): string => {
  if (!input) return '';

  // Remove any HTML tags
  const withoutTags = input.replace(/<[^>]*>/g, '');

  // Escape special characters
  return withoutTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const sanitizeMerchantName = (name: string): string => {
  // Remove special characters that could break logo URL generation
  return name.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
};

export const sanitizeNumber = (value: string | number): number => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) || !isFinite(num) ? 0 : num;
};

export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
};
