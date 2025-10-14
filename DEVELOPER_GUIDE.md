# Developer Guide - Financial Flow

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see .env file)
# Add your Supabase credentials (already configured)
# Optionally add VITE_MARKET_DATA_API_KEY for real market data

# Run development server
npm run dev

# Build for production
npm run build
```

---

## Architecture Overview

### Technology Stack
- **Frontend:** React 19.2 + TypeScript 5.8
- **Build Tool:** Vite 6.2
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Styling:** Tailwind CSS (via CDN)
- **Charts:** Recharts 3.2
- **Date Utilities:** date-fns 4.1

### Directory Structure
```
project/
├── components/        # React components
│   ├── shared/       # Shared/reusable components
│   ├── Dashboard.tsx
│   ├── Transactions.tsx
│   ├── Accounts.tsx
│   ├── Debts.tsx
│   ├── Goals.tsx
│   ├── Bills.tsx
│   ├── Recurring.tsx
│   ├── Categorize.tsx
│   ├── Settings.tsx
│   ├── Trends.tsx
│   └── ErrorBoundary.tsx
├── lib/              # Third-party integrations
│   └── supabase.ts
├── services/         # External services
│   ├── marketData.ts
│   └── notificationService.ts
├── utils/            # Utility functions
│   ├── constants.ts
│   ├── validation.ts
│   ├── sanitization.ts
│   └── helpers.ts
├── data/             # Mock data
│   └── mockData.ts
├── types.ts          # TypeScript type definitions
└── App.tsx           # Main application component
```

---

## Database Schema

### Supabase Tables

All tables have Row Level Security (RLS) enabled. Users can only access their own data.

#### Core Tables:
1. **users** - User profiles
2. **assets** - Financial accounts (checking, savings, investing)
3. **holdings** - Investment holdings (stocks, crypto)
4. **debts** - Credit cards, loans, mortgages
5. **transactions** - All financial transactions
6. **goals** - Savings goals
7. **bills** - Recurring bills and subscriptions
8. **recurring_payments** - Automated payments
9. **categories** - Custom transaction categories
10. **transaction_rules** - Auto-categorization rules
11. **budgets** - User budgets
12. **notifications** - System notifications
13. **user_settings** - User preferences

### Database Connection

```typescript
import { supabase } from './lib/supabase';

// Example query
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId);
```

---

## Utility Functions

### 1. Validation (`utils/validation.ts`)

Always validate user input before processing:

```typescript
import {
  validateEmail,
  validateAmount,
  validatePercentage,
  validateTickerSymbol
} from './utils/validation';

// Example usage
if (!validateEmail(email)) {
  setError('Invalid email format');
  return;
}

if (!validateAmount(amount)) {
  setError('Amount must be a positive number');
  return;
}
```

**Available Validators:**
- `validateEmail(email)` - Email format
- `validateAmount(amount)` - Positive numbers
- `validatePercentage(percentage)` - 0-100 range
- `validateDate(date)` - Valid date
- `validateFutureDate(date)` - Date in future
- `validatePastDate(date)` - Date in past
- `validateTickerSymbol(ticker)` - Stock/crypto ticker
- `validateRequired(value)` - Required field
- `validateInterestRate(rate)` - 0-100% range
- `validateDateRange(start, end)` - Start before end
- `validateAccountsDifferent(from, to)` - Different accounts

### 2. Sanitization (`utils/sanitization.ts`)

Always sanitize user input to prevent XSS attacks:

```typescript
import {
  sanitizeString,
  sanitizeMerchantName,
  sanitizeNumber
} from './utils/sanitization';

// Example usage
const safeName = sanitizeString(userInput);
const safeMerchant = sanitizeMerchantName(merchantName);
```

**Available Sanitizers:**
- `sanitizeString(input)` - Remove HTML, escape special chars
- `sanitizeMerchantName(name)` - Clean for URL generation
- `sanitizeNumber(value)` - Safe number parsing
- `sanitizeUrl(url)` - Validate and sanitize URLs
- `truncateString(str, maxLength)` - Truncate safely

### 3. Helpers (`utils/helpers.ts`)

```typescript
import {
  generateUniqueId,
  calculateDebtPayoff,
  generateLogoUrl,
  debounce,
  safeLocalStorageSet
} from './utils/helpers';

// Generate unique IDs (fixes collision bug)
const id = generateUniqueId();

// Safe debt calculation (prevents NaN crash)
const { label, value } = calculateDebtPayoff(
  balance,
  interestRate,
  minPayment,
  promotionalOffer
);

// Generate safe logo URLs (prevents XSS)
const logoUrl = generateLogoUrl(merchantName);

// Debounce expensive operations
const debouncedSave = debounce(saveToDatabase, 500);

// Safe localStorage operations
const success = safeLocalStorageSet('key', data);
```

### 4. Constants (`utils/constants.ts`)

Use shared constants instead of duplicating values:

```typescript
import {
  FORM_INPUT_STYLES,
  LABEL_STYLES,
  getCurrencySymbol,
  CURRENCIES
} from './utils/constants';

// Form styling
<input className={FORM_INPUT_STYLES} />
<label className={LABEL_STYLES}>Amount</label>

// Currency symbols
const symbol = getCurrencySymbol('GBP'); // £
```

---

## Shared Components

### Modal Component

Use the shared Modal instead of creating new ones:

```typescript
import Modal from './components/shared/Modal';

<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Add Transaction"
  className="max-w-lg" // Optional
>
  {/* Modal content */}
</Modal>
```

**Features:**
- ✅ Keyboard navigation (Tab, Shift+Tab)
- ✅ Escape key to close
- ✅ Focus trapping
- ✅ Click outside to close
- ✅ ARIA labels for accessibility
- ✅ Auto-focus first element

### Error Boundary

Wrap components to prevent crashes:

```typescript
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## Form Best Practices

### 1. Always Validate Input

```typescript
const handleSubmit = () => {
  // Validate all fields
  if (!validateRequired(name)) {
    setError('Name is required');
    return;
  }

  if (!validateEmail(email)) {
    setError('Invalid email format');
    return;
  }

  if (!validateAmount(amount)) {
    setError('Amount must be positive');
    return;
  }

  // Sanitize before saving
  const safeName = sanitizeString(name);
  const safeAmount = sanitizeNumber(amount);

  // Save to database
  saveData({ name: safeName, amount: safeAmount });
};
```

### 2. Use Shared Styles

```typescript
import { FORM_INPUT_STYLES, LABEL_STYLES } from './utils/constants';

<div>
  <label htmlFor="email" className={LABEL_STYLES}>
    Email
  </label>
  <input
    id="email"
    type="email"
    className={FORM_INPUT_STYLES}
  />
</div>
```

### 3. Add Loading States

```typescript
const [loading, setLoading] = useState(false);

const handleSave = async () => {
  setLoading(true);
  try {
    await saveToDatabase(data);
  } finally {
    setLoading(false);
  }
};

<button disabled={loading}>
  {loading ? 'Saving...' : 'Save'}
</button>
```

### 4. Add ARIA Labels

```typescript
<button
  onClick={handleDelete}
  aria-label="Delete transaction"
>
  <DeleteIcon />
</button>
```

---

## Security Checklist

### ✅ Always Do:
1. **Validate** all user input with validation utilities
2. **Sanitize** all user input before displaying/storing
3. **Use environment variables** for API keys
4. **Enable RLS** on all Supabase tables
5. **Escape** special characters in dynamic content
6. **Validate** URLs before using them
7. **Check authentication** before database operations

### ❌ Never Do:
1. Don't hardcode API keys
2. Don't trust user input
3. Don't use `dangerouslySetInnerHTML`
4. Don't skip validation
5. Don't expose sensitive data in client code
6. Don't create SQL injection vulnerabilities
7. Don't bypass RLS policies

---

## Performance Tips

### 1. Debounce Expensive Operations

```typescript
import { debounce } from './utils/helpers';

const debouncedSearch = debounce((query) => {
  searchDatabase(query);
}, 500);
```

### 2. Memoize Expensive Calculations

```typescript
const expensiveValue = useMemo(() => {
  return calculateComplexValue(data);
}, [data]);
```

### 3. Use Callbacks for Event Handlers

```typescript
const handleClick = useCallback(() => {
  doSomething();
}, [dependencies]);
```

### 4. Cache API Responses

The market data service already implements caching:
```typescript
// Caches for 5 minutes automatically
const data = await fetchMarketData(['AAPL', 'TSLA']);
```

---

## Common Bugs & Solutions

### Bug #1: Transaction ID Collisions
**Problem:** Multiple items created in same millisecond get same ID
**Solution:** Use `generateUniqueId()` from utils/helpers

### Bug #2: Debt Calculation Crashes
**Problem:** Math.log returns NaN, crashing component
**Solution:** Use `calculateDebtPayoff()` from utils/helpers

### Bug #3: XSS via Merchant Names
**Problem:** Special characters in names break logo URLs or inject scripts
**Solution:** Use `generateLogoUrl()` and `sanitizeString()`

### Bug #4: localStorage Quota Exceeded
**Problem:** App breaks when storage is full
**Solution:** Use `safeLocalStorageSet()` from utils/helpers

---

## Testing Guidelines

### Manual Testing Checklist:
- [ ] Test all form validations
- [ ] Test modal keyboard navigation
- [ ] Test error boundary with intentional error
- [ ] Test with missing API key
- [ ] Test with localStorage disabled
- [ ] Test with long merchant names
- [ ] Test debt calculations with edge cases
- [ ] Test market data caching
- [ ] Test XSS prevention

### Edge Cases to Test:
1. **Empty inputs** - All forms should validate
2. **Very large numbers** - Should handle without crashing
3. **Special characters** - Should be sanitized
4. **Negative numbers** - Should be rejected for amounts
5. **Future dates** - Should be validated where needed
6. **Past dates** - Should be validated where needed
7. **Interest rate > 100%** - Should be rejected
8. **Division by zero** - Should be handled gracefully

---

## Environment Variables

### Required:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Optional:
```env
VITE_MARKET_DATA_API_KEY=your_api_key
```

Get free API key from: https://financialmodelingprep.com

---

## Troubleshooting

### Build Errors

**"Cannot find module '@supabase/supabase-js'"**
```bash
npm install @supabase/supabase-js
```

**"Module not found: Can't resolve './utils/validation'"**
- Check that all utility files exist in the `utils/` directory

### Runtime Errors

**"Missing Supabase environment variables"**
- Check `.env` file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

**"Row Level Security policy violation"**
- User must be authenticated
- Check RLS policies on Supabase table

**"localStorage quota exceeded"**
- Use `safeLocalStorageSet()` which handles this gracefully

---

## Code Review Checklist

Before committing code, ensure:
- [ ] All user inputs are validated
- [ ] All user inputs are sanitized
- [ ] No hardcoded API keys or secrets
- [ ] Shared components used (Modal, constants)
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] ARIA labels on icon buttons
- [ ] TypeScript types used (no `any`)
- [ ] Comments explain complex logic
- [ ] No console.logs in production code
- [ ] Build succeeds (`npm run build`)

---

## Getting Help

### Resources:
- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **TypeScript Docs:** https://www.typescriptlang.org/docs
- **Vite Docs:** https://vitejs.dev

### Key Files to Reference:
- `CODE_REVIEW_AUDIT.md` - Full audit findings
- `IMPLEMENTATION_SUMMARY.md` - What's been implemented
- `types.ts` - TypeScript type definitions
- `utils/` - All utility functions

---

## Future Improvements

See `CODE_REVIEW_AUDIT.md` Section 10 for complete list of remaining work:
1. Integrate Modal component into all pages
2. Add loading states throughout
3. Connect components to Supabase
4. Complete accessibility improvements
5. Add unit tests
6. Implement data migration
7. Add CSV export functionality
8. Virtualize long lists
9. Code splitting for bundle size

---

**Last Updated:** October 14, 2025
