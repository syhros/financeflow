import React, { useState, useRef } from 'react';
import { Asset } from '../types';

interface CSVImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: any[], selectedAccountId: string) => void;
  assets: Asset[];
  onCreateAsset?: (asset: any) => Promise<{ id: string; [key: string]: any }>;
  onCreateDebt?: (debt: any) => Promise<{ id: string; [key: string]: any }>;
}

interface ColumnMapping {
  [key: string]: number | null;
}

const BANKING_FIELDS = ['date', 'merchant', 'category', 'amount', 'debit_amount', 'credit_amount', 'source_account', 'recipient_account', 'logo'];
const INVESTMENT_FIELDS = ['date', 'action', 'ticker', 'name', 'shares', 'price_per_share', 'currency_price', 'exchange_rate', 'total', 'currency_total'];

const CSVImportPreviewModal: React.FC<CSVImportPreviewModalProps> = ({ isOpen, onClose, onImport, assets, onCreateAsset, onCreateDebt }) => {
  const [mode, setMode] = useState<'banking' | 'investments'>('banking');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'Checking' | 'Savings' | 'Investing'>('Checking');
  const [createdAccounts, setCreatedAccounts] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fieldsForMode = mode === 'banking' ? BANKING_FIELDS : INVESTMENT_FIELDS;
  const requiredFields = mode === 'banking'
    ? ['date', 'amount']
    : ['date', 'action', 'ticker', 'shares', 'total'];

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      date: 'Date',
      action: 'Action (Buy/Sell)',
      merchant: 'Merchant',
      category: 'Category',
      amount: 'Amount',
      debit_amount: 'Debit Amount',
      credit_amount: 'Credit Amount',
      source_account: 'Source Account',
      recipient_account: 'Recipient Account',
      logo: 'Logo',
      ticker: 'Ticker',
      name: 'Name',
      shares: 'Shares',
      price_per_share: 'Price / Share',
      currency_price: 'Currency (Price)',
      exchange_rate: 'Exchange Rate',
      total: 'Total',
      currency_total: 'Currency (Total)',
    };
    return labels[field] || field;
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const cells: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cells.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        cells.push(current.trim());
        return cells;
      }).filter(row => row.some(cell => cell)); // Filter out empty rows

      setCsvHeaders(headers);
      setCsvData(rows);
      initializeColumnMapping(headers);
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  const initializeColumnMapping = (headers: string[]) => {
    const mapping: ColumnMapping = {};
    fieldsForMode.forEach(field => {
      const headerIndex = headers.findIndex(h =>
        h.toLowerCase().includes(field.toLowerCase()) ||
        field.toLowerCase().includes(h.toLowerCase())
      );
      mapping[field] = headerIndex >= 0 ? headerIndex : null;
    });
    setColumnMapping(mapping);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === 'text/csv' || file?.name.endsWith('.csv')) {
      handleFileSelect(file);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return;

    setIsCreatingAccount(true);
    try {
      const isDebtType = newAccountType === 'Credit Card' || newAccountType === 'Loan';
      const accountData = {
        name: newAccountName,
        type: newAccountType,
        balance: 0,
        status: 'Active' as const,
        lastUpdated: 'just now',
        accountType: isDebtType ? 'debt' : 'asset',
        icon: newAccountType === 'Credit Card' ? 'CreditCardIcon' : newAccountType === 'Loan' ? 'LoanIcon' : 'AccountsIcon',
        color: isDebtType ? 'bg-gray-700' : 'bg-green-500',
        ...(isDebtType && {
          interestRate: 0,
          minPayment: 0,
          originalBalance: 0,
        }),
        ...(!isDebtType && {
          interestRate: 0,
          holdings: [],
        }),
      };

      let createdAccount: any;
      if (isDebtType && onCreateDebt) {
        try {
          createdAccount = await onCreateDebt(accountData);
        } catch (e) {
          console.warn('Async callback failed, using temporary ID:', e);
          const tempId = `new:${newAccountName}:${newAccountType}`;
          createdAccount = { id: tempId, name: newAccountName, type: newAccountType };
        }
      } else if (!isDebtType && onCreateAsset) {
        try {
          createdAccount = await onCreateAsset(accountData);
        } catch (e) {
          console.warn('Async callback failed, using temporary ID:', e);
          const tempId = `new:${newAccountName}:${newAccountType}`;
          createdAccount = { id: tempId, name: newAccountName, type: newAccountType };
        }
      } else {
        const tempId = `new:${newAccountName}:${newAccountType}`;
        createdAccount = { id: tempId, name: newAccountName, type: newAccountType };
      }

      setCreatedAccounts(prev => [...prev, { id: createdAccount.id, name: newAccountName, type: newAccountType }]);
      setSelectedAccountId(createdAccount.id);
      setShowAccountCreation(false);
      setNewAccountName('');
    } catch (error) {
      console.error('Failed to create account:', error);
      alert('Failed to create account. Please try again.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const getColumnDisplay = (columnIndex: number) => {
    const mappedField = Object.entries(columnMapping).find(([_, idx]) => idx === columnIndex)?.[0];
    if (mappedField) {
      return <span className="font-bold text-white">{getFieldLabel(mappedField)}</span>;
    }
    return <span className="italic text-gray-400">{csvHeaders[columnIndex]}</span>;
  };

  const parseTransactions = () => {
    const transactions: any[] = [];

    csvData.forEach((row, rowIndex) => {
      const getValue = (field: string) => {
        const colIndex = columnMapping[field];
        return colIndex !== null && colIndex < row.length ? row[colIndex] : undefined;
      };

      try {
        if (mode === 'banking') {
          const date = getValue('date');
          const merchant = getValue('merchant') || 'Transfer';
          const category = getValue('category') || 'Uncategorized';
          const debitAmount = parseFloat(getValue('debit_amount') || '0');
          const creditAmount = parseFloat(getValue('credit_amount') || '0');
          const amount = parseFloat(getValue('amount') || '0');
          const sourceAccount = getValue('source_account');
          const recipientAccount = getValue('recipient_account');
          const logo = getValue('logo') || '';

          if (!date) return;

          let finalAmount = amount;
          let finalType: 'income' | 'expense' | 'transfer' = 'expense';

          if (debitAmount > 0 || creditAmount > 0) {
            if (debitAmount > 0 && creditAmount > 0) {
              finalType = 'transfer';
              finalAmount = Math.max(debitAmount, creditAmount);
            } else if (creditAmount > 0) {
              finalType = 'income';
              finalAmount = creditAmount;
            } else {
              finalType = 'expense';
              finalAmount = debitAmount;
            }
          } else if (!finalAmount) {
            return;
          }

          if (sourceAccount && recipientAccount) {
            finalType = 'transfer';
          } else if (!sourceAccount && recipientAccount) {
            finalType = 'income';
          }

          transactions.push({
            id: `import-${rowIndex}`,
            date,
            merchant,
            category,
            amount: Math.abs(finalAmount),
            type: finalType,
            logo,
            sourceAccount: sourceAccount || undefined,
            recipientAccount: recipientAccount || undefined,
            accountId: sourceAccount || recipientAccount || selectedAccountId,
          });
        } else {
          const date = getValue('date');
          const action = getValue('action');
          const ticker = getValue('ticker');
          const name = getValue('name');
          const shares = parseFloat(getValue('shares') || '0');
          const pricePerShare = parseFloat(getValue('price_per_share') || '0');
          const currencyPrice = getValue('currency_price') || 'GBP';
          const exchangeRate = parseFloat(getValue('exchange_rate') || '1');
          const total = parseFloat(getValue('total') || '0');
          const currencyTotal = getValue('currency_total') || 'GBP';

          if (!date || !action || !ticker || (!shares && !action.toLowerCase().includes('dividend')) || (!total && !action.toLowerCase().includes('dividend'))) return;

          const isDividend = action.toLowerCase().includes('dividend');
          const isBuy = action.toLowerCase().includes('buy');
          const purchasePrice = isDividend ? 0 : (pricePerShare || (total / shares));

          transactions.push({
            id: `import-${rowIndex}`,
            date,
            action: isDividend ? 'dividend' : (isBuy ? 'buy' : 'sell'),
            ticker,
            name: name || ticker,
            shares: isDividend ? 0 : (isBuy ? shares : -shares),
            pricePerShare: purchasePrice,
            currencyPrice,
            exchangeRate,
            total,
            currencyTotal,
            type: 'investing',
            amount: total,
            accountId: selectedAccountId,
            merchant: isDividend ? `DIVIDEND ${ticker}` : `${isBuy ? 'BUY' : 'SELL'} ${shares} × ${ticker}`,
            category: 'Investments',
            logo: '',
          });
        }
      } catch (error) {
        console.error(`Error parsing row ${rowIndex}:`, error);
      }
    });

    return transactions;
  };

  const handleImport = () => {
    const transactions = parseTransactions();
    if (transactions.length === 0) {
      alert('No valid transactions found in CSV');
      return;
    }
    onImport(transactions, selectedAccountId);
    handleClose();
  };

  const handleClose = () => {
    setCreatedAccounts([]);
    setSelectedAccountId('');
    setStep('upload');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={handleClose}>
      <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-border-color" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 flex justify-between items-center p-4 border-b border-border-color bg-card-bg z-10">
          <h2 className="text-xl font-bold text-white">Import CSV Data</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {step === 'upload' && (
            <div>
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-300 mb-2 block">Import Type</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setMode('banking')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      mode === 'banking'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Banking
                  </button>
                  <button
                    onClick={() => setMode('investments')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      mode === 'investments'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Investments
                  </button>
                </div>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-2">
                  <p className="text-white font-semibold">Drag and drop your CSV file here</p>
                  <p className="text-gray-400 text-sm">or click to browse</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-3 block">Map CSV Columns to Fields</label>
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  {fieldsForMode.map(field => {
                    const isRequired = requiredFields.includes(field);
                    return (
                      <div key={field} className={isRequired ? 'ring-1 ring-blue-500/50 rounded-lg p-3' : ''}>
                        <label className={`text-xs font-semibold mb-1 block ${isRequired ? 'text-blue-400' : 'text-gray-400'}`}>
                          {getFieldLabel(field)} {isRequired && '*'}
                        </label>
                        <select
                          value={columnMapping[field] ?? ''}
                          onChange={e => setColumnMapping({
                            ...columnMapping,
                            [field]: e.target.value ? parseInt(e.target.value) : null
                          })}
                          className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 outline-none text-sm"
                        >
                          <option value="">-- Skip --</option>
                          {csvHeaders.map((_, i) => (
                            <option key={i} value={i}>{i}: {csvHeaders[i]}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">CSV Preview (first 10 rows of {csvData.length} total)</h3>
                <div className="overflow-x-auto bg-gray-800 rounded-lg border border-gray-700">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-700 bg-gray-900">
                        <th className="px-3 py-2 text-left text-gray-400 font-normal">#</th>
                        {csvHeaders.map((_, colIdx) => (
                          <th key={colIdx} className="px-3 py-2 text-left text-gray-400 font-normal whitespace-nowrap">
                            {getColumnDisplay(colIdx)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 10).map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="px-3 py-2 text-gray-500">{rowIdx + 1}</td>
                          {row.map((cell, colIdx) => (
                            <td key={colIdx} className="px-3 py-2 text-gray-300 max-w-xs truncate">
                              {cell || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-300 block">Select Account</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {assets.map(asset => (
                    <label key={asset.id} className={`flex items-center p-3 rounded-lg cursor-pointer border transition-all ${
                      selectedAccountId === asset.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                    }`}>
                      <input
                        type="radio"
                        name="account"
                        value={asset.id}
                        checked={selectedAccountId === asset.id}
                        onChange={() => setSelectedAccountId(asset.id)}
                        className="h-4 w-4"
                      />
                      <span className="ml-3 text-white">{asset.name} ({asset.type})</span>
                    </label>
                  ))}
                  {createdAccounts.map(account => (
                    <label key={account.id} className={`flex items-center p-3 rounded-lg cursor-pointer border transition-all ${
                      selectedAccountId === account.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-green-700 bg-green-900/20 hover:bg-green-900/30'
                    }`}>
                      <input
                        type="radio"
                        name="account"
                        value={account.id}
                        checked={selectedAccountId === account.id}
                        onChange={() => setSelectedAccountId(account.id)}
                        className="h-4 w-4"
                      />
                      <span className="ml-3 text-white">{account.name} ({account.type}) - <span className="text-green-400 text-sm">new</span></span>
                    </label>
                  ))}
                </div>

                {showAccountCreation ? (
                  <div className="space-y-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <input
                      type="text"
                      placeholder="Account name"
                      value={newAccountName}
                      onChange={e => setNewAccountName(e.target.value)}
                      className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 outline-none text-sm"
                    />
                    <select
                      value={newAccountType}
                      onChange={e => setNewAccountType(e.target.value as 'Checking' | 'Savings' | 'Investing')}
                      className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 outline-none text-sm"
                    >
                      <option>Checking</option>
                      <option>Savings</option>
                      <option>Investing</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateAccount}
                        disabled={isCreatingAccount}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingAccount ? 'Creating...' : 'Create'}
                      </button>
                      <button
                        onClick={() => setShowAccountCreation(false)}
                        disabled={isCreatingAccount}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAccountCreation(true)}
                    className="w-full text-blue-400 hover:text-blue-300 text-sm font-medium py-2"
                  >
                    + Create New Account
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('upload')}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    const missingRequired = requiredFields.filter(f => columnMapping[f] === null);
                    if (missingRequired.length > 0) {
                      alert(`Please map required fields: ${missingRequired.map(f => getFieldLabel(f)).join(', ')}`);
                      return;
                    }
                    if (!selectedAccountId) {
                      alert('Please select or create an account');
                      return;
                    }
                    setStep('preview');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium"
                >
                  Preview Import
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Import Preview ({parseTransactions().length} transactions)</h3>
                <div className="bg-gray-800 rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                  {parseTransactions().slice(0, 10).map((tx, idx) => (
                    <div key={idx} className="border border-gray-700 rounded p-3 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span className="font-medium text-white">{tx.merchant}</span>
                        <span className={tx.type === 'income' || tx.action === 'buy' ? 'text-green-400' : 'text-red-400'}>
                          {tx.type === 'income' ? '+' : tx.action === 'sell' ? '-' : ''}£{tx.amount.toFixed(2)}
                        </span>
                      </div>
                      {mode === 'banking' && (
                        <div className="text-xs text-gray-500 mt-1">
                          {tx.date} • {tx.category} • {tx.type}
                        </div>
                      )}
                      {mode === 'investments' && (
                        <div className="text-xs text-gray-500 mt-1">
                          {tx.date} • {tx.shares} shares @ £{tx.pricePerShare.toFixed(2)} ({tx.currencyPrice})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('mapping')}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-medium"
                >
                  Import {parseTransactions().length} Transactions
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportPreviewModal;
