import React, { useState, useEffect, useMemo } from 'react';
import Card from './Card';
import { Transaction, Asset, Debt, Category } from '../types';
import { format } from 'date-fns';
import { useCurrency } from '../App';
import { CloseIcon } from './icons';

interface CategorizeProps {
    transactions: Transaction[];
    onUpdateTransaction: (transaction: Transaction) => void;
    onAddRule: (rule: Omit<{
        id: string;
        keyword: string;
        categoryName?: string;
        merchantName?: string;
    }, 'id'>) => void;
    assets: Asset[];
    debts: Debt[];
    categories: Category[];
}

const CreateRuleModal: React.FC<{
    isOpen: boolean;
    onDecline: () => void;
    onConfirm: () => void;
    merchant: string;
    category: string;
}> = ({ isOpen, onDecline, onConfirm, merchant, category }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onDecline}>
            <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-md border border-border-color" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border-color">
                    <h2 className="text-xl font-bold text-white">Create a Rule?</h2>
                    <button onClick={onDecline} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-300 text-center">
                        Would you like to automatically set the merchant to <strong className="text-primary">{merchant}</strong> and category to <strong className="text-primary">{category}</strong> in the future?
                    </p>
                    <div className="flex gap-4 pt-4">
                        <button onClick={onDecline} className="w-full py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-colors">No, Thanks</button>
                        <button onClick={onConfirm} className="w-full py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 transition-colors">Create Rule</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const getSuggestions = (tx: Transaction | undefined) => {
    if (!tx) return { suggestedMerchant: '', suggestedCategory: '' };
    let suggestedMerchant = tx.merchant.split(' ')[0].charAt(0).toUpperCase() + tx.merchant.split(' ')[0].slice(1).toLowerCase();
    let suggestedCategory = 'Shopping';
    if (tx.merchant.toLowerCase().includes('starbucks')) { suggestedCategory = 'Coffee'; suggestedMerchant = 'Starbucks'; }
    if (tx.merchant.toLowerCase().includes('tfl')) { suggestedCategory = 'Transport'; suggestedMerchant = 'Transport for London'; }
    if (tx.merchant.toLowerCase().includes('amzn')) { suggestedCategory = 'Shopping'; suggestedMerchant = 'Amazon'; }
    if (tx.merchant.toLowerCase().includes('pret')) { suggestedCategory = 'Food & Dining'; suggestedMerchant = 'Pret A Manger'; }
    if (tx.merchant.toLowerCase().includes('uber')) { suggestedCategory = 'Transport'; suggestedMerchant = 'Uber'; }
    if (tx.merchant.toLowerCase().includes('sainsburys') || tx.merchant.toLowerCase().includes('tesco') || tx.merchant.toLowerCase().includes('asda') || tx.merchant.toLowerCase().includes('aldi')) {
        suggestedCategory = 'Groceries';
        if (tx.merchant.toLowerCase().includes('sainsburys')) suggestedMerchant = 'Sainsbury\'s';
        if (tx.merchant.toLowerCase().includes('tesco')) suggestedMerchant = 'Tesco';
        if (tx.merchant.toLowerCase().includes('asda')) suggestedMerchant = 'Asda';
        if (tx.merchant.toLowerCase().includes('aldi')) suggestedMerchant = 'Aldi';
    }
    if (tx.merchant.toLowerCase().includes('cineworld')) { suggestedCategory = 'Entertainment'; suggestedMerchant = 'Cineworld'; }


    return { suggestedMerchant, suggestedCategory };
};

const Categorize: React.FC<CategorizeProps> = ({ transactions: uncategorizedTxs, onUpdateTransaction, onAddRule, assets, debts, categories }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editedMerchant, setEditedMerchant] = useState('');
    const [editedCategory, setEditedCategory] = useState('');
    const [cardAnimation, setCardAnimation] = useState('');
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [pendingCategorization, setPendingCategorization] = useState<{ merchant: string; category: string; } | null>(null);

    const { formatCurrency } = useCurrency();

    const allAccounts = useMemo(() => [...assets, ...debts], [assets, debts]);
    const currentTx = useMemo(() => uncategorizedTxs[currentIndex], [uncategorizedTxs, currentIndex]);
    
    const currentAccountName = useMemo(() => {
        if (!currentTx) return '';
        const account = allAccounts.find(acc => acc.id === currentTx.accountId);
        return account?.name || 'Unknown Account';
    }, [currentTx, allAccounts]);
    
    const { suggestedMerchant, suggestedCategory } = useMemo(() => getSuggestions(currentTx), [currentTx]);

    useEffect(() => {
        if (currentTx) {
            setEditedMerchant(suggestedMerchant);
            setEditedCategory(suggestedCategory);
        }
    }, [currentTx, suggestedMerchant, suggestedCategory]);

    const advanceCard = () => {
        setCurrentIndex(prev => prev + 1);
        setCardAnimation('');
        setIsEditing(false);
    };
    
    const handleSwipe = (direction: 'right' | 'left') => {
        if (currentIndex >= uncategorizedTxs.length) return;
        const animationClass = direction === 'right'
            ? 'translate-x-full rotate-12 opacity-0'
            : '-translate-x-full -rotate-12 opacity-0';

        setCardAnimation(animationClass);

        setTimeout(() => {
            advanceCard();
        }, 300);
    };

    const handleAccept = () => {
        if (!currentTx) return;
        const merchantToSave = isEditing ? editedMerchant : suggestedMerchant;
        const categoryToSave = isEditing ? editedCategory : suggestedCategory;

        setPendingCategorization({ merchant: merchantToSave, category: categoryToSave });
        setIsRuleModalOpen(true);
    };

    const processTransactionAndAnimate = () => {
        if (!pendingCategorization || !currentTx) return;

        onUpdateTransaction({
            ...currentTx,
            category: pendingCategorization.category,
            merchant: pendingCategorization.merchant,
            logo: `https://logo.clearbit.com/${pendingCategorization.merchant.toLowerCase().replace(/ /g, '')}.com`
        });
        
        const animationClass = 'translate-x-full rotate-12 opacity-0';
        setCardAnimation(animationClass);

        setTimeout(() => {
            advanceCard();
            setPendingCategorization(null);
        }, 300);
    };
    
    const handleCreateRule = () => {
        if (pendingCategorization && currentTx) {
            onAddRule({
                keyword: currentTx.merchant,
                merchantName: pendingCategorization.merchant,
                categoryName: pendingCategorization.category,
            });
        }
        setIsRuleModalOpen(false);
        processTransactionAndAnimate();
    };

    const handleDeclineRule = () => {
        setIsRuleModalOpen(false);
        processTransactionAndAnimate();
    };

    const handleReject = () => {
        if (isEditing) {
            setIsEditing(false);
            setEditedMerchant(suggestedMerchant);
            setEditedCategory(suggestedCategory);
        } else {
            handleSwipe('left');
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const totalTransactions = uncategorizedTxs.length;
    const completedTransactions = currentIndex;
    const progress = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 100;

    return (
        <>
            <CreateRuleModal
                isOpen={isRuleModalOpen}
                onDecline={handleDeclineRule}
                onConfirm={handleCreateRule}
                merchant={pendingCategorization?.merchant || ''}
                category={pendingCategorization?.category || ''}
            />
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-white">Uncategorised Transactions</h2>
                    <p className="text-gray-500">Swipe or tap to sort</p>
                </div>
                
                 <div className="relative w-full max-w-sm h-80 mb-12">
                     {uncategorizedTxs.map((tx, index) => {
                        const position = index - currentIndex;
                        if (position < 0 || position > 2) {
                            return null;
                        }

                        const isTopCard = position === 0;
                        const cardClasses = [
                            'z-30', // Top card
                            'transform scale-95 -translate-y-4 -rotate-3 z-20', // Middle card
                            'transform scale-90 -translate-y-8 -rotate-6 z-10' // Back card
                        ];
                        
                        return (
                            <Card
                                key={tx.id}
                                className={`absolute w-full h-80 flex flex-col justify-between items-center text-center transition-all duration-300 ease-in-out ${cardClasses[position]} ${isTopCard ? cardAnimation : ''}`}
                            >
                                {isTopCard ? (
                                    <>
                                        <div>
                                            <p className="text-sm text-gray-400">{currentAccountName}</p>
                                            <p className="text-6xl font-bold text-white my-2">{formatCurrency(tx.amount)}</p>
                                            <p className="text-lg text-gray-300">{tx.merchant}</p>
                                        </div>
                                        {isEditing ? (
                                            <div className="w-full px-4">
                                                <input
                                                    type="text"
                                                    value={editedMerchant}
                                                    onChange={(e) => setEditedMerchant(e.target.value)}
                                                    className="w-full bg-gray-700 text-white text-center rounded-lg px-3 py-2 border border-gray-600 focus:border-primary outline-none transition-colors"
                                                    placeholder="Merchant Name"
                                                />
                                                <select
                                                    value={editedCategory}
                                                    onChange={(e) => setEditedCategory(e.target.value)}
                                                    className="w-full bg-gray-700 text-white text-center rounded-lg px-3 py-2 border border-gray-600 focus:border-primary outline-none transition-colors mt-2"
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm font-semibold text-primary">Suggested Merchant: {suggestedMerchant}</p>
                                                <p className="text-sm font-semibold mt-1 text-primary">Suggested Category: {suggestedCategory}</p>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500">{format(new Date(tx.date), 'dd MMM yyyy')}</p>
                                    </>
                                ) : (
                                    // Empty card content for stacked cards
                                    <div/>
                                )}
                            </Card>
                        );
                     })}
                     {currentIndex >= uncategorizedTxs.length && (
                         <Card className="w-full h-80 flex flex-col justify-center items-center text-center absolute z-10">
                            <h3 className="text-2xl font-bold text-white">All Done!</h3>
                            <p className="text-gray-400 mt-2">You've categorized all your recent transactions.</p>
                        </Card>
                     )}
                </div>
                
                {currentTx && (
                    <>
                    <div className="flex justify-center items-center gap-6">
                        <button onClick={handleReject} className="w-20 h-20 rounded-full bg-red-900/50 text-red-400 flex items-center justify-center hover:bg-red-900/70 transition-colors">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <button onClick={handleEditClick} className={`w-24 h-24 rounded-full bg-yellow-800/50 text-yellow-400 flex items-center justify-center hover:bg-yellow-800/70 transition-all duration-300 ${isEditing ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'}`}>
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                        </button>
                        <button onClick={handleAccept} className="w-20 h-20 rounded-full bg-green-900/50 text-green-400 flex items-center justify-center hover:bg-green-900/70 transition-colors">
                             <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        </button>
                    </div>

                    <div className="mt-8 text-center w-full max-w-sm">
                        <p className="text-sm text-gray-400 mb-2">{Math.max(0, totalTransactions - completedTransactions)} transactions remaining</p>
                        <div className="w-full h-1.5 bg-gray-700 rounded-full">
                            <div className="h-1.5 rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                    </>
                )}
            </div>
        </>
    );
};

export default Categorize;