import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card';
import { PlusIcon, PencilIcon, CloseIcon, CalendarIcon, RefreshIcon } from './icons';
import { RecurringPayment, Asset, Debt, User, Notification, Page } from '../types';
import { format, addDays, addWeeks, addMonths, addYears, isWithinInterval, startOfDay } from 'date-fns';
import { useCurrency } from '../App';
import UserHeader from './shared/UserHeader';

interface RecurringProps {
    payments: RecurringPayment[];
    assets: Asset[];
    debts: Debt[];
    onAddPayment: (payment: Omit<RecurringPayment, 'id'>) => void;
    onUpdatePayment: (payment: RecurringPayment) => void;
    onDeletePayment: (paymentId: string) => void;
    user: User;
    notifications: Notification[];
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

// Helper function to calculate next payment date
const calculateNextPaymentDate = (payment: RecurringPayment): Date => {
    const startDate = new Date(payment.startDate);
    const today = startOfDay(new Date());
    let nextDate = new Date(startDate);

    // If end date exists and has passed, return the end date
    if (payment.endDate) {
        const endDate = new Date(payment.endDate);
        if (endDate < today) {
            return endDate;
        }
    }

    // Calculate next occurrence based on frequency
    while (nextDate <= today) {
        switch (payment.frequency) {
            case 'Weekly':
                nextDate = addWeeks(nextDate, 1);
                break;
            case 'Monthly':
                nextDate = addMonths(nextDate, 1);
                break;
            case 'Yearly':
                nextDate = addYears(nextDate, 1);
                break;
            default:
                nextDate = addMonths(nextDate, 1);
        }
    }

    return nextDate;
};

const AddEditRecurringModal: React.FC<{ isOpen: boolean; onClose: () => void; payment?: RecurringPayment; assets: Asset[]; debts: Debt[]; onSave: (payment: any) => void; onDelete?: (paymentId: string) => void; }> = ({ isOpen, onClose, payment, assets, debts, onSave, onDelete }) => {
    const [formData, setFormData] = useState<any>({});
    const { currency } = useCurrency();
    const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';

    useEffect(() => {
        if (payment) {
            setFormData(payment);
        } else {
            setFormData({
                name: '',
                type: 'Income',
                amount: 0,
                frequency: 'Monthly',
                startDate: new Date().toISOString().split('T')[0],
            });
        }
    }, [payment, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete the recurring payment "${payment?.name}"?`)) {
            onDelete?.(payment!.id);
            onClose();
        }
    };

    const commonInputStyles = "w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none transition-colors";
    const labelStyles = "block text-sm font-medium text-gray-300 mb-2";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={payment ? 'Edit Recurring Payment' : 'Add Recurring Payment'}>
            <div className="space-y-4">
                <div><label htmlFor="name" className={labelStyles}>Payment Name</label><input type="text" id="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g., Salary, Rent, Utilities" className={commonInputStyles} /></div>
                <div>
                    <label htmlFor="fromAccountId" className={labelStyles}>{formData.type === 'Transfer' ? 'From Account' : 'Account'}</label>
                    <select id="fromAccountId" value={formData.fromAccountId || ''} onChange={handleChange} className={commonInputStyles}>
                        <option value="">Select an account</option>
                        <optgroup label="Regular Accounts">
                            {assets.filter(a => a.status === 'Active').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </optgroup>
                        <optgroup label="Debt Accounts">
                            {debts.filter(d => d.status === 'Active').map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </optgroup>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="type" className={labelStyles}>Type</label>
                        <select id="type" value={formData.type || 'Income'} onChange={handleChange} className={commonInputStyles}><option>Income</option><option>Transfer</option></select>
                    </div>
                    <div>
                        <label htmlFor="amount" className={labelStyles}>Amount</label>
                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span><input type="number" id="amount" value={formData.amount || 0} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className={`${commonInputStyles} pl-7`} /></div>
                    </div>
                </div>
                {formData.type === 'Transfer' && (
                    <div>
                        <label htmlFor="toAccountId" className={labelStyles}>To Account</label>
                        <select id="toAccountId" value={formData.toAccountId || ''} onChange={handleChange} className={commonInputStyles}>
                            <option value="">Select an account</option>
                            <optgroup label="Regular Accounts">
                                {assets.filter(a => a.status === 'Active' && a.id !== formData.fromAccountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </optgroup>
                            <optgroup label="Debt Accounts">
                                {debts.filter(d => d.status === 'Active' && d.id !== formData.fromAccountId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </optgroup>
                        </select>
                    </div>
                )}
                <div>
                    <label htmlFor="frequency" className={labelStyles}>Frequency</label>
                    <select id="frequency" value={formData.frequency || 'Monthly'} onChange={handleChange} className={commonInputStyles}><option>Weekly</option><option>Monthly</option><option>Yearly</option></select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label htmlFor="startDate" className={labelStyles}>Start Date</label><div className="relative"><input type="date" id="startDate" value={formData.startDate || ''} onChange={handleChange} className={commonInputStyles} /><CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /></div></div>
                    <div><label htmlFor="endDate" className={labelStyles}>End Date (Optional)</label><div className="relative"><input type="date" id="endDate" value={formData.endDate || ''} onChange={handleChange} className={commonInputStyles} /><CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /></div></div>
                </div>
                 {formData.type !== 'Transfer' && <div><label htmlFor="category" className={labelStyles}>Category (Optional)</label><input type="text" id="category" value={formData.category || ''} onChange={handleChange} placeholder="e.g., Housing, Transportation" className={commonInputStyles} /></div>}
                <div><label htmlFor="description" className={labelStyles}>Description (Optional)</label><textarea id="description" value={formData.description || ''} onChange={handleChange} placeholder="Additional notes about this payment..." className={`${commonInputStyles} h-24 resize-none`}></textarea></div>

                <div className="flex gap-4 pt-4">
                    {payment && onDelete && (
                        <button onClick={handleDelete} className="py-3 px-6 bg-red-600 text-white rounded-full font-semibold hover:bg-red-500 transition-colors">Delete</button>
                    )}
                    <button className="flex-1 py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors" onClick={onClose}>Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 transition-colors">{payment ? 'Update Payment' : 'Add Payment'}</button>
                </div>
            </div>
        </Modal>
    );
};

const PaymentListItem: React.FC<{ payment: RecurringPayment; assets: Asset[]; debts: Debt[]; onEdit: (payment: RecurringPayment) => void; showNextDate?: boolean; }> = ({ payment, assets, debts, onEdit, showNextDate = false }) => {
    const { formatCurrency } = useCurrency();
    const fromAccount = assets.find(a => a.id === payment.fromAccountId) || debts.find(d => d.id === payment.fromAccountId);
    const toAccount = payment.toAccountId ? (assets.find(a => a.id === payment.toAccountId) || debts.find(d => d.id === payment.toAccountId)) : null;
    const typeColor = payment.type === 'Income' ? 'text-primary' : payment.type === 'Expense' ? 'text-red-400' : 'text-blue-400';
    const nextPaymentDate = calculateNextPaymentDate(payment);

    return (
        <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
                 <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 bg-gray-700">
                    <RefreshIcon className={`w-6 h-6 ${typeColor}`} />
                </div>
                <div>
                    <p className="font-semibold text-white">{payment.name}</p>
                    <p className="text-xs text-gray-400">
                       {payment.type === 'Transfer'
                            ? `${fromAccount?.name} to ${toAccount?.name}`
                            : fromAccount?.name} • {payment.frequency}
                    </p>
                     {showNextDate && <p className="text-xs text-gray-500 font-semibold mt-0.5">Next: {format(nextPaymentDate, 'MMM dd, yyyy')}</p>}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className={`font-bold text-white text-sm ${payment.type === 'Income' ? 'text-primary' : ''}`}>{payment.type === 'Income' ? '+' : '-'}{formatCurrency(payment.amount).replace(/[+-]/g, '')}</p>
                     <p className={`text-xs font-semibold ${typeColor}`}>{payment.type}</p>
                </div>
                <button onClick={() => onEdit(payment)} className="p-2 text-gray-500 hover:text-white hover:bg-green-600 rounded-lg transition-colors"><PencilIcon className="w-4 h-4" /></button>
            </div>
        </div>
    )
}

const Recurring: React.FC<RecurringProps> = ({ payments, assets, debts, onAddPayment, onUpdatePayment, onDeletePayment, user, notifications, onUpdateUser, onMarkAllNotificationsRead, onNotificationClick, navigateTo, theme, onToggleTheme }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<RecurringPayment | undefined>(undefined);
    const [sort, setSort] = useState('date-asc');
    const [typeFilter, setTypeFilter] = useState('All');
    const { formatCurrency } = useCurrency();

    const handleOpenModal = (payment?: RecurringPayment) => {
        setSelectedPayment(payment);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPayment(undefined);
    };

    const handleSave = (data: any) => {
        if (data.id) {
            onUpdatePayment(data);
        } else {
            onAddPayment(data);
        }
    };

    // Filter out expense-type recurring payments (they should be in Bills section)
    const nonExpensePayments = useMemo(() => {
        return payments.filter(p => p.type !== 'Expense');
    }, [payments]);

    // Monthly Summary
    const monthlySummary = useMemo(() => {
        const monthly = nonExpensePayments.filter(p => p.frequency === 'Monthly').reduce((sum, p) => {
            if (p.type === 'Income') return sum + p.amount;
            return sum - p.amount;
        }, 0);

        const weekly = nonExpensePayments.filter(p => p.frequency === 'Weekly').reduce((sum, p) => {
            const monthlyEquiv = (p.amount * 52) / 12;
            if (p.type === 'Income') return sum + monthlyEquiv;
            return sum - monthlyEquiv;
        }, 0);

        const yearly = nonExpensePayments.filter(p => p.frequency === 'Yearly').reduce((sum, p) => {
            const monthlyEquiv = p.amount / 12;
            if (p.type === 'Income') return sum + monthlyEquiv;
            return sum - monthlyEquiv;
        }, 0);

        const total = monthly + weekly + yearly;
        const income = nonExpensePayments.filter(p => p.type === 'Income').reduce((sum, p) => {
            let monthlyAmount = p.amount;
            if (p.frequency === 'Weekly') monthlyAmount = (p.amount * 52) / 12;
            if (p.frequency === 'Yearly') monthlyAmount = p.amount / 12;
            return sum + monthlyAmount;
        }, 0);
        const transfers = nonExpensePayments.filter(p => p.type === 'Transfer').reduce((sum, p) => {
            let monthlyAmount = p.amount;
            if (p.frequency === 'Weekly') monthlyAmount = (p.amount * 52) / 12;
            if (p.frequency === 'Yearly') monthlyAmount = p.amount / 12;
            return sum + monthlyAmount;
        }, 0);

        return { total, income, transfers };
    }, [nonExpensePayments]);

    // Upcoming Payments (next 7 days)
    const upcomingPayments = useMemo(() => {
        const today = startOfDay(new Date());
        const sevenDaysFromNow = addDays(today, 7);

        return nonExpensePayments
            .map(p => ({
                payment: p,
                nextDate: calculateNextPaymentDate(p)
            }))
            .filter(({ nextDate }) => isWithinInterval(nextDate, { start: today, end: sevenDaysFromNow }))
            .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
            .map(({ payment }) => payment);
    }, [nonExpensePayments]);

    // All Payments sorted and filtered
    const sortedPayments = useMemo(() => {
        let filtered = [...nonExpensePayments];

        // Filter by type
        if (typeFilter !== 'All') {
            filtered = filtered.filter(p => p.type === typeFilter);
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sort) {
                case 'date-asc':
                    return calculateNextPaymentDate(a).getTime() - calculateNextPaymentDate(b).getTime();
                case 'date-desc':
                    return calculateNextPaymentDate(b).getTime() - calculateNextPaymentDate(a).getTime();
                case 'amount-asc':
                    return a.amount - b.amount;
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'a-z':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [nonExpensePayments, sort, typeFilter]);

    const uniqueTypes = ['All', ...Array.from(new Set(nonExpensePayments.map(p => p.type)))];
    const commonSelectStyles = "bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-primary outline-none";

    return (
        <>
        <AddEditRecurringModal isOpen={isModalOpen} onClose={handleCloseModal} payment={selectedPayment} assets={assets} debts={debts} onSave={handleSave} onDelete={onDeletePayment} />
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Recurring Payments</h1>
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

            {/* Upcoming Payments and Monthly Summary - Swapped positions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Upcoming Payments */}
                <Card className="md:col-span-2">
                    <h2 className="text-lg font-bold text-white mb-4">Upcoming Payments (Next 7 Days)</h2>
                    <div className="divide-y divide-border-color">
                        {upcomingPayments.length > 0 ? (
                            upcomingPayments.map(p => <PaymentListItem key={p.id} payment={p} assets={assets} debts={debts} onEdit={handleOpenModal} showNextDate={true} />)
                        ) : (
                            <p className="text-gray-400 py-4 text-left text-sm">No payments due in the next 7 days.</p>
                        )}
                    </div>
                </Card>

                {/* Monthly Summary */}
                <Card>
                    <h2 className="text-lg font-bold text-white mb-2">Monthly Summary</h2>
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400">Total Monthly Net</p>
                        <p className={`text-3xl font-bold ${monthlySummary.total >= 0 ? 'text-primary' : 'text-red-400'}`}>{formatCurrency(monthlySummary.total)}</p>
                        <div className="pt-2 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-400">Income</span><span className="text-primary">{formatCurrency(monthlySummary.income)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Transfers</span><span className="text-white">{formatCurrency(monthlySummary.transfers)}</span></div>
                            <div className="flex justify-between pt-2 border-t border-border-color font-bold"><span className="text-white">Net</span><span className={monthlySummary.total >= 0 ? 'text-primary' : 'text-red-400'}>{formatCurrency(monthlySummary.total)}</span></div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* All Payments */}
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white">All Payments</h2>
                    <div className="flex gap-2">
                        <select value={sort} onChange={e => setSort(e.target.value)} className={commonSelectStyles}>
                           <option value="date-asc">Date (Asc)</option>
                           <option value="date-desc">Date (Desc)</option>
                           <option value="amount-asc">Amount (Asc)</option>
                           <option value="amount-desc">Amount (Desc)</option>
                           <option value="a-z">A-Z</option>
                        </select>
                         <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={commonSelectStyles}>
                             {uniqueTypes.map(type => <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>)}
                        </select>
                        <button onClick={() => handleOpenModal()} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add New
                        </button>
                    </div>
                </div>
                <div className="divide-y divide-border-color">
                    {sortedPayments.length > 0 ? (
                        sortedPayments.map(p => <PaymentListItem key={p.id} payment={p} assets={assets} debts={debts} onEdit={handleOpenModal} showNextDate={true} />)
                    ) : (
                        <p className="text-gray-400 py-8 text-left">No recurring payments set up yet.</p>
                    )}
                </div>
            </Card>
        </div>
        </>
    );
};

export default Recurring;
