# Component Integration Guide

This guide shows how to integrate all improvements (Modal, validation, Supabase, loading states, accessibility) into each component.

---

## New Files Created

1. **`services/database.ts`** - Complete Supabase service layer
2. **`components/shared/LoadingSpinner.tsx`** - Loading components

---

## Integration Pattern

Every component should follow this pattern:

### 1. Import Required Utilities

```typescript
import Modal from './shared/Modal';
import LoadingSpinner, { LoadingInline } from './shared/LoadingSpinner';
import { validateRequired, validateEmail, validateAmount } from '../utils/validation';
import { sanitizeString, sanitizeNumber } from '../utils/sanitization';
import { generateUniqueId } from '../utils/helpers';
import { FORM_INPUT_STYLES, LABEL_STYLES } from '../utils/constants';

// Import relevant service
import { transactionsService, assetsService, etc } from '../services/database';
```

### 2. Add Loading States

```typescript
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### 3. Replace Custom Modals

**Before:**
```typescript
{isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-70...">
    <div className="bg-card-bg...">
      {/* content */}
    </div>
  </div>
)}
```

**After:**
```typescript
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Modal Title"
>
  {/* content */}
</Modal>
```

### 4. Add Validation to Forms

**Before:**
```typescript
const handleSubmit = () => {
  saveData(formData);
};
```

**After:**
```typescript
const handleSubmit = () => {
  setError(null);

  // Validate all fields
  if (!validateRequired(formData.name)) {
    setError('Name is required');
    return;
  }

  if (!validateEmail(formData.email)) {
    setError('Invalid email format');
    return;
  }

  if (!validateAmount(formData.amount)) {
    setError('Amount must be a positive number');
    return;
  }

  // Sanitize inputs
  const sanitizedData = {
    ...formData,
    name: sanitizeString(formData.name),
    amount: sanitizeNumber(formData.amount),
  };

  saveData(sanitizedData);
};
```

### 5. Connect to Supabase

**Before (localStorage):**
```typescript
const handleSave = (data) => {
  const updated = [...items, data];
  setItems(updated);
  localStorage.setItem('items', JSON.stringify(updated));
};
```

**After (Supabase):**
```typescript
const handleSave = async (data) => {
  setSaving(true);
  setError(null);

  try {
    const userId = 'current-user-id'; // Get from auth context
    const newItem = await itemsService.createItem(userId, data);
    setItems([...items, newItem]);
    setIsModalOpen(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to save');
    console.error('Error saving:', err);
  } finally {
    setSaving(false);
  }
};

// Load data on mount
useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const userId = 'current-user-id';
      const data = await itemsService.getItems(userId);
      setItems(data);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, []);
```

### 6. Add ARIA Labels

**Before:**
```typescript
<button onClick={handleDelete}>
  <TrashIcon className="w-5 h-5" />
</button>
```

**After:**
```typescript
<button
  onClick={handleDelete}
  aria-label="Delete item"
  className="hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary rounded"
>
  <TrashIcon className="w-5 h-5" />
</button>
```

### 7. Add Loading UI

**While loading:**
```typescript
if (loading) {
  return <LoadingInline message="Loading transactions..." />;
}

if (error) {
  return (
    <div className="text-center py-8">
      <p className="text-red-400 mb-4">{error}</p>
      <button onClick={retry} className="text-primary hover:underline">
        Try Again
      </button>
    </div>
  );
}
```

**In buttons:**
```typescript
<button
  onClick={handleSave}
  disabled={saving}
  className="..."
>
  {saving ? (
    <>
      <ButtonLoading />
      Saving...
    </>
  ) : (
    'Save'
  )}
</button>
```

---

## Component-Specific Implementations

### Dashboard.tsx

**Changes needed:**
1. ✅ Replace `ProfileModal` with shared `Modal`
2. ✅ Add email validation to profile edit
3. ✅ Add sanitization to name/username inputs
4. ✅ Connect to `userService` and `notificationsService`
5. ✅ Add loading state for notifications
6. ✅ Add ARIA labels to notification bell, profile button
7. ✅ Add error handling for failed updates

**Example:**
```typescript
import Modal from './shared/Modal';
import { validateEmail, validateRequired } from '../utils/validation';
import { sanitizeString } from '../utils/sanitization';
import { userService } from '../services/database';

// In ProfileModal replacement:
<Modal
  isOpen={isProfileOpen}
  onClose={() => setIsProfileOpen(false)}
  title="Profile"
>
  {/* Profile form with validation */}
</Modal>

// Validation in handleSave:
if (!validateRequired(formData.name)) {
  setError('Name is required');
  return;
}

if (!validateEmail(formData.email)) {
  setError('Invalid email format');
  return;
}

// Sanitize before save:
const sanitizedData = {
  ...formData,
  name: sanitizeString(formData.name),
  username: sanitizeString(formData.username),
};

// Save to Supabase:
try {
  setSaving(true);
  await userService.updateUser(user.id, sanitizedData);
  onUpdateUser(sanitizedData);
} catch (err) {
  setError('Failed to update profile');
} finally {
  setSaving(false);
}
```

---

### Transactions.tsx

**Changes needed:**
1. Replace modal with shared `Modal`
2. Add validation:
   - `validateRequired` for merchant, category
   - `validateAmount` for amount
   - `validateDate` for date
   - `validateTickerSymbol` for investment tickers
3. Add sanitization to all inputs
4. Connect to `transactionsService`
5. Add loading states for fetch/save
6. Add ARIA label to "Add Transaction" button
7. Add error messages for failed operations
8. Use `generateUniqueId()` for new transactions

**Validation example:**
```typescript
const handleSubmit = () => {
  setError(null);

  if (!validateRequired(formData.merchant)) {
    setError('Merchant name is required');
    return;
  }

  if (!validateAmount(formData.amount)) {
    setError('Amount must be a positive number');
    return;
  }

  if (formData.type === 'investing' && !validateTickerSymbol(formData.ticker)) {
    setError('Invalid ticker symbol (use 1-5 uppercase letters)');
    return;
  }

  // Continue with save...
};
```

---

### Accounts.tsx

**Changes needed:**
1. Replace modal with shared `Modal`
2. Add validation:
   - `validateRequired` for name
   - `validateAmount` for balance
   - `validateInterestRate` for interest rate (0-100%)
3. Add sanitization
4. Connect to `assetsService`
5. Add loading for market data fetch
6. Add error handling for API failures
7. Memoize investment balance calculation
8. Add ARIA labels to edit/delete buttons

**Interest rate validation:**
```typescript
if (!validateInterestRate(formData.interestRate)) {
  setError('Interest rate must be between 0% and 100%');
  return;
}
```

---

### Debts.tsx

**Changes needed:**
1. Replace modal with shared `Modal`
2. Add validation:
   - `validateRequired` for name
   - `validateAmount` for balance, min payment
   - `validateInterestRate` for APR
3. Use `calculateDebtPayoff` from helpers (fixes NaN bug)
4. Connect to `debtsService`
5. Add loading states
6. Add confirmation modal for status changes
7. Add ARIA labels

**Use safe calculation:**
```typescript
import { calculateDebtPayoff } from '../utils/helpers';

const { label, value } = calculateDebtPayoff(
  debt.balance,
  debt.interestRate,
  debt.minPayment,
  debt.promotionalOffer
);
// Returns safe value, never NaN
```

---

### Goals.tsx

**Changes needed:**
1. Replace modal with shared `Modal`
2. Add validation:
   - `validateRequired` for name
   - `validateAmount` for target amount
   - `validateFutureDate` for target date
   - `validatePercentage` for allocations (total = 100%)
3. Add validation for allocation percentages summing to 100%
4. Connect to `goalsService`
5. Add loading states
6. Add ARIA labels to progress bars

**Allocation validation:**
```typescript
const totalAllocation = allocations.reduce((sum, a) => sum + a.percentage, 0);

if (Math.abs(totalAllocation - 100) > 0.01) {
  setError('Allocations must total 100%');
  return;
}
```

---

### Bills.tsx

**Changes needed:**
1. Replace modal with shared `Modal`
2. Add validation:
   - `validateRequired` for name
   - `validateAmount` for amount
   - `validateDate` for due date
3. Connect to `billsService`
4. Add loading states
5. Use `generateLogoUrl` helper (fixes XSS)
6. Add ARIA labels

**Safe logo generation:**
```typescript
import { generateLogoUrl } from '../utils/helpers';

const logoUrl = generateLogoUrl(bill.name);
// Returns sanitized URL, prevents XSS
```

---

### Recurring.tsx

**Changes needed:**
1. Replace modal with shared `Modal`
2. Add validation:
   - `validateRequired` for name
   - `validateAmount` for amount
   - `validateDate` for start date
   - `validateDateRange` if end date exists
   - `validateAccountsDifferent` for transfers
3. Connect to `recurringPaymentsService`
4. Add loading states
5. Add ARIA labels

**Account validation:**
```typescript
if (formData.type === 'Transfer' &&
    !validateAccountsDifferent(formData.fromAccountId, formData.toAccountId)) {
  setError('Transfer accounts must be different');
  return;
}
```

---

### Settings.tsx

**Changes needed:**
1. Replace modal with shared `Modal` (if used)
2. Add validation for email format
3. Connect to `settingsService`
4. Add loading states for save operations
5. Add confirmation for destructive actions
6. Add ARIA labels to toggle switches

---

### Categorize.tsx

**Changes needed:**
1. Keep existing swipe UI (it's already good)
2. Add validation when creating rules
3. Connect to `categoriesService` and `transactionRules`
4. Add loading states
5. Use `sanitizeString` for category/merchant names
6. Add ARIA labels to swipe cards

---

## Testing Checklist

After updating each component:

- [ ] Modal opens/closes correctly with Escape key
- [ ] All form validations show appropriate errors
- [ ] Data saves to Supabase successfully
- [ ] Data loads from Supabase on mount
- [ ] Loading spinners display during operations
- [ ] Error messages display for failed operations
- [ ] ARIA labels present on icon buttons
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] No console errors
- [ ] TypeScript compiles without errors

---

## Common Issues & Solutions

### Issue: "Cannot read property 'id' of undefined"
**Solution:** Check that user is authenticated and ID exists before database calls

### Issue: "RLS policy violation"
**Solution:** Ensure user_id matches authenticated user in all operations

### Issue: Validation not working
**Solution:** Check validation is called before sanitization, not after

### Issue: Modal doesn't close with Escape
**Solution:** Ensure using shared Modal component, not custom one

### Issue: Loading state never clears
**Solution:** Always use try/finally to clear loading state

---

## Quick Reference: Imports Needed

```typescript
// Shared components
import Modal from './shared/Modal';
import LoadingSpinner, { LoadingInline, ButtonLoading } from './shared/LoadingSpinner';

// Validation
import {
  validateRequired,
  validateEmail,
  validateAmount,
  validatePercentage,
  validateDate,
  validateFutureDate,
  validateDateRange,
  validateTickerSymbol,
  validateInterestRate,
  validateAccountsDifferent,
} from '../utils/validation';

// Sanitization
import {
  sanitizeString,
  sanitizeNumber,
  sanitizeMerchantName,
} from '../utils/sanitization';

// Helpers
import {
  generateUniqueId,
  calculateDebtPayoff,
  generateLogoUrl,
  debounce,
} from '../utils/helpers';

// Constants
import {
  FORM_INPUT_STYLES,
  LABEL_STYLES,
  getCurrencySymbol,
} from '../utils/constants';

// Database services (import as needed)
import {
  userService,
  assetsService,
  debtsService,
  transactionsService,
  goalsService,
  billsService,
  recurringPaymentsService,
  categoriesService,
  budgetService,
  notificationsService,
  settingsService,
} from '../services/database';
```

---

## Next Steps

1. Update Dashboard.tsx (most complex, template for others)
2. Update Transactions.tsx (high priority, most used)
3. Update Accounts.tsx (high priority)
4. Update Debts.tsx (critical bug fix needed)
5. Update Goals.tsx
6. Update Bills.tsx
7. Update Recurring.tsx
8. Update Settings.tsx
9. Update Categorize.tsx (minimal changes needed)
10. Test all components thoroughly
11. Run production build
12. Deploy

---

**Estimated time per component:** 1-2 hours
**Total estimated time:** 12-16 hours of development work
