import React, { useState } from 'react';
import Card from './Card';
import { Category, Currency, Asset, Debt, TransactionRule } from '../types';
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
        { id: 'resetAccounts', label: 'Reset all accounts', description: 'Resets all assets and debts to their default state.' },
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

const ExportDataModal: React.FC<{isOpen: boolean, onClose: () => void, assets: Asset[], debts: Debt[]}> = ({isOpen, onClose, assets, debts}) => {
    if (!isOpen) return null;
    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-lg border border-border-color" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border-color">
                    <h2 className="text-xl font-bold text-white">Export Data</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <h3 className="font-semibold text-white mb-2">Select Accounts</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto p-2 bg-gray-800 rounded-md">
                            {[...assets, ...debts].map(acc => (
                                <label key={acc.id} className="flex items-center"><input type="checkbox" defaultChecked className="h-4 w-4 mr-3 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary" />{acc.name}</label>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold text-white mb-2">Select Fields</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {['Date', 'Merchant', 'Category', 'Amount', 'Account', 'Type'].map(field => (
                                 <label key={field} className="flex items-center"><input type="checkbox" defaultChecked className="h-4 w-4 mr-3 text-primary bg-gray-700 border-gray-600 rounded focus:ring-primary" />{field}</label>
                            ))}
                        </div>
                    </div>
                     <button onClick={() => {alert('CSV download started!'); onClose();}} className="w-full py-3 mt-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 transition-colors">
                        Download CSV
                    </button>
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
    const { categories, onAddCategory, onUpdateCategory, onDeleteCategory, rules, onAddRule, onDeleteRule, onWipeData, notificationsEnabled, onToggleNotifications, autoCategorize, onToggleAutoCategorize, smartSuggestions, onToggleSmartSuggestions, assets, debts } = props;
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const { currency, setCurrency } = useCurrency();

    const currencyMap: {[key in Currency]: string} = { 'GBP': 'GBP (£)', 'USD': 'USD ($)', 'EUR': 'EUR (€)' };

    return (
        <>
            <ManageCategoriesModal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} categories={categories} onAddCategory={onAddCategory} onUpdateCategory={onUpdateCategory} onDeleteCategory={onDeleteCategory} />
            <TransactionRulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} rules={rules} categories={categories} onAddRule={onAddRule} onDeleteRule={onDeleteRule} />
            <WipeDataModal isOpen={isWipeModalOpen} onClose={() => setIsWipeModalOpen(false)} onWipe={onWipeData} />
            <ExportDataModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} assets={assets} debts={debts} />

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