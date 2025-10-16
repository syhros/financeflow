import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card';
import { PlusIcon, PencilIcon, CloseIcon, CalendarIcon } from './icons';
import { Bill, Asset, User, Notification, Page } from '../types';
import { format, isWithinInterval, addDays, compareAsc } from 'date-fns';
import { useCurrency } from '../App';
import UserHeader from './shared/UserHeader';

interface BillsProps {
    bills: Bill[];
    assets: Asset[];
    onAddBill: (bill: Omit<Bill, 'id'>) => void;
    onUpdateBill: (bill: Bill) => void;
    highlightedItemId: string | null;
    setHighlightedItemId: (id: string | null) => void;
    user: User;
    notifications: Notification[];
    debts: any[];
    onUpdateUser: (user: User) => void;
    onMarkAllNotificationsRead: () => void;
    onNotificationClick: (notification: Notification) => void;
    navigateTo: (page: Page) => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
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

const AddEditBillModal: React.FC<{ isOpen: boolean; onClose: () => void; bill?: Bill; assets: Asset[], onSave: (bill: any) => void; }> = ({ isOpen, onClose, bill, assets, onSave }) => {
    const [formData, setFormData] = useState<any>({});
    const { currency } = useCurrency();
    const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';

    useEffect(() => {
        if (bill) {
            setFormData(bill);
        } else {
            setFormData({
                name: '',
                category: 'Other',
                amount: 0,
                dueDate: '',
                paymentType: 'Manual',
                linkedAccountId: undefined,
            });
        }
    }, [bill, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 });
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    const commonInputStyles = "w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none transition-colors";
    const labelStyles = "block text-sm font-medium text-gray-300 mb-2";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={bill ? 'Edit Bill' : 'Add New Bill'}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className={labelStyles}>Bill Name</label>
                    <input type="text" id="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g., Netflix" className={commonInputStyles} />
                </div>
                <div>
                    <label htmlFor="amount" className={labelStyles}>Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span>
                        <input type="number" id="amount" value={formData.amount || 0} onChange={handleAmountChange} className={`${commonInputStyles} pl-7`} />
                    </div>
                </div>
                <div>
                    <label htmlFor="dueDate" className={labelStyles}>Due Date</label>
                    <div className="relative">
                        <input type="date" id="dueDate" value={formData.dueDate || ''} onChange={handleChange} className={commonInputStyles} />
                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="category" className={labelStyles}>Category</label>
                        <select id="category" value={formData.category || 'Other'} onChange={handleChange} className={commonInputStyles}>
                            <option>Entertainment</option>
                            <option>Utilities</option>
                            <option>Cloud Storage</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="paymentType" className={labelStyles}>Payment Type</label>
                        <select id="paymentType" value={formData.paymentType || 'Manual'} onChange={handleChange} className={commonInputStyles}>
                            <option>Auto-pay</option>
                            <option>Manual</option>
                            <option>Reminder</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="linkedAccountId" className={labelStyles}>Linked Account (Optional)</label>
                    <select id="linkedAccountId" value={formData.linkedAccountId || ''} onChange={handleChange} className={commonInputStyles}>
                        <option value="">None</option>
                        {assets.filter(a => a.status === 'Active').map(asset => (
                            <option key={asset.id} value={asset.id}>{asset.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-4 pt-4">
                    <button className="w-full py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors" onClick={onClose}>Cancel</button>
                    <button onClick={handleSave} className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 transition-colors">{bill ? 'Update Bill' : 'Add Bill'}</button>
                </div>
            </div>
        </Modal>
    );
};


const BillListItem: React.FC<{ bill: Bill; assets: Asset[]; onEdit: (bill: Bill) => void; className?: string; showEditButton?: boolean; }> = ({ bill, assets, onEdit, className, showEditButton = true }) => {
    const { formatCurrency } = useCurrency();
    const linkedAccount = bill.linkedAccountId ? assets.find(a => a.id === bill.linkedAccountId) : null;
    const paymentTypeColors = { 'Auto-pay': 'text-green-400', 'Manual': 'text-gray-400', 'Reminder': 'text-yellow-400' };
    const paymentTypeDotColors = { 'Auto-pay': 'bg-green-400', 'Manual': 'bg-gray-400', 'Reminder': 'bg-yellow-400' };

    return (
        <div className={`flex items-center justify-between py-4 rounded-lg px-4 ${className}`}>
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 bg-gray-700">
                    <img src={`https://logo.clearbit.com/${bill.name.toLowerCase().replace(/[\s+]/g, '')}.com`} alt={bill.name} className="w-6 h-6 rounded-md object-contain p-0.5" />
                </div>
                <div>
                    <p className="font-semibold text-white">{bill.name}</p>
                    <p className="text-xs text-gray-400">
                        {bill.category}
                        {linkedAccount && ` • ${linkedAccount.name}`}
                    </p>
                     <p className="text-xs text-primary font-semibold mt-0.5">Due {format(new Date(bill.dueDate), 'MMM dd')}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="font-bold text-white text-sm">{formatCurrency(bill.amount)}</p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                       <div className={`w-1.5 h-1.5 rounded-full ${paymentTypeDotColors[bill.paymentType]}`}></div>
                       <p className={`text-xs ${paymentTypeColors[bill.paymentType]}`}>{bill.paymentType}</p>
                    </div>
                </div>
                {showEditButton && (
                    <button onClick={() => onEdit(bill)} className="text-gray-500 hover:text-white"><PencilIcon className="w-4 h-4" /></button>
                )}
            </div>
        </div>
    );
};

const Bills: React.FC<BillsProps> = ({ bills, assets, onAddBill, onUpdateBill, highlightedItemId, setHighlightedItemId, user, notifications, debts, onUpdateUser, onMarkAllNotificationsRead, onNotificationClick, navigateTo, theme, onToggleTheme }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | undefined>(undefined);
    const [sort, setSort] = useState('date-asc');
    const [typeFilter, setTypeFilter] = useState('All');
    const [paymentFilter, setPaymentFilter] = useState('All');
    const [accountFilter, setAccountFilter] = useState('All');
    const { formatCurrency } = useCurrency();
    
    useEffect(() => {
        if (highlightedItemId) {
            const timer = setTimeout(() => {
                setHighlightedItemId(null);
            }, 3000); // Animation is 3s
            return () => clearTimeout(timer);
        }
    }, [highlightedItemId, setHighlightedItemId]);

    const uniqueBillTypes = useMemo(() => ['All', ...Array.from(new Set(bills.map(b => b.category)))], [bills]);
    const uniquePaymentTypes = useMemo(() => ['All', ...Array.from(new Set(bills.map(b => b.paymentType)))], [bills]);
    const uniqueAccountIds = useMemo(() => ['All', ...Array.from(new Set(bills.map(b => b.linkedAccountId).filter(Boolean)))], [bills]);

    const handleOpenModal = (bill?: Bill) => {
        setSelectedBill(bill);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedBill(undefined);
    };

    const handleSave = (data: any) => {
        if (data.id) {
            onUpdateBill(data);
        } else {
            onAddBill(data);
        }
    };
    
    const upcomingBills = useMemo(() => {
        const today = new Date();
        const nextWeek = addDays(today, 7);
        return bills
            .filter(bill => isWithinInterval(new Date(bill.dueDate), { start: today, end: nextWeek }))
            .sort((a, b) => compareAsc(new Date(a.dueDate), new Date(b.dueDate)));
    }, [bills]);

    const monthlySummary = useMemo(() => {
        const summary = bills.reduce((acc, bill) => {
            acc.total += bill.amount;
            const paymentType = bill.paymentType.toLowerCase().replace('-', '');
            acc[paymentType] = (acc[paymentType] || 0) + bill.amount;
            return acc;
        }, { total: 0, autopay: 0, manual: 0, reminder: 0 });
        return summary;
    }, [bills]);

    const filteredAndSortedBills = useMemo(() => {
        let processedBills = [...bills];
        
        if (typeFilter !== 'All') processedBills = processedBills.filter(b => b.category === typeFilter);
        if (paymentFilter !== 'All') processedBills = processedBills.filter(b => b.paymentType === paymentFilter);
        if (accountFilter !== 'All') processedBills = processedBills.filter(b => b.linkedAccountId === accountFilter);

        switch (sort) {
            case 'date-asc':
                processedBills.sort((a, b) => compareAsc(new Date(a.dueDate), new Date(b.dueDate)));
                break;
            case 'date-desc':
                processedBills.sort((a, b) => compareAsc(new Date(b.dueDate), new Date(a.dueDate)));
                break;
            case 'amount-asc':
                processedBills.sort((a, b) => a.amount - b.amount);
                break;
            case 'amount-desc':
                processedBills.sort((a, b) => b.amount - a.amount);
                break;
            case 'a-z':
                processedBills.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
        return processedBills;
    }, [bills, sort, typeFilter, paymentFilter, accountFilter]);

    const commonSelectStyles = "bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5";
    
    return (
        <>
            <AddEditBillModal isOpen={isModalOpen} onClose={handleCloseModal} bill={selectedBill} assets={assets} onSave={handleSave} />
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Bills & Subscriptions</h1>
                    <UserHeader
                        user={user}
                        notifications={notifications}
                        onUpdateUser={onUpdateUser}
                        onMarkAllNotificationsRead={onMarkAllNotificationsRead}
                        onNotificationClick={onNotificationClick}
                        navigateTo={navigateTo}
                        theme={theme}
                        onToggleTheme={onToggleTheme}
                        assets={assets}
                        debts={debts}
                    />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2">
                         <h2 className="text-lg font-bold text-white mb-2">Upcoming Payments (Next 7 Days)</h2>
                         <div className="divide-y divide-border-color">
                             {upcomingBills.length > 0 ? (
                                upcomingBills.map(bill => <BillListItem key={bill.id} bill={bill} assets={assets} onEdit={handleOpenModal} showEditButton={false} className={bill.id === highlightedItemId ? 'highlight-animate' : ''}/>)
                             ) : (
                                <p className="text-gray-400 py-4">No upcoming payments in the next 7 days.</p>
                             )}
                         </div>
                    </Card>
                    <Card>
                        <h2 className="text-lg font-bold text-white mb-2">Monthly Summary</h2>
                        <div className="space-y-2">
                             <p className="text-xs text-gray-400">Total Monthly Subscriptions</p>
                             <p className="text-3xl font-bold text-white">{formatCurrency(monthlySummary.total)}</p>
                             <div className="pt-2 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-400">Auto-pay</span><span>{formatCurrency(monthlySummary.autopay)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Manual</span><span>{formatCurrency(monthlySummary.manual)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Reminder</span><span>{formatCurrency(monthlySummary.reminder)}</span></div>
                                <div className="flex justify-between pt-2 border-t border-border-color font-bold"><span className="text-white">Total</span><span>{formatCurrency(monthlySummary.total)}</span></div>
                             </div>
                        </div>
                    </Card>
                </div>

                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-white">All Bills</h2>
                        <div className="flex gap-2">
                            <select value={sort} onChange={e => setSort(e.target.value)} className={commonSelectStyles}>
                               <option value="date-asc">Date (Asc)</option>
                               <option value="date-desc">Date (Desc)</option>
                               <option value="amount-asc">Amount (Asc)</option>
                               <option value="amount-desc">Amount (Desc)</option>
                               <option value="a-z">A-Z</option>
                            </select>
                             <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={commonSelectStyles}>
                                 {uniqueBillTypes.map(type => <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>)}
                            </select>
                             <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className={commonSelectStyles}>
                                 {uniquePaymentTypes.map(type => <option key={type} value={type}>{type === 'All' ? 'All Payment' : type}</option>)}
                            </select>
                             <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} className={commonSelectStyles}>
                               <option value="All">All Accounts</option>
                               {uniqueAccountIds.map(id => {
                                   const account = assets.find(a => a.id === id);
                                   if(!account) return null;
                                   return <option key={id} value={id}>{account.name}</option>
                               })}
                            </select>
                            <button onClick={() => handleOpenModal()} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Add New
                            </button>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredAndSortedBills.map(bill => <BillListItem key={bill.id} bill={bill} assets={assets} onEdit={handleOpenModal} className={bill.id === highlightedItemId ? 'highlight-animate' : ''} />)}
                    </div>
                </Card>

            </div>
        </>
    );
};

export default Bills;