import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card';
import { Asset, MarketData, Holding, Transaction } from '../types';
import { PlusIcon, PencilIcon, CloseIcon, iconMap } from './icons';
import { mockAssets } from '../data/mockData';
import { useCurrency } from '../App';
import AccountDetailModal from './AccountDetailModal';

interface AccountsProps {
    assets: Asset[];
    marketData: MarketData;
    onAddAsset: (asset: Omit<Asset, 'id'>) => void;
    onUpdateAsset: (asset: Asset, oldBalance?: number) => void;
    onAddTransaction?: (transaction: Omit<Transaction, 'id'>) => void;
    transactions: Transaction[];
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; className?: string }> = ({ isOpen, onClose, title, children, className }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className={`bg-card-bg rounded-lg shadow-xl w-full border border-border-color overflow-hidden ${className || 'max-w-lg'}`} onClick={(e) => e.stopPropagation()}>
           <div className="flex justify-between items-center p-4 border-b border-border-color">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
           </div>
           <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    );
};

const AddEditAccountModal: React.FC<{ isOpen: boolean; onClose: () => void; asset?: Asset; onSave: (asset: any, oldBalance?: number) => void; marketData: MarketData; }> = ({ isOpen, onClose, asset, onSave, marketData }) => {
    const [formData, setFormData] = useState<any>({});
    const [originalBalance, setOriginalBalance] = useState<number>(0);
    const { formatCurrency, currency } = useCurrency();
    const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';

    useEffect(() => {
        if (asset) {
            setFormData(asset);
            setOriginalBalance(asset.balance || 0);
        } else {
            setFormData({
                accountType: 'asset',
                type: 'Checking',
                balance: 0,
                interestRate: 0,
                status: 'Active',
                lastUpdated: 'just now',
                color: 'bg-green-500',
                icon: 'AccountsIcon',
                holdings: []
            });
            setOriginalBalance(0);
        }
    }, [asset, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [id]: value }));
    };

    const handleSave = () => {
        onSave(formData, originalBalance);
        onClose();
    };

    const commonInputStyles = "w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none transition-colors";
    const labelStyles = "block text-sm font-medium text-gray-300 mb-2";

    const isInvestingAccount = formData.type === 'Investing';

    const HoldingsView: React.FC<{holdings: Holding[], marketData: MarketData}> = ({ holdings, marketData }) => (
        <div className="space-y-4">
             <div>
                <h3 className="text-lg font-semibold text-white">Holdings</h3>
                <p className={labelStyles + " mt-0"}>ASSETS</p>
            </div>
            <div className="max-h-96 overflow-y-auto pr-2">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="px-4 py-3">Asset</th>
                            <th scope="col" className="px-4 py-3">Amount</th>
                            <th scope="col" className="px-4 py-3">Avg. Price</th>
                            <th scope="col" className="px-4 py-3">P/L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {holdings.map(holding => {
                            const currentPrice = marketData[holding.ticker]?.price || 0;
                            const currentValue = currentPrice * holding.shares;
                            const avgValue = holding.avgCost * holding.shares;
                            const pnl = currentValue - avgValue;
                            const pnlPercent = avgValue > 0 ? (pnl / avgValue) * 100 : 0;
                            return (
                                <tr key={holding.ticker} className="border-b border-border-color">
                                    <td className="px-4 py-3 font-medium text-white">{holding.name} ({holding.ticker})</td>
                                    <td className="px-4 py-3">{holding.shares}</td>
                                    <td className="px-4 py-3">{formatCurrency(holding.avgCost)}</td>
                                    <td className={`px-4 py-3 font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(pnl)} ({pnlPercent.toFixed(2)}%)
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={asset ? 'Edit Asset' : 'Add New Asset'} className={isInvestingAccount ? 'max-w-4xl' : 'max-w-lg'}>
            <div className={`grid grid-cols-1 ${isInvestingAccount ? 'lg:grid-cols-2 gap-8' : ''}`}>
                 <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className={labelStyles}>Account Name</label>
                        <input id="name" placeholder="e.g., Main Checking" value={formData.name || ''} onChange={handleChange} className={commonInputStyles} />
                    </div>
                    <div>
                        <label htmlFor="type" className={labelStyles}>Account Type</label>
                        <select id="type" value={formData.type || 'Checking'} onChange={handleChange} className={commonInputStyles}>
                            <option>Checking</option><option>Savings</option><option>Investing</option>
                        </select>
                    </div>
                    {!isInvestingAccount && (
                        <>
                        <div>
                            <label htmlFor="balance" className={labelStyles}>Current Balance</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span>
                                <input type="number" id="balance" value={formData.balance || 0} onChange={(e) => setFormData({...formData, balance: parseFloat(e.target.value)})} className={`${commonInputStyles} pl-7`} />
                            </div>
                            {formData.interestRate > 0 && formData.balance > 0 && (
                                <p className="text-sm text-green-400 mt-2">
                                    Earning {formatCurrency((formData.interestRate * formData.balance) / 100 / 12)} per month
                                </p>
                            )}
                        </div>
                        <div>
                             <label htmlFor="interestRate" className={labelStyles}>Interest Rate (%)</label>
                             <input type="number" id="interestRate" value={formData.interestRate || 0} onChange={(e) => setFormData({...formData, interestRate: parseFloat(e.target.value)})} className={commonInputStyles} />
                        </div>
                        </>
                    )}
                    
                    <div className="flex gap-4 pt-4">
                        <button className="w-full py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors" onClick={onClose}>Cancel</button>
                        <button onClick={handleSave} className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 transition-colors">{asset ? 'Update Account' : 'Add Account'}</button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const AssetAccountCard: React.FC<{ asset: Asset; onEdit: (acc: Asset) => void; onClick?: (acc: Asset) => void }> = ({ asset, onEdit, onClick }) => {
    const { formatCurrency } = useCurrency();
    const Icon = iconMap[asset.icon];
    const monthlyEarnings = asset.interestRate && asset.balance ? (asset.interestRate * asset.balance) / 100 / 12 : 0;

    return (
        <Card className={`flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors ${asset.status === 'Closed' ? 'opacity-60' : ''}`} onClick={() => onClick?.(asset)}>
            <div className="flex items-center">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${asset.color}`}>{Icon && <Icon className="h-6 w-6 text-white" />}</div>
                <div>
                    <p className="font-semibold text-white">{asset.name}</p>
                    <p className="text-xs text-gray-400">{asset.type}</p>
                     <p className={`text-xs font-semibold ${asset.status === 'Active' ? 'text-primary' : 'text-gray-500'}`}>{asset.status}</p>
                </div>
            </div>
            <div className="text-right flex items-center gap-4">
                <div>
                    <p className="font-bold text-white text-lg">{formatCurrency(asset.balance)}</p>
                    {monthlyEarnings > 0 && asset.status === 'Active' && (
                        <p className="text-sm font-bold text-green-400">Earning {formatCurrency(monthlyEarnings)}/m</p>
                    )}
                    <p className="text-xs text-gray-400">Updated {asset.lastUpdated}</p>
                </div>
                {asset.status === 'Active' && <button onClick={(e) => { e.stopPropagation(); onEdit(asset); }} className="p-2 text-gray-500 hover:text-white hover:bg-green-600 rounded-lg transition-colors"><PencilIcon className="w-4 h-4" /></button>}
            </div>
        </Card>
    );
};

const Accounts: React.FC<AccountsProps> = ({ assets, marketData, onAddAsset, onUpdateAsset, onAddTransaction, transactions = [] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
    const [showClosed, setShowClosed] = useState(false);
    const [sort, setSort] = useState('default');
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Asset | undefined>(undefined);
    const { formatCurrency } = useCurrency();

    const totalBalance = useMemo(() => assets.filter(a => a.status === 'Active').reduce((sum, acc) => sum + acc.balance, 0), [assets]);

    const activeAccounts = assets.filter(acc => acc.status === 'Active');
    const closedAccounts = assets.filter(acc => acc.status === 'Closed');

    const sortedAccounts = useMemo(() => {
        let accounts = activeAccounts;
        switch (sort) {
            case 'balance':
                return [...accounts].sort((a, b) => b.balance - a.balance);
            case 'a-z':
                return [...accounts].sort((a, b) => a.name.localeCompare(b.name));
            default:
                return accounts;
        }
    }, [sort, activeAccounts]);

    const handleOpenModal = (asset?: Asset) => {
        setEditingAsset(asset);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingAsset(undefined);
        setIsModalOpen(false);
    };

    const handleSave = (data: any, oldBalance?: number) => {
        if (data.id) {
            // If editing and balance changed, create a rebalance transaction
            if (oldBalance !== undefined && oldBalance !== data.balance && onAddTransaction) {
                const diff = data.balance - oldBalance;
                const transaction: Omit<Transaction, 'id'> = {
                    merchant: `Updated Balance / Rebalance`,
                    category: diff > 0 ? 'Balance Adjustment' : 'Balance Adjustment',
                    date: new Date().toISOString(),
                    amount: Math.abs(diff),
                    type: diff > 0 ? 'income' : 'expense',
                    accountId: data.id,
                    logo: 'https://logo.clearbit.com/bank.com'
                };
                onAddTransaction(transaction);
            }
            onUpdateAsset(data, oldBalance);
        } else {
            onAddAsset(data);
        }
    };

    return (
        <>
            <AddEditAccountModal isOpen={isModalOpen} onClose={handleCloseModal} asset={editingAsset} onSave={handleSave} marketData={marketData} />
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Accounts (Assets)</h1>
                    <button onClick={() => handleOpenModal()} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Asset
                    </button>
                </div>

                 <Card className="text-center">
                    <p className="text-sm text-gray-400">Total Asset Balance</p>
                    <p className="text-4xl font-bold text-white mt-1">{formatCurrency(totalBalance)}</p>
                </Card>

                <div className="space-y-4">
                     <div className="flex justify-end items-center">
                        <select onChange={(e) => setSort(e.target.value)} value={sort} className="bg-card-bg border border-border-color text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2">
                            <option value="default">Sort by: Default</option>
                            <option value="balance">Sort by: Balance</option>
                            <option value="a-z">Sort by: A-Z</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sortedAccounts.map(acc => <AssetAccountCard key={acc.id} asset={acc} onEdit={handleOpenModal} onClick={(acc) => { setSelectedAccount(acc); setDetailModalOpen(true); }} />)}
                    </div>
                </div>

                <div className="space-y-4">
                     <button onClick={() => setShowClosed(!showClosed)} className="flex items-center justify-between w-full text-left pt-4 border-t border-border-color">
                        <h2 className="text-xl font-bold text-gray-400">Closed Accounts</h2>
                        <svg className={`h-5 w-5 text-gray-400 transform transition-transform ${showClosed ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                    {showClosed && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {closedAccounts.map(acc => <AssetAccountCard key={acc.id} asset={acc} onEdit={handleOpenModal} onClick={(acc) => { setSelectedAccount(acc); setDetailModalOpen(true); }} />)}
                        </div>
                    )}
                </div>
            </div>
            {selectedAccount && (
                <AccountDetailModal
                    isOpen={detailModalOpen}
                    onClose={() => { setDetailModalOpen(false); setSelectedAccount(undefined); }}
                    account={selectedAccount}
                    accountType="asset"
                    transactions={transactions}
                    marketData={marketData}
                />
            )}
        </>
    );
};

export default Accounts;