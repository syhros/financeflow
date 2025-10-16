import React, { useState, useEffect } from 'react';
import Card from './Card';
import { Category, Currency, Asset, Debt, TransactionRule, Transaction } from '../types';
import { PlusIcon, CloseIcon, PencilIcon, TrashIcon, ShoppingBagIcon, GiftIcon, FilmIcon, CloudIcon, WrenchScrewdriverIcon, BanknotesIcon, HomeModernIcon, CarIcon, RefreshIcon, LightBulbIcon, iconMap } from './icons';
import { useCurrency } from '../App';

interface SettingsProps {
    categories: Category[];
    onAddCategory: (category: Omit<Category, 'id'>) => void;
    onUpdateCategory: (category: Category) => void;
    onDeleteCategory: (categoryId: string) => void;
    rules: TransactionRule[];
    onAddRule: (rule: Omit<TransactionRule, 'id'>) => void;
    onDeleteRule: (ruleId: string) => void;
    onWipeData: (option: string) => void;
    notificationsEnabled: boolean;
    onToggleNotifications: () => void;
    autoCategorize: boolean;
    onToggleAutoCategorize: () => void;
    smartSuggestions: boolean;
    onToggleSmartSuggestions: () => void;
    assets: Asset[];
    debts: Debt[];
    onImportTransactions: (transactions: Transaction[]) => void;
    onAddAsset: (asset: Omit<Asset, 'id'>) => void;
    onAddDebt: (debt: Omit<Debt, 'id'>) => void;
}

const availableIcons = [
    { name: 'ShoppingBagIcon', component: ShoppingBagIcon }, { name: 'GiftIcon', component: GiftIcon },
    { name: 'FilmIcon', component: FilmIcon }, { name: 'CloudIcon', component: CloudIcon },
    { name: 'WrenchScrewdriverIcon', component: WrenchScrewdriverIcon }, { name: 'BanknotesIcon', component: BanknotesIcon },
    { name: 'HomeModernIcon', component: HomeModernIcon }, { name: 'CarIcon', component: CarIcon },
    { name: 'RefreshIcon', component: RefreshIcon },
];

const availableColors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500',
    'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

const ManageCategoriesModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onAddCategory: (category: Omit<Category, 'id'>) => void;
    onUpdateCategory: (category: Category) => void;
    onDeleteCategory: (categoryId: string) => void;
}> = ({ isOpen, onClose, categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
    const [editingCategory, setEditingCategory] = useState<Omit<Category, 'id'> | Category | null>(null);

    const handleStartAdding = () => {
        setEditingCategory({
            name: '',
            icon: availableIcons[0].name,
            color: availableColors[0]
        });
    };
    
    const handleSave = () => {
        if (!editingCategory || !editingCategory.name) return;
        if ('id' in editingCategory) {
            onUpdateCategory(editingCategory);
        } else {
            onAddCategory(editingCategory);
        }
        setEditingCategory(null);
    };
    
    if (!isOpen) return null;

    const commonInputStyles = "w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none transition-colors";
    const labelStyles = "block text-sm font-medium text-gray-300 mb-2";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-2xl border border-border-color overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border-color">
                    <h2 className="text-xl font-bold text-white">{editingCategory ? ('id' in editingCategory ? 'Edit Category' : 'Add Category') : 'Manage Categories'}</h2>
                    <button onClick={editingCategory ? () => setEditingCategory(null) : onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    {editingCategory ? (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className={labelStyles}>Category Name</label>
                                <input id="name" value={editingCategory.name} onChange={(e) => setEditingCategory(c => c ? {...c, name: e.target.value} : null)} className={commonInputStyles} />
                            </div>
                            <div>
                                <label className={labelStyles}>Icon</label>
                                <div className="grid grid-cols-9 gap-2 p-2 bg-gray-900 rounded-lg">
                                    {availableIcons.map(({ name, component: Icon }) => (
                                        <button key={name} onClick={() => setEditingCategory(c => c ? {...c, icon: name} : null)} className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all ${editingCategory.icon === name ? 'bg-primary text-white scale-110' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                                            <Icon className="w-6 h-6" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label className={labelStyles}>Color</label>
                                <div className="grid grid-cols-9 gap-2 p-2 bg-gray-900 rounded-lg">
                                    {availableColors.map(color => (
                                        <button key={color} onClick={() => setEditingCategory(c => c ? {...c, color} : null)} className={`w-12 h-12 rounded-lg ${color} ${editingCategory.color === color ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white' : ''}`} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setEditingCategory(null)} className="w-full py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors">Cancel</button>
                                <button onClick={handleSave} className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 transition-colors">Save Category</button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {categories.map(cat => {
                                const CatIcon = iconMap[cat.icon];
                                return (
                                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.color}`}>{CatIcon && <CatIcon className="w-5 h-5 text-white"/>}</div>
                                            <span className="font-semibold text-white">{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setEditingCategory(cat)} className="text-gray-400 hover:text-white"><PencilIcon className="w-5 h-5"/></button>
                                            <button onClick={() => onDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                )
                            })}
                            <button onClick={handleStartAdding} className="w-full flex items-center justify-center gap-2 py-3 mt-4 bg-primary/20 text-primary rounded-lg font-semibold hover:bg-primary/30 transition-colors">
                                <PlusIcon className="w-5 h-5" /> Add Custom Category
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TransactionRulesModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    rules: TransactionRule[];
    categories: Category[];
    onAddRule: (rule: Omit<TransactionRule, 'id'>) => void;
    onDeleteRule: (ruleId: string) => void;
}> = ({ isOpen, onClose, rules, categories, onAddRule, onDeleteRule }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [merchantName, setMerchantName] = useState('');
    const [categoryName, setCategoryName] = useState('');

    const handleAddRule = () => {
        if (keyword && (merchantName || categoryName)) {
            onAddRule({ keyword, merchantName: merchantName || undefined, categoryName: categoryName || undefined });
            setKeyword('');
            setMerchantName('');
            setCategoryName('');
            setShowAddForm(false);
        } else {
            alert('A rule must have a keyword and at least one action (set merchant or category).');
        }
    };
    
    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-3xl border border-border-color overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border-color">
                    <h2 className="text-xl font-bold text-white">Transaction Rules</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                    <div className="space-y-3">
                        {rules.map(rule => (
                            <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-2 text-sm flex-wrap">
                                    <span className="text-gray-400">If merchant contains</span>
                                    <span className="bg-gray-700 px-2 py-1 rounded-md font-mono text-primary">{rule.keyword}</span>
                                    <span className="text-gray-400">then</span>
                                    {rule.merchantName && (
                                        <>
                                            <span className="text-gray-400">set merchant to</span>
                                            <span className="bg-gray-700 px-2 py-1 rounded-md font-semibold text-white">{rule.merchantName}</span>
                                        </>
                                    )}
                                    {rule.categoryName && rule.merchantName && <span className="text-gray-400">&</span>}
                                    {rule.categoryName && (
                                        <>
                                            <span className="text-gray-400">set category to</span>
                                            <span className="bg-gray-700 px-2 py-1 rounded-md font-semibold text-white">{rule.categoryName}</span>
                                        </>
                                    )}
                                </div>
                                <button onClick={() => onDeleteRule(rule.id)} className="text-gray-400 hover:text-red-400 flex-shrink-0 ml-4"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                         {rules.length === 0 && !showAddForm && <p className="text-center text-gray-500 py-4">No rules created yet.</p>}
                    </div>
                    {showAddForm ? (
                        <div className="mt-4 pt-4 border-t border-border-color space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">If transaction merchant contains...</label>
                                <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Keyword (e.g., AMZN Mktp)" className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Set new Merchant Name (Optional)</label>
                                    <input value={merchantName} onChange={e => setMerchantName(e.target.value)} placeholder="e.g., Amazon" className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Set new Category (Optional)</label>
                                    <select value={categoryName} onChange={e => setCategoryName(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary"><option value="">Select Category</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setShowAddForm(false)} className="w-full py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-500">Cancel</button>
                                <button onClick={handleAddRule} className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500">Save Rule</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowAddForm(true)} className="w-full flex items-center justify-center gap-2 py-3 mt-4 bg-primary/20 text-primary rounded-lg font-semibold hover:bg-primary/30 transition-colors">
                            <PlusIcon className="w-5 h-5" /> Add New Rule
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
};


const WipeDataModal: React.FC<{ isOpen: boolean; onClose: () => void; onWipe: (option: string) => void; }> = ({ isOpen, onClose, onWipe }) => {
    const [step, setStep] = useState(1);
    const [selectedOption, setSelectedOption] = useState('');
    const [confirmText, setConfirmText] = useState('');

    const options = [
        { id: 'allTransactions', label: 'Delete all transactions', description: 'Removes every transaction record.' },
        { id: 'oldTransactions', label: 'Delete old transactions', description: 'Removes transactions older than 6 months.' },
        { id: 'resetAccounts', label: 'Reset all accounts', description: 'Sets all asset and debt balances to £0 (accounts remain).' },
        { id: 'deleteAndResetBalances', label: 'Delete transactions and reset balances', description: 'Deletes all transactions and sets all account balances to £0.' },
        { id: 'fullReset', label: 'Full factory reset', description: 'Wipes all data and resets the application completely.' },
    ];

    const handleNext = () => {
        if (selectedOption) setStep(2);
    };

    const handleWipe = () => {
        if (confirmText === 'DELETE') {
            onWipe(selectedOption);
            onClose();
        } else {
            alert('Confirmation text does not match.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-lg border border-border-color" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border-color">
                    <h2 className="text-xl font-bold text-white">Wipe and Reset Data</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="text-gray-300">Select an option below to permanently delete data. This action cannot be undone.</p>
                            {options.map(opt => (
                                <label key={opt.id} className={`flex items-center p-4 rounded-lg cursor-pointer transition-all ${selectedOption === opt.id ? 'bg-red-500/20 ring-2 ring-red-400' : 'bg-gray-800 hover:bg-gray-700'}`}>
                                    <input type="radio" name="wipe-option" value={opt.id} checked={selectedOption === opt.id} onChange={() => setSelectedOption(opt.id)} className="h-4 w-4 text-primary bg-gray-700 border-gray-600 focus:ring-primary" />
                                    <div className="ml-4">
                                        <p className="font-semibold text-white">{opt.label}</p>
                                        <p className="text-xs text-gray-400">{opt.description}</p>
                                    </div>
                                </label>
                            ))}
                            <button onClick={handleNext} disabled={!selectedOption} className="w-full py-3 mt-4 bg-red-600 text-white rounded-full font-semibold hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                                Next Step
                            </button>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-4 text-center">
                             <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full mx-auto flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-white">Are you absolutely sure?</h3>
                            <p className="text-gray-400">This will permanently delete the selected data. To confirm, please type <strong className="text-red-400">DELETE</strong> in the box below.</p>
                            <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)} className="w-full text-center bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-red-500 outline-none transition-colors" />
                            <div className="flex gap-4 pt-2">
                                <button onClick={() => setStep(1)} className="w-full py-3 bg-gray-600 text-white rounded-full font-semibold hover:bg-gray-500 transition-colors">Back</button>
                                <button onClick={handleWipe} disabled={confirmText !== 'DELETE'} className="w-full py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">Wipe Data</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const AccountMappingModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    accountName: string;
    onSaveNew: (name: string, type: string) => void;
    onSelectExisting: (accountId: string) => void;
    existingAccounts: (Asset | Debt)[];
}> = ({ isOpen, onClose, accountName, onSaveNew, onSelectExisting, existingAccounts }) => {
    const [name, setName] = useState(accountName);
    const [type, setType] = useState('Checking');
    const [selectedAccountId, setSelectedAccountId] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(accountName);
            setType('Checking');
            setSelectedAccountId('');
        }
    }, [isOpen, accountName]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-lg border border-border-color" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-border-color">
                    <h2 className="text-xl font-bold text-white">Account Not Found</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6">
                    <p className="text-gray-300 mb-4">The account "{accountName}" was found in your CSV but doesn't exist in your database.</p>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Account Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none"
                            >
                                <option value="Checking">Checking</option>
                                <option value="Savings">Savings</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Loan">Loan</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-border-color pt-4 mb-4">
                        <p className="text-sm text-gray-400 mb-3">Or select an existing account:</p>
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none"
                        >
                            <option value="">-- Select Account --</option>
                            {existingAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        {selectedAccountId ? (
                            <button
                                onClick={() => onSelectExisting(selectedAccountId)}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors"
                            >
                                Use Selected
                            </button>
                        ) : (
                            <button
                                onClick={() => onSaveNew(name, type)}
                                disabled={!name.trim()}
                                className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                Save Account
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ImportDataModal: React.FC<{isOpen: boolean, onClose: () => void, onImport: (transactions: Transaction[]) => void, onAddAsset: (asset: Omit<Asset, 'id'>) => void, onAddDebt: (debt: Omit<Debt, 'id'>) => void, assets: Asset[], debts: Debt[]}> = ({isOpen, onClose, onImport, onAddAsset, onAddDebt, assets, debts}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [showAccountMapping, setShowAccountMapping] = useState(false);
    const [pendingAccountName, setPendingAccountName] = useState('');
    const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
    const [accountMappings, setAccountMappings] = useState<Map<string, string>>(new Map());
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const processCSV = (text: string) => {
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            setError('CSV file is empty or invalid');
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rawTransactions: any[] = [];
        const unmappedAccounts = new Set<string>();

        // Create account lookup by name
        const allAccountsForImport = [...assets, ...debts];
        const accountNameToId = new Map(allAccountsForImport.map(a => [a.name.toLowerCase(), a.id!]));

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));

            if (values.length !== headers.length) continue;

            const transaction: any = {};
            headers.forEach((header, index) => {
                transaction[header.toLowerCase()] = values[index];
            });

            if (transaction.date && transaction.merchant && transaction.amount) {
                rawTransactions.push(transaction);

                // Check if account exists
                if (transaction.account) {
                    const accountLower = transaction.account.toLowerCase();
                    if (!accountNameToId.has(accountLower) && !accountMappings.has(accountLower)) {
                        unmappedAccounts.add(transaction.account);
                    }
                }
            }
        }

        if (unmappedAccounts.size > 0) {
            // Show modal for first unmapped account
            const firstUnmapped = Array.from(unmappedAccounts)[0];
            setPendingAccountName(firstUnmapped);
            setPendingTransactions(rawTransactions);
            setShowAccountMapping(true);
            return;
        }

        // All accounts mapped, process transactions
        const transactions: Transaction[] = rawTransactions.map((tx, i) => {
            let accountId = allAccountsForImport[0]?.id || '1';

            if (tx.account) {
                const accountLower = tx.account.toLowerCase();
                const mappedId = accountMappings.get(accountLower) || accountNameToId.get(accountLower);
                if (mappedId) accountId = mappedId;
            }

            return {
                id: `import-${Date.now()}-${i}`,
                merchant: tx.merchant,
                category: tx.category || 'Uncategorized',
                date: tx.date,
                amount: parseFloat(tx.amount),
                type: tx.type || 'expense',
                accountId: accountId,
                logo: `https://logo.clearbit.com/${tx.merchant.toLowerCase().replace(/\s+/g, '')}.com`
            };
        });

        if (transactions.length === 0) {
            setError('No valid transactions found in CSV');
            return;
        }

        onImport(transactions);
        setSuccess(`Successfully imported ${transactions.length} transactions!`);

        setTimeout(() => {
            setAccountMappings(new Map());
            onClose();
        }, 2000);
    };

    const handleFileSelect = (file: File) => {
        setError('');
        setSuccess('');
        setAccountMappings(new Map());

        if (!file.name.endsWith('.csv')) {
            setError('Please select a CSV file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                processCSV(text);
            } catch (err) {
                setError('Error parsing CSV file. Please check the format.');
            }
        };
        reader.readAsText(file);
    };

    const handleSaveNewAccount = (name: string, type: string) => {
        const isDebtType = type === 'Credit Card' || type === 'Loan';

        if (isDebtType) {
            onAddDebt({
                accountType: 'debt',
                name,
                type,
                balance: 0,
                interestRate: 0,
                minPayment: 0,
                originalBalance: 0,
                status: 'Active',
                lastUpdated: 'just now',
                icon: type === 'Credit Card' ? 'CreditCardIcon' : 'LoanIcon',
                color: 'bg-gray-700'
            });

            // Wait for state update
            setTimeout(() => {
                const newDebt = debts[debts.length - 1];
                if (newDebt) {
                    setAccountMappings(prev => new Map(prev).set(pendingAccountName.toLowerCase(), newDebt.id!));
                }
                setShowAccountMapping(false);

                // Continue processing
                setTimeout(() => {
                    if (pendingTransactions.length > 0) {
                        const reader = new FileReader();
                        const csvContent = reconstructCSV(pendingTransactions);
                        processCSV(csvContent);
                    }
                }, 100);
            }, 100);
        } else {
            onAddAsset({
                accountType: 'asset',
                name,
                type,
                balance: 0,
                interestRate: 0,
                status: 'Active',
                lastUpdated: 'just now',
                icon: 'AccountsIcon',
                color: 'bg-green-500',
                holdings: []
            });

            // Wait for state update
            setTimeout(() => {
                const newAsset = assets[assets.length - 1];
                if (newAsset) {
                    setAccountMappings(prev => new Map(prev).set(pendingAccountName.toLowerCase(), newAsset.id!));
                }
                setShowAccountMapping(false);

                // Continue processing
                setTimeout(() => {
                    if (pendingTransactions.length > 0) {
                        const csvContent = reconstructCSV(pendingTransactions);
                        processCSV(csvContent);
                    }
                }, 100);
            }, 100);
        }
    };

    const handleSelectExisting = (accountId: string) => {
        setAccountMappings(prev => new Map(prev).set(pendingAccountName.toLowerCase(), accountId));
        setShowAccountMapping(false);

        // Continue processing
        setTimeout(() => {
            if (pendingTransactions.length > 0) {
                const csvContent = reconstructCSV(pendingTransactions);
                processCSV(csvContent);
            }
        }, 100);
    };

    const handleCancelMapping = () => {
        // Skip transactions for this account
        const filteredTransactions = pendingTransactions.filter(
            tx => tx.account?.toLowerCase() !== pendingAccountName.toLowerCase()
        );
        setPendingTransactions(filteredTransactions);
        setShowAccountMapping(false);

        if (filteredTransactions.length > 0) {
            setTimeout(() => {
                const csvContent = reconstructCSV(filteredTransactions);
                processCSV(csvContent);
            }, 100);
        } else {
            setError('No transactions remaining after skipping unmapped accounts');
        }
    };

    const reconstructCSV = (transactions: any[]) => {
        const headers = 'Date,Merchant,Category,Amount,Account,Type';
        const rows = transactions.map(tx =>
            `"${tx.date}","${tx.merchant}","${tx.category}","${tx.amount}","${tx.account}","${tx.type}"`
        );
        return [headers, ...rows].join('\n');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
                <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-2xl border border-border-color" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-6 border-b border-border-color">
                        <h2 className="text-2xl font-bold text-white">Import Data from CSV</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                <div className="p-6">
                    <div
                        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                            isDragging ? 'border-primary bg-primary/10' : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto mb-4 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <p className="text-lg text-white mb-2">Drag and drop your CSV file here</p>
                        <p className="text-sm text-gray-400 mb-4">or</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90"
                        >
                            Browse Files
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileInput}
                            className="hidden"
                        />
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-lg">
                            <p className="text-green-400 text-sm">{success}</p>
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-300 font-semibold mb-2">CSV Format:</p>
                        <p className="text-xs text-gray-400 font-mono">Date,Merchant,Category,Amount,Account,Type</p>
                        <p className="text-xs text-gray-500 mt-2">Make sure your CSV matches this format for successful import.</p>
                    </div>
                </div>
            </div>
        </div>

            <AccountMappingModal
                isOpen={showAccountMapping}
                onClose={handleCancelMapping}
                accountName={pendingAccountName}
                onSaveNew={handleSaveNewAccount}
                onSelectExisting={handleSelectExisting}
                existingAccounts={[...assets, ...debts]}
            />
        </>
    );
};

const ExportDataModal: React.FC<{isOpen: boolean, onClose: () => void, assets: Asset[], debts: Debt[]}> = ({isOpen, onClose, assets, debts}) => {
    const allAccounts = [...assets, ...debts];
    const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
    const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(['Date', 'Merchant', 'Category', 'Amount', 'Account', 'Type']));
    const [timeFrame, setTimeFrame] = useState<string>('All');

    const fields = ['Date', 'Merchant', 'Category', 'Amount', 'Account', 'Type'];
    const timeFrames = ['Last month', '3 months', '6 months', '1 year', 'All'];

    // Reset selections when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setSelectedAccounts(new Set(allAccounts.map(acc => acc.id)));
            setSelectedFields(new Set(['Date', 'Merchant', 'Category', 'Amount', 'Account', 'Type']));
            setTimeFrame('All');
        }
    }, [isOpen]);

    const toggleAccount = (id: string) => {
        const newSelected = new Set(selectedAccounts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedAccounts(newSelected);
    };

    const toggleField = (field: string) => {
        const newSelected = new Set(selectedFields);
        if (newSelected.has(field)) {
            newSelected.delete(field);
        } else {
            newSelected.add(field);
        }
        setSelectedFields(newSelected);
    };

    const handleExport = () => {
        // Generate CSV content
        const csvRows: string[] = [];

        // Add headers
        const headers = Array.from(selectedFields);
        csvRows.push(headers.join(','));

        // Get transactions from localStorage
        const transactions = JSON.parse(localStorage.getItem('zenith-transactions') || '[]');

        // Filter by time frame
        const now = new Date();
        const filteredTransactions = transactions.filter((tx: any) => {
            const txDate = new Date(tx.date);
            if (!selectedAccounts.has(tx.accountId)) return false;

            switch(timeFrame) {
                case 'Last month':
                    return (now.getTime() - txDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
                case '3 months':
                    return (now.getTime() - txDate.getTime()) <= 90 * 24 * 60 * 60 * 1000;
                case '6 months':
                    return (now.getTime() - txDate.getTime()) <= 180 * 24 * 60 * 60 * 1000;
                case '1 year':
                    return (now.getTime() - txDate.getTime()) <= 365 * 24 * 60 * 60 * 1000;
                default:
                    return true;
            }
        });

        // Get all accounts for name lookup
        const allAccountsForExport = [...assets, ...debts];

        // Add data rows
        filteredTransactions.forEach((tx: any) => {
            const row = headers.map(field => {
                switch(field) {
                    case 'Date': return `"${tx.date}"`;
                    case 'Merchant': return `"${tx.merchant}"`;
                    case 'Category': return `"${tx.category}"`;
                    case 'Amount': return tx.amount;
                    case 'Account': {
                        const account = allAccountsForExport.find(a => a.id === tx.accountId);
                        return `"${account?.name || tx.accountId}"`;
                    }
                    case 'Type': return `"${tx.type}"`;
                    default: return '';
                }
            });
            csvRows.push(row.join(','));
        });

        // Create and download CSV file
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        onClose();
    };

    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-3xl border border-border-color" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-border-color">
                    <h2 className="text-2xl font-bold text-white">Export Data</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-6"  style={{maxHeight: '80vh', overflowY: 'auto'}}>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Select Accounts</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {allAccounts.map(acc => (
                                <button
                                    key={acc.id}
                                    onClick={() => toggleAccount(acc.id)}
                                    className={`px-6 py-4 rounded-full font-semibold transition-all ${
                                        selectedAccounts.has(acc.id)
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {acc.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Select Fields</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {fields.map(field => (
                                <button
                                    key={field}
                                    onClick={() => toggleField(field)}
                                    className={`px-6 py-4 rounded-full font-semibold transition-all ${
                                        selectedFields.has(field)
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {field}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Time frame</h3>
                        <div className="flex gap-3 flex-wrap">
                            {timeFrames.map(frame => (
                                <button
                                    key={frame}
                                    onClick={() => setTimeFrame(frame)}
                                    className={`px-8 py-3 rounded-full font-semibold transition-all ${
                                        timeFrame === frame
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    {frame}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleExport}
                            className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        >
                            Download CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const SettingRow: React.FC<{ title: string; children?: React.ReactNode; isDanger?: boolean; onClick?: () => void }> = ({ title, children, isDanger, onClick }) => (
    <div onClick={onClick} className={`flex justify-between items-center py-4 border-b border-border-color last:border-b-0 ${onClick ? 'cursor-pointer hover:bg-gray-800/50 -mx-4 px-4 rounded-md' : ''}`}>
        <span className={isDanger ? 'text-red-400' : 'text-white'}>{title}</span>
        <div>{children}</div>
    </div>
);

const ToggleSwitch: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
    <button onClick={onToggle} className={`w-12 h-6 rounded-full p-1 transition-colors ${enabled ? 'bg-primary' : 'bg-gray-600'}`}>
        <div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </button>
);

const Settings: React.FC<SettingsProps> = (props) => {
    const { categories, onAddCategory, onUpdateCategory, onDeleteCategory, rules, onAddRule, onDeleteRule, onWipeData, notificationsEnabled, onToggleNotifications, autoCategorize, onToggleAutoCategorize, smartSuggestions, onToggleSmartSuggestions, assets, debts, onImportTransactions, onAddAsset, onAddDebt } = props;
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const { currency, setCurrency } = useCurrency();

    const currencyMap: {[key in Currency]: string} = { 'GBP': 'GBP (£)', 'USD': 'USD ($)', 'EUR': 'EUR (€)' };

    return (
        <>
            <ManageCategoriesModal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} categories={categories} onAddCategory={onAddCategory} onUpdateCategory={onUpdateCategory} onDeleteCategory={onDeleteCategory} />
            <TransactionRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} rules={rules} categories={categories} onAddRule={onAddRule} onDeleteRule={onDeleteRule} />
            <WipeDataModal isOpen={isWipeModalOpen} onClose={() => setIsWipeModalOpen(false)} onWipe={onWipeData} />
            <ExportDataModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} assets={assets} debts={debts} />
            <ImportDataModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={onImportTransactions} onAddAsset={onAddAsset} onAddDebt={onAddDebt} assets={assets} debts={debts} />

            <div className="space-y-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Rules & Automation</h3>
                        <Card>
                            <SettingRow title="Manage Categories" onClick={() => setIsCatModalOpen(true)}>
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </SettingRow>
                             <SettingRow title="Transaction Rules" onClick={() => setIsRulesModalOpen(true)}>
                                <div className="flex items-center">
                                    <span className="text-xs bg-gray-600 px-2 py-1 rounded mr-2">{rules.length} active</span>
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </SettingRow>
                            <SettingRow title="Auto-categorization">
                                <ToggleSwitch enabled={autoCategorize} onToggle={onToggleAutoCategorize} />
                            </SettingRow>
                            <SettingRow title="Smart Suggestions">
                                <ToggleSwitch enabled={smartSuggestions} onToggle={onToggleSmartSuggestions} />
                            </SettingRow>
                        </Card>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">App Settings</h3>
                        <Card>
                            <SettingRow title="Notifications"><ToggleSwitch enabled={notificationsEnabled} onToggle={onToggleNotifications} /></SettingRow>
                            <SettingRow title="Currency">
                                <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="bg-gray-700 text-white text-sm rounded-md border border-gray-600 focus:ring-primary focus:border-primary">
                                    {(Object.keys(currencyMap) as Currency[]).map(key => (
                                        <option key={key} value={key}>{currencyMap[key]}</option>
                                    ))}
                                </select>
                            </SettingRow>
                            <SettingRow title="Theme"><span className="text-gray-400">Dark</span></SettingRow>
                        </Card>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Data Management</h3>
                        <Card>
                            <SettingRow title="Export All Data to CSV" onClick={() => setIsExportModalOpen(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                            </SettingRow>
                            <SettingRow title="Import Data from CSV" onClick={() => setIsImportModalOpen(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                            </SettingRow>
                            <SettingRow title="Wipe and Reset" isDanger onClick={() => setIsWipeModalOpen(true)}>
                                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </SettingRow>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Settings;