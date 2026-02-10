import React, { useState, useRef } from 'react';
import { Asset } from '../types';

interface CSVImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: any[], selectedAccountId: string) => void;
  assets: Asset[];
}

interface ColumnMapping {
  [key: string]: number | null;
}

const BANKING_FIELDS = ['date', 'merchant', 'category', 'amount', 'source_account', 'recipient_account', 'logo'];
const INVESTMENT_FIELDS = ['date', 'ticker', 'shares', 'purchase_price', 'source_account', 'type', 'amount'];

const CSVImportPreviewModal: React.FC<CSVImportPreviewModalProps> = ({ isOpen, onClose, onImport, assets }) => {
  const [mode, setMode] = useState<'banking' | 'investments'>('banking');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAccountCreation, setShowAccountCreation] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<'Checking' | 'Savings' | 'Investing'>('Checking');
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fieldsForMode = mode === 'banking' ? BANKING_FIELDS : INVESTMENT_FIELDS;
  const requiredFields = mode === 'banking'
    ? ['date', 'amount', 'source_account']
    : ['date', 'ticker', 'shares', 'source_account', 'type', 'amount'];

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const rows = lines.slice(1, 16).map(line => line.split(',').map(cell => cell.trim()));

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
        h.includes(field.toLowerCase()) ||
        field.toLowerCase().includes(h)
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

  const handleCreateAccount = () => {
    if (!newAccountName.trim()) return;
    // Account will be created in App.tsx
    setSelectedAccountId(`new:${newAccountName}:${newAccountType}`);
    setShowAccountCreation(false);
    setNewAccountName('');
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
          const amount = parseFloat(getValue('amount') || '0');
          const sourceAccount = getValue('source_account');
          const recipientAccount = getValue('recipient_account');
          const logo = getValue('logo') || '';

          if (!date || !amount) return;

          let type: 'income' | 'expense' | 'transfer' = 'expense';
          if (sourceAccount && recipientAccount) {
            type = 'transfer';
          } else if (!sourceAccount && recipientAccount) {
            type = 'income';
          }

          transactions.push({
            id: `import-${rowIndex}`,
            date,
            merchant,
            category,
            amount: Math.abs(amount),
            type,
            logo,
            sourceAccount: sourceAccount || undefined,
            recipientAccount: recipientAccount || undefined,
            accountId: sourceAccount || recipientAccount || selectedAccountId,
          });
        } else {
          const date = getValue('date');
          const ticker = getValue('ticker');
          const shares = parseFloat(getValue('shares') || '0');
          const purchasePrice = parseFloat(getValue('purchase_price') || '0');
          const sourceAccount = getValue('source_account');
          const transactionType = getValue('type') || 'buy';
          const amount = parseFloat(getValue('amount') || '0');

          if (!date || !ticker || !shares) return;

          transactions.push({
            id: `import-${rowIndex}`,
            date,
            ticker,
            shares,
            purchasePrice: purchasePrice || (amount / shares),
            type: 'investing',
            amount: amount || (shares * purchasePrice),
            sourceAccount: sourceAccount || selectedAccountId,
            accountId: selectedAccountId,
            merchant: `${transactionType.toUpperCase()} ${ticker}`,
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border-color" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 flex justify-between items-center p-4 border-b border-border-color bg-card-bg z-10">
          <h2 className="text-xl font-bold text-white">Import CSV Data</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
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
                  <div className="mt-4 text-left bg-gray-800 rounded p-4">
                    <p className="text-xs text-gray-300 font-semibold mb-2">Expected Columns ({mode}):</p>
                    <p className="text-xs text-gray-400">{fieldsForMode.join(', ')}</p>
                  </div>
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
            <div>
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-300 mb-3 block">Map CSV Columns to Fields</label>
                <div className="grid grid-cols-2 gap-4">
                  {fieldsForMode.map(field => (
                    <div key={field}>
                      <label className="text-xs text-gray-400 mb-1 block capitalize">{field.replace('_', ' ')}</label>
                      <select
                        value={columnMapping[field] ?? ''}
                        onChange={e => setColumnMapping({
                          ...columnMapping,
                          [field]: e.target.value ? parseInt(e.target.value) : null
                        })}
                        className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 outline-none text-sm"
                      >
                        <option value="">-- Skip --</option>
                        {csvData.length > 0 && Array.from({ length: csvData[0].length }).map((_, i) => (
                          <option key={i} value={i}>{i}: {csvData[0][i]}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Preview (First {csvData.length} rows)</h3>
                <div className="overflow-x-auto bg-gray-800 rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="px-3 py-2 text-left text-gray-400">#</th>
                        {fieldsForMode.map(field => (
                          <th key={field} className="px-3 py-2 text-left text-gray-400 capitalize whitespace-nowrap">
                            {field.replace('_', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="px-3 py-2 text-gray-500">{rowIdx + 1}</td>
                          {fieldsForMode.map(field => {
                            const colIdx = columnMapping[field];
                            return (
                              <td key={field} className="px-3 py-2 text-gray-300 max-w-xs truncate">
                                {colIdx !== null && colIdx < row.length ? row[colIdx] : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <label className="text-sm font-semibold text-gray-300 block">Select Account</label>
                <div className="space-y-2">
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
                </div>

                {showAccountCreation ? (
                  <div className="space-y-2 p-3 bg-gray-800 rounded-lg">
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
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-sm font-medium"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => setShowAccountCreation(false)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm font-medium"
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

              <div className="mt-6 flex gap-3">
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
                      alert(`Please map required fields: ${missingRequired.join(', ')}`);
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
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Import Preview</h3>
              <div className="bg-gray-800 rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                {parseTransactions().slice(0, 10).map((tx, idx) => (
                  <div key={idx} className="border border-gray-700 rounded p-3 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span className="font-medium text-white">{tx.merchant}</span>
                      <span className={tx.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                        {tx.type === 'income' ? '+' : '-'}£{tx.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tx.date} • {tx.category} • {tx.type}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-3">
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
