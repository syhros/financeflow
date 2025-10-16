import React, { useState, useMemo, useEffect } from 'react';
import Card from './Card';
import { PlusIcon, PencilIcon, CloseIcon, CalendarIcon, LinkIcon, UnlinkIcon } from './icons';
import { Goal, Asset } from '../types';
import { format, differenceInMonths } from 'date-fns';
import { useCurrency } from '../App';

interface GoalsProps {
    goals: Goal[];
    assets: Asset[];
    onAddGoal: (goal: Omit<Goal, 'id'>) => void;
    onUpdateGoal: (goal: Goal) => void;
    highlightedItemId: string | null;
    setHighlightedItemId: (id: string | null) => void;
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-4xl border border-border-color overflow-hidden" onClick={(e) => e.stopPropagation()}>
           <div className="flex justify-between items-center p-4 border-b border-border-color">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
           </div>
           <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    );
};

const AddEditGoalModal: React.FC<{ isOpen: boolean; onClose: () => void; goal?: Goal; assets: Asset[]; onSave: (goal: any) => void; }> = ({ isOpen, onClose, goal, assets, onSave }) => {
    const [formData, setFormData] = useState<any>({});
    const { formatCurrency, currency } = useCurrency();
    const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';
    
    useEffect(() => {
        if(goal) {
            setFormData(goal);
        } else {
            setFormData({
                name: '',
                targetAmount: 0,
                targetDate: '',
                description: '',
                linkedAccountIds: [],
                allocations: {}
            });
        }
    }, [goal, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({...formData, [e.target.id]: e.target.value});
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, targetAmount: parseFloat(e.target.value) || 0});
    };
    
    const toggleLinkAccount = (accountId: string) => {
        setFormData((prev: Goal) => {
            const currentlyLinked = prev.linkedAccountIds.includes(accountId);
            const newLinkedIds = currentlyLinked ? prev.linkedAccountIds.filter(id => id !== accountId) : [...prev.linkedAccountIds, accountId];
            const newAllocations = {...prev.allocations};
            if(currentlyLinked) {
                delete newAllocations[accountId];
            } else {
                newAllocations[accountId] = 100;
            }
            return {...prev, linkedAccountIds: newLinkedIds, allocations: newAllocations};
        });
    };

    const handleAllocationChange = (accountId: string, value: number) => {
        const percentage = Math.max(0, Math.min(100, value));
        setFormData((prev: Goal) => ({
            ...prev,
            allocations: {...prev.allocations, [accountId]: percentage}
        }));
    };
    
    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    const totalSaved = useMemo(() => {
        if (!formData.linkedAccountIds) return 0;
        return formData.linkedAccountIds.reduce((total: number, id: string) => {
            const account = assets.find(a => a.id === id);
            if (!account) return total;
            const percentage = formData.allocations[id] || 0;
            return total + (account.balance * (percentage / 100));
        }, 0);
    }, [formData, assets]);

    const commonInputStyles = "w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none transition-colors";
    const labelStyles = "block text-sm font-medium text-gray-300 mb-2";
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={goal ? 'Edit Goal' : 'Add New Goal'}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className={labelStyles}>Goal Name</label>
                        <input type="text" id="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g., Emergency Fund" className={commonInputStyles} />
                    </div>
                    <div>
                        <label htmlFor="targetAmount" className={labelStyles}>Target Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{currencySymbol}</span>
                            <input type="number" id="targetAmount" value={formData.targetAmount || 0} onChange={handleAmountChange} placeholder="500" className={`${commonInputStyles} pl-7`} />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="targetDate" className={labelStyles}>Target Date</label>
                         <div className="relative">
                            <input type="date" id="targetDate" value={formData.targetDate || ''} onChange={handleChange} className={commonInputStyles} />
                            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                       <label htmlFor="description" className={labelStyles}>Description (Optional)</label>
                       <textarea id="description" value={formData.description || ''} onChange={handleChange} placeholder="Describe your goal..." className={commonInputStyles + " h-24 resize-none"}></textarea>
                    </div>
                    <div>
                        <h3 className={labelStyles}>Link Accounts (Optional)</h3>
                        <p className="text-xs text-gray-500 mb-3">Link accounts to automatically track progress.</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                           {assets.filter(a => a.status === 'Active').map(asset => (
                               <div key={asset.id} className={`flex justify-between items-center p-3 rounded-lg ${formData.linkedAccountIds?.includes(asset.id) ? 'bg-gray-600' : 'bg-gray-800'}`}>
                                   <span className="text-white">{asset.name} ({formatCurrency(asset.balance)})</span>
                                   <button onClick={() => toggleLinkAccount(asset.id)} className={`p-1 rounded-full ${formData.linkedAccountIds?.includes(asset.id) ? 'text-primary' : 'text-gray-400 hover:text-white'}`}>
                                       {formData.linkedAccountIds?.includes(asset.id) ? <UnlinkIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                   </button>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Account Allocations</h3>
                        <p className={labelStyles + " mt-0"}>ALLOCATION PERCENTAGES</p>
                    </div>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                       {formData.linkedAccountIds?.map((id: string) => {
                            const account = assets.find(a => a.id === id);
                            if (!account) return null;
                            const allocation = formData.allocations[id] || 0;
                            const allocatedAmount = account.balance * (allocation / 100);
                            return (
                                <Card key={id}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-white">{account.name}</span>
                                        <span className="text-primary font-semibold">{formatCurrency(allocatedAmount)}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-2">Balance: {formatCurrency(account.balance)}</p>
                                    <input type="range" min="0" max="100" value={allocation} onChange={(e) => handleAllocationChange(id, parseInt(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                                     <div className="flex items-center mt-2">
                                        <input type="number" value={allocation} onChange={(e) => handleAllocationChange(id, parseInt(e.target.value))} className="w-20 bg-gray-800 text-white text-center rounded-md border border-gray-600 p-1 text-sm"/>
                                        <span className="text-gray-400 text-sm ml-2">% allocated</span>
                                    </div>
                                </Card>
                            )
                       })}
                       {formData.linkedAccountIds?.length === 0 && <p className="text-gray-500 text-center py-10">Link an account to set allocations.</p>}
                    </div>
                    <Card className="flex justify-between items-center">
                        <span className="font-bold text-white">Total Saved:</span>
                        <span className="text-2xl font-bold text-white">{formatCurrency(totalSaved)}</span>
                    </Card>
                </div>
            </div>
            <div className="flex gap-4 pt-6 border-t border-border-color mt-6">
                <button className="w-full py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors" onClick={onClose}>Cancel</button>
                <button onClick={handleSave} className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 transition-colors">{goal ? 'Update Goal' : 'Add Goal'}</button>
            </div>
        </Modal>
    );
};


const GoalCard: React.FC<{ goal: Goal; assets: Asset[]; onEdit: (goal: Goal) => void, className?: string; }> = ({ goal, assets, onEdit, className }) => {
    const { formatCurrency } = useCurrency();
    const totalSaved = useMemo(() => {
        return goal.linkedAccountIds.reduce((total, id) => {
            const account = assets.find(a => a.id === id);
            if (!account) return total;
            const percentage = goal.allocations[id] || 0;
            return total + (account.balance * (percentage / 100));
        }, 0);
    }, [goal, assets]);

    const progress = goal.targetAmount > 0 ? (totalSaved / goal.targetAmount) * 100 : 0;
    const displayProgress = Math.min(progress, 100);
    const monthsLeft = goal.targetDate ? differenceInMonths(new Date(goal.targetDate), new Date()) : 0;
    
    return (
        <Card className={`relative ${className}`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-primary"></div>
                    <h3 className="text-lg font-bold text-white uppercase">{goal.name}</h3>
                </div>
                 <button onClick={() => onEdit(goal)} className="text-gray-400 hover:text-white"><PencilIcon className="w-4 h-4" /></button>
            </div>
            {goal.linkedAccountIds.length > 0 && <p className="text-xs text-primary mb-2 font-semibold">🔗 Linked to {goal.linkedAccountIds.length} accounts</p>}
            
            <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span><span>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-primary h-2.5 rounded-full" style={{ width: `${displayProgress}%` }}></div></div>
            </div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <p className="text-sm text-gray-400">Total Saved</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(totalSaved)}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400">Target</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(goal.targetAmount)}</p>
                </div>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
                 <div>
                    {goal.targetDate && <>
                        <svg className="h-3 w-3 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>Target: {format(new Date(goal.targetDate), 'dd/MM/yyyy')}</span>
                    </>}
                </div>
                {monthsLeft > 0 && <span className="text-primary font-semibold">{monthsLeft} months left</span>}
            </div>
        </Card>
    );
};


const Goals: React.FC<GoalsProps> = ({ goals, assets, onAddGoal, onUpdateGoal, highlightedItemId, setHighlightedItemId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | undefined>(undefined);

    useEffect(() => {
        if (highlightedItemId) {
            const timer = setTimeout(() => {
                setHighlightedItemId(null);
            }, 3000); // Animation is 3s
            return () => clearTimeout(timer);
        }
    }, [highlightedItemId, setHighlightedItemId]);

    const handleOpenModal = (goal?: Goal) => {
        setSelectedGoal(goal);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedGoal(undefined);
    }

    const handleSave = (data: any) => {
        if (data.id) {
            onUpdateGoal(data);
        } else {
            onAddGoal(data);
        }
    }

    return (
        <>
        <AddEditGoalModal isOpen={isModalOpen} onClose={handleCloseModal} goal={selectedGoal} assets={assets} onSave={handleSave} />
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Goals</h1>
                <button onClick={() => handleOpenModal()} className="flex items-center bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add New Goal
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {goals.map(goal => <GoalCard key={goal.id} goal={goal} assets={assets} onEdit={handleOpenModal} className={goal.id === highlightedItemId ? 'highlight-animate' : ''} />)}
                <button onClick={() => handleOpenModal()} className="w-full h-full p-4 border-2 border-dashed border-gray-600 rounded-2xl text-gray-400 hover:border-primary hover:text-primary transition-colors flex flex-col items-center justify-center min-h-[200px]">
                    <PlusIcon className="h-8 w-8" />
                    <span className="mt-2 font-semibold">Add New Goal</span>
                </button>
            </div>
        </div>
        </>
    );
};

export default Goals;