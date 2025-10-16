import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card';
import { Debt, Transaction } from '../types';
import { PlusIcon, PencilIcon, CloseIcon, iconMap } from './icons';
import { useCurrency } from '../App';
import AccountDetailModal from './AccountDetailModal';

interface DebtsProps {
    debts: Debt[];
    onAddDebt: (debt: Omit<Debt, 'id'>) => void;
    onUpdateDebt: (debt: Debt, oldBalance?: number) => void;
    onAddTransaction?: (transaction: Omit<Transaction, 'id'>) => void;
    transactions?: Transaction[];
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-lg border border-border-color overflow-hidden" onClick={(e) => e.stopPropagation()}>
           <div className="flex justify-between items-center p-4 border-b border-border-color">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
           </div>
           <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    );
};

const AddEditDebtModal: React.FC<{ isOpen: boolean; onClose: () => void; debt?: Debt; onSave: (debt: any, oldBalance?: number) => void;}> = ({ isOpen, onClose, debt, onSave }) => {
    const [formData, setFormData] = useState<any>({});
    const [originalBalance, setOriginalBalance] = useState<number>(0);
    const [promoEnabled, setPromoEnabled] = useState(false);
    const { currency, formatCurrency } = useCurrency();
    const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';

    useEffect(() => {
        if (debt) {
            setFormData(debt);
            setOriginalBalance(debt.balance || 0);
            setPromoEnabled(!!debt.promotionalOffer);
        } else {
             setFormData({
                accountType: 'debt',
                type: 'Credit Card',
                status: 'Active',
                lastUpdated: 'just now',
                color: 'bg-gray-700',
                icon: 'CreditCardIcon',
                balance: 0,
                interestRate: 0,
                minPayment: 0,
                originalBalance: 0,
            });
            setOriginalBalance(0);
            setPromoEnabled(false);
        }
    }, [debt, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [id]: value }));
    };
    
    const handlePromoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            promotionalOffer: { ...prev.promotionalOffer, [id]: value }
        }));
    };

    const handleSave = () => {
        const dataToSave = {...formData};
        if (!promoEnabled) {
            delete dataToSave.promotionalOffer;
        }
        onSave(dataToSave, originalBalance);
        onClose();
    };
    
    const commonInputStyles = "w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none transition-colors";
    const labelStyles = "block text-sm font-medium text-gray-300 mb-2";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={debt ? 'Edit Debt' : 'Add New Debt'}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className={labelStyles}>Debt Name</label>
                        <input id="name" placeholder="e.g., Chase Freedom" value={formData.name || ''} onChange={handleChange} className={commonInputStyles} />
                    </div>
                     <div>
                        <label htmlFor="type" className={labelStyles}>Debt Type</label>
                        <select id="type" value={formData.type || 'Credit Card'} onChange={handleChange} className={commonInputStyles}>
                            <option>Credit Card</option><option>Car Loan</option><option>Loan</option><option>Other</option>
                        </select>
                    </div>
                </div>
                 <div>
                    <label htmlFor="balance" className={labelStyles}>Current Balance</label>
                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span><input type="number" id="balance" value={formData.balance || 0} onChange={e => setFormData({...formData, balance: parseFloat(e.target.value)})} className={`${commonInputStyles} pl-7`} /></div>
                    {formData.interestRate > 0 && formData.balance > 0 && (
                        <p className="text-sm text-red-400 mt-2">
                            Costing {formatCurrency((formData.interestRate * formData.balance) / 100 / 12)} per month in interest
                        </p>
                    )}
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="interestRate" className={labelStyles}>Interest Rate (%)</label>
                        <input type="number" id="interestRate" value={formData.interestRate || 0} onChange={e => setFormData({...formData, interestRate: parseFloat(e.target.value)})} className={commonInputStyles} />
                    </div>
                    <div>
                        <label htmlFor="minPayment" className={labelStyles}>Minimum Payment</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span><input type="number" id="minPayment" value={formData.minPayment || 0} onChange={e => setFormData({...formData, minPayment: parseFloat(e.target.value)})} className={`${commonInputStyles} pl-7`} /></div>
                    </div>
                </div>
                <div>
                    <label htmlFor="originalBalance" className={labelStyles}>Original Balance</label>
                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span><input type="number" id="originalBalance" value={formData.originalBalance || 0} onChange={e => setFormData({...formData, originalBalance: parseFloat(e.target.value)})} className={`${commonInputStyles} pl-7`} /></div>
                </div>
                
                 <div className="flex justify-between items-center pt-4 border-t border-border-color">
                    <label className={labelStyles + " mb-0"}>Promotional Offer</label>
                    <button onClick={() => setPromoEnabled(!promoEnabled)} className={`px-4 py-1 rounded-full text-sm ${promoEnabled ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}>{promoEnabled ? 'Enabled' : 'Disabled'}</button>
                </div>
                {promoEnabled && (
                    <div className="space-y-4 pt-4 border-t border-border-color">
                         <div>
                            <label htmlFor="description" className={labelStyles}>Promotional Offer (Optional)</label>
                            <input id="description" value={formData.promotionalOffer?.description || ''} onChange={handlePromoChange} placeholder="e.g. 0% APR for 12 months" className={commonInputStyles} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="apr" className={labelStyles}>Offer APR (%)</label>
                                <input type="number" id="apr" value={formData.promotionalOffer?.apr || 0} onChange={e => handlePromoChange({target: {id: 'apr', value: parseFloat(e.target.value)}} as any)} className={commonInputStyles} />
                            </div>
                             <div>
                                <label htmlFor="offerPayment" className={labelStyles}>Offer Payment</label>
                                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span><input type="number" id="offerPayment" value={formData.promotionalOffer?.offerPayment || 0} onChange={e => handlePromoChange({target: {id: 'offerPayment', value: parseFloat(e.target.value)}} as any)} className={`${commonInputStyles} pl-7`} /></div>
                            </div>
                        </div>
                        <div>
                             <label htmlFor="endDate" className={labelStyles}>Promotional End Date</label>
                            <input type="date" id="endDate" value={formData.promotionalOffer?.endDate || ''} onChange={handlePromoChange} className={commonInputStyles} />
                        </div>
                    </div>
                )}
                
                <div className="flex gap-4 pt-4">
                    <button className="w-full py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors" onClick={onClose}>Cancel</button>
                    <button onClick={handleSave} className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 transition-colors">{debt ? 'Update Debt' : 'Add Debt'}</button>
                </div>
            </div>
        </Modal>
    )
};


const DebtAccountCard: React.FC<{ debt: Debt; onEdit: (acc: Debt) => void; onClick?: (debt: Debt) => void }> = ({ debt, onEdit, onClick }) => {
    const { formatCurrency } = useCurrency();
    const progress = debt.originalBalance > 0 ? ((debt.originalBalance - debt.balance) / debt.originalBalance) * 100 : 0;
    const Icon = iconMap[debt.icon];

    const calculatePayoff = () => {
        const today = new Date();
        let payoffInfo: {label: 'Payoff Date' | 'Shortfall', value: React.ReactNode} = {label: 'Payoff Date', value: 'N/A'};

        if (debt.promotionalOffer && new Date(debt.promotionalOffer.endDate) > today) {
            const endDate = new Date(debt.promotionalOffer.endDate);
            const monthsLeft = (endDate.getFullYear() - today.getFullYear()) * 12 + (endDate.getMonth() - today.getMonth());
            const totalPromoPayments = debt.promotionalOffer.offerPayment * monthsLeft;

            if (debt.balance > totalPromoPayments) {
                const shortfall = debt.balance - totalPromoPayments;
                payoffInfo = { label: 'Shortfall', value: <span className="text-red-400">{formatCurrency(shortfall)}</span> };
            } else {
                const monthsToPayoff = Math.ceil(debt.balance / debt.promotionalOffer.offerPayment);
                const payoffDate = new Date(new Date().setMonth(today.getMonth() + monthsToPayoff));
                payoffInfo = { label: 'Payoff Date', value: payoffDate.toLocaleString('en-GB', { month: 'short', year: '2-digit' }).toUpperCase()};
            }
        } else {
            if (debt.minPayment > 0) {
                const i = debt.interestRate / 100 / 12;
                if (i > 0) {
                    const n = -Math.log(1 - (debt.balance * i) / debt.minPayment) / Math.log(1 + i);
                    if (isFinite(n)) {
                        const payoffDate = new Date(new Date().setMonth(today.getMonth() + Math.ceil(n)));
                        payoffInfo = { label: 'Payoff Date', value: payoffDate.toLocaleString('en-GB', { month: 'short', year: '2-digit' }).toUpperCase()};
                    }
                } else { 
                     const monthsToPayoff = Math.ceil(debt.balance / debt.minPayment);
                     const payoffDate = new Date(new Date().setMonth(today.getMonth() + monthsToPayoff));
                     payoffInfo = { label: 'Payoff Date', value: payoffDate.toLocaleString('en-GB', { month: 'short', year: '2-digit' }).toUpperCase()};
                }
            }
        }
        return payoffInfo;
    };
    
    const { label, value } = calculatePayoff();
    
    return (
        <Card className={`cursor-pointer hover:border-primary/50 transition-colors ${debt.status === 'Closed' ? 'opacity-60' : ''}`} onClick={() => onClick?.(debt)}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${debt.color}`}>{Icon && <Icon className="h-6 w-6 text-white" />}</div>
                    <div>
                        <p className="text-xl font-bold text-white">{debt.name}</p>
                        <p className="text-xs text-gray-400">
                            {debt.type}
                            {debt.promotionalOffer && ' - Promotional Offer'}
                            {debt.status === 'Active' ? <span className="text-primary"> - Active</span> : ' - Closed'}
                        </p>
                    </div>
                </div>
                <div className="text-right flex items-center gap-4">
                    <div>
                        <p className="font-bold text-white text-xl">{formatCurrency(debt.balance)}</p>
                        <p className="text-xs text-gray-400">Updated {debt.lastUpdated}</p>
                    </div>
                     {debt.status === 'Active' && <button onClick={() => onEdit(debt)} className="text-gray-500 hover:text-white"><PencilIcon className="w-4 h-4" /></button>}
                </div>
            </div>

            <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span className="text-blue-400 font-semibold">{progress.toFixed(0)}% paid off</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: `${progress}%` }}></div></div>
            </div>
            
            <div className={`flex ${debt.promotionalOffer ? 'justify-between' : 'justify-between'} items-start mt-4 pt-4 border-t border-border-color`}>
                <div className="text-left">
                    <p className="text-xs text-gray-400">Payment</p>
                    <p className="font-semibold text-white">{formatCurrency(debt.promotionalOffer?.offerPayment || debt.minPayment)}</p>
                </div>
                <div className={debt.promotionalOffer ? 'text-center' : 'text-left'}>
                    <p className="text-xs text-gray-400">Interest Rate</p>
                    <p className="font-semibold text-white">{(debt.promotionalOffer?.apr ?? debt.interestRate).toFixed(1)}%</p>
                </div>
                {!debt.promotionalOffer && debt.interestRate > 0 && debt.balance > 0 && (
                    <div className="text-left">
                        <p className="text-xs text-gray-400">Est. Interest</p>
                        <p className="font-semibold text-red-400">{formatCurrency((debt.interestRate * debt.balance) / 100 / 12)}/m</p>
                    </div>
                )}
                 <div className="text-right">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-semibold text-white">{value}</p>
                </div>
            </div>
        </Card>
    );
};

const Debts: React.FC<DebtsProps> = ({ debts, onAddDebt, onUpdateDebt, onAddTransaction, transactions = [] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | undefined>(undefined);
    const [showClosed, setShowClosed] = useState(false);
    const [sort, setSort] = useState('default');
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState<Debt | undefined>(undefined);
    const { formatCurrency } = useCurrency();

    const totalBalance = useMemo(() => debts.filter(d => d.status === 'Active').reduce((sum, acc) => sum + acc.balance, 0), [debts]);

    const activeDebts = debts.filter(acc => acc.status === 'Active');
    const closedDebts = debts.filter(acc => acc.status === 'Closed');

    const sortedDebts = useMemo(() => {
        let sorted = activeDebts;
        switch (sort) {
            case 'balance':
                return [...sorted].sort((a, b) => b.balance - a.balance);
            case 'a-z':
                return [...sorted].sort((a, b) => a.name.localeCompare(b.name));
            default:
                return sorted;
        }
    }, [sort, activeDebts]);

     const handleOpenModal = (debt?: Debt) => {
        setEditingDebt(debt);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingDebt(undefined);
        setIsModalOpen(false);
    };

    const handleSave = (data: any, oldBalance?: number) => {
        if (data.id) {
            // If editing and balance changed, create a rebalance transaction
            if (oldBalance !== undefined && oldBalance !== data.balance && onAddTransaction) {
                const diff = data.balance - oldBalance;
                // For debts, increase = more debt (expense), decrease = payment (income)
                const transaction: Omit<Transaction, 'id'> = {
                    merchant: `Updated Balance / Rebalance`,
                    category: diff > 0 ? 'Debt Increase' : 'Debt Payment',
                    date: new Date().toISOString(),
                    amount: Math.abs(diff),
                    type: diff > 0 ? 'expense' : 'income',
                    accountId: data.id,
                    logo: 'https://logo.clearbit.com/bank.com'
                };
                onAddTransaction(transaction);
            }
            onUpdateDebt(data, oldBalance);
        } else {
            onAddDebt(data);
        }
    };

    return (
        <>
            <AddEditDebtModal isOpen={isModalOpen} onClose={handleCloseModal} debt={editingDebt} onSave={handleSave} />
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Debts</h1>
                    <button onClick={() => handleOpenModal()} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Debt
                    </button>
                </div>

                <Card className="text-center">
                    <p className="text-sm text-gray-400">Total Debt Balance</p>
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
                        {sortedDebts.map(acc => <DebtAccountCard key={acc.id} debt={acc} onEdit={handleOpenModal} onClick={(debt) => { setSelectedDebt(debt); setDetailModalOpen(true); }} />)}
                    </div>
                </div>

                <div className="space-y-4">
                    <button onClick={() => setShowClosed(!showClosed)} className="flex items-center justify-between w-full text-left pt-4 border-t border-border-color">
                        <h2 className="text-xl font-bold text-gray-400">Closed Debts</h2>
                        <svg className={`h-5 w-5 text-gray-400 transform transition-transform ${showClosed ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                    {showClosed && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {closedDebts.map(acc => <DebtAccountCard key={acc.id} debt={acc} onEdit={handleOpenModal} onClick={(debt) => { setSelectedDebt(debt); setDetailModalOpen(true); }} />)}
                        </div>
                    )}
                </div>
            </div>
            {selectedDebt && (
                <AccountDetailModal
                    isOpen={detailModalOpen}
                    onClose={() => { setDetailModalOpen(false); setSelectedDebt(undefined); }}
                    account={selectedDebt}
                    accountType="debt"
                    transactions={transactions}
                />
            )}
        </>
    );
};

export default Debts;