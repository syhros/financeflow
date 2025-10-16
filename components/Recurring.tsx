import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card';
import { PlusIcon, PencilIcon, CloseIcon, CalendarIcon, RefreshIcon } from './icons';
import { RecurringPayment, Asset, Debt } from '../types';
import { format } from 'date-fns';
import { useCurrency } from '../App';

interface RecurringProps {
    payments: RecurringPayment[];
    assets: Asset[];
    debts: Debt[];
    onAddPayment: (payment: Omit<RecurringPayment, 'id'>) => void;
    onUpdatePayment: (payment: RecurringPayment) => void;
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

const AddEditRecurringModal: React.FC<{ isOpen: boolean; onClose: () => void; payment?: RecurringPayment; assets: Asset[]; debts: Debt[]; onSave: (payment: any) => void; }> = ({ isOpen, onClose, payment, assets, debts, onSave }) => {
    const [formData, setFormData] = useState<any>({});
    const { currency } = useCurrency();
    const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';

    useEffect(() => {
        if (payment) {
            setFormData(payment);
        } else {
            setFormData({
                name: '',
                type: 'Expense',
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
                        <select id="type" value={formData.type || 'Expense'} onChange={handleChange} className={commonInputStyles}><option>Expense</option><option>Income</option><option>Transfer</option></select>
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

                <div className="flex gap-4 pt-4"><button className="w-full py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors" onClick={onClose}>Cancel</button><button onClick={handleSave} className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 transition-colors">{payment ? 'Update Payment' : 'Add Payment'}</button></div>
            </div>
        </Modal>
    );
};

const PaymentListItem: React.FC<{ payment: RecurringPayment; assets: Asset[]; debts: Debt[]; onEdit: (payment: RecurringPayment) => void; }> = ({ payment, assets, debts, onEdit }) => {
    const { formatCurrency } = useCurrency();
    const fromAccount = assets.find(a => a.id === payment.fromAccountId) || debts.find(d => d.id === payment.fromAccountId);
    const toAccount = payment.toAccountId ? (assets.find(a => a.id === payment.toAccountId) || debts.find(d => d.id === payment.toAccountId)) : null;
    const typeColor = payment.type === 'Income' ? 'text-primary' : payment.type === 'Expense' ? 'text-red-400' : 'text-blue-400';

    return (
        <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
                 <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 bg-gray-700">
                    <RefreshIcon className={`w-6 h-6 ${typeColor}`} />
                </div>
                <div>
                    <p className="font-semibold text-white">{payment.name}</p>
                    <p className="text-xs text-gray-400">
                       {payment.type === 'Transfer' ? `${fromAccount?.name} → ${toAccount?.name}` : fromAccount?.name}
                    </p>
                     <p className="text-xs text-gray-500 font-semibold mt-0.5">{payment.frequency}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className={`font-bold text-white text-sm ${payment.type === 'Income' ? 'text-primary' : ''}`}>{payment.type === 'Income' ? '+' : '-'}{formatCurrency(payment.amount).replace(/[+-]/g, '')}</p>
                     <p className={`text-xs font-semibold ${typeColor}`}>{payment.type}</p>
                </div>
                <button onClick={() => onEdit(payment)} className="text-gray-500 hover:text-white"><PencilIcon className="w-4 h-4" /></button>
            </div>
        </div>
    )
}

const Recurring: React.FC<RecurringProps> = ({ payments, assets, debts, onAddPayment, onUpdatePayment }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<RecurringPayment | undefined>(undefined);

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

    return (
        <>
        <AddEditRecurringModal isOpen={isModalOpen} onClose={handleCloseModal} payment={selectedPayment} assets={assets} debts={debts} onSave={handleSave} />
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Recurring Payments</h1>
                <button onClick={() => handleOpenModal()} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Payment
                </button>
            </div>
            <Card>
                <div className="divide-y divide-border-color">
                    {payments.length > 0 ? (
                        payments.map(p => <PaymentListItem key={p.id} payment={p} assets={assets} debts={debts} onEdit={handleOpenModal} />)
                    ) : (
                        <p className="text-gray-400 py-8 text-center">No recurring payments set up yet.</p>
                    )}
                </div>
            </Card>
        </div>
        </>
    );
};

export default Recurring;
