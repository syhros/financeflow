import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [pendingCategorization, setPendingCategorization] = useState<{ merchant: string; category: string; } | null>(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const cardStackRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);

    const { formatCurrency } = useCurrency();

    const allAccounts = useMemo(() => [...assets, ...debts], [assets, debts]);
    const currentTx = uncategorizedTxs[currentIndex] || null;

    const currentAccountName = useMemo(() => {
        if (!currentTx) return '';
        const account = allAccounts.find(acc => acc.id === currentTx.accountId);
        return account?.name || 'Unknown Account';
    }, [currentTx, allAccounts]);

    const { suggestedMerchant, suggestedCategory } = useMemo(() => getSuggestions(currentTx || undefined), [currentTx]);

    useEffect(() => {
        if (currentTx) {
            setEditedMerchant(suggestedMerchant);
            setEditedCategory(suggestedCategory);
        }
    }, [currentTx, suggestedMerchant, suggestedCategory]);

    const advanceCard = () => {
        setCurrentIndex(prev => Math.min(prev + 1, uncategorizedTxs.length));
        setIsEditing(false);
        setDragOffset(0);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!cardStackRef.current || isEditing) return;
        setIsDragging(true);
        startXRef.current = e.clientX;
        setDragOffset(0);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !cardStackRef.current) return;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        animationFrameRef.current = requestAnimationFrame(() => {
            const delta = e.clientX - startXRef.current;
            setDragOffset(delta);
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

        setIsDragging(false);

        const threshold = 100;
        const delta = dragOffset;

        if (Math.abs(delta) > threshold) {
            const direction = Math.sign(delta);
            if (direction > 0) {
                handleAcceptCard();
            } else {
                handleRejectCard();
            }
        } else {
            setDragOffset(0);
        }
    };

    const handleAcceptCard = () => {
        if (!currentTx) return;
        const merchantToSave = isEditing ? editedMerchant : suggestedMerchant;
        const categoryToSave = isEditing ? editedCategory : suggestedCategory;

        setPendingCategorization({ merchant: merchantToSave, category: categoryToSave });
        setIsRuleModalOpen(true);

        setTimeout(() => {
            processTransactionAndAnimate();
        }, 100);
    };

    const handleRejectCard = () => {
        if (isEditing) {
            setIsEditing(false);
            setEditedMerchant(suggestedMerchant);
            setEditedCategory(suggestedCategory);
            setDragOffset(0);
        } else {
            advanceCard();
        }
    };

    const processTransactionAndAnimate = () => {
        if (!pendingCategorization || !currentTx) return;

        onUpdateTransaction({
            ...currentTx,
            category: pendingCategorization.category,
            merchant: pendingCategorization.merchant,
            logo: `https://logo.clearbit.com/${pendingCategorization.merchant.toLowerCase().replace(/ /g, '')}.com`
        });

        setPendingCategorization(null);
        advanceCard();
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
    };

    const handleDeclineRule = () => {
        setIsRuleModalOpen(false);
    };

    const handleReject = () => {
        handleRejectCard();
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const totalTransactions = uncategorizedTxs.length;
    const completedTransactions = currentIndex;
    const progress = totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 100;

    const overlayOpacity = dragOffset !== 0 ? Math.min(Math.abs(dragOffset) / 200, 0.5) : 0;
    const isSwipingRight = dragOffset > 0;

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
                    <p className="text-gray-500">Swipe left or right to sort</p>
                </div>

                <div
                    ref={cardStackRef}
                    className="relative w-full max-w-sm h-96 mb-12 touch-none select-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    {uncategorizedTxs.map((tx, index) => {
                        const position = index - currentIndex;
                        if (position < 0 || position > 2) return null;

                        const isTopCard = position === 0;
                        const offset = position + 1;
                        const zIndex = 100 - offset;
                        const stackOffsetY = 7 * offset;
                        const stackOffsetZ = -12 * offset;

                        return (
                            <div
                                key={tx.id}
                                className={`absolute w-full h-96 transition-all ${
                                    isDragging && isTopCard ? 'duration-0' : 'duration-300'
                                }`}
                                style={{
                                    zIndex: zIndex,
                                    transform: isTopCard && isDragging
                                        ? `perspective(700px) translateZ(${stackOffsetZ}px) translateY(${stackOffsetY}px) translateX(${dragOffset}px) rotateY(${dragOffset * 0.1}deg)`
                                        : `perspective(700px) translateZ(${stackOffsetZ}px) translateY(${stackOffsetY}px) translateX(0px) rotateY(0deg)`,
                                }}
                            >
                                <Card
                                    className="w-full h-96 flex flex-col justify-between items-center text-center relative"
                                >
                                    {isTopCard && isDragging && (
                                        <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden z-20">
                                            {isSwipingRight && (
                                                <div
                                                    className="absolute inset-0 bg-green-500 transition-opacity"
                                                    style={{ opacity: overlayOpacity }}
                                                />
                                            )}
                                            {!isSwipingRight && (
                                                <div
                                                    className="absolute inset-0 bg-red-500 transition-opacity"
                                                    style={{ opacity: overlayOpacity }}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {isTopCard && (
                                        <>
                                            <div className="relative z-10 pt-6">
                                                <p className="text-sm text-gray-400">{currentAccountName}</p>
                                                <p className="text-6xl font-bold text-white my-2">{formatCurrency(tx.amount)}</p>

                                                <div className="flex items-center justify-center gap-3 mt-3 mb-2">
                                                    {tx.type === 'income' ? (
                                                        <div className="bg-green-500/20 px-3 py-1 rounded-full">
                                                            <span className="text-sm font-semibold text-green-300">Income</span>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-red-500/20 px-3 py-1 rounded-full">
                                                            <span className="text-sm font-semibold text-red-300">Expense</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <p className="text-lg text-gray-300">{tx.merchant}</p>
                                            </div>

                                            {isEditing ? (
                                                <div className="relative z-10 w-full px-4 pb-4 space-y-3">
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
                                                        className="w-full bg-gray-700 text-white text-center rounded-lg px-3 py-2 border border-gray-600 focus:border-primary outline-none transition-colors"
                                                    >
                                                        <option value="">Select Category</option>
                                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                            ) : (
                                                <div className="relative z-10 pb-4">
                                                    <p className="text-sm font-semibold text-primary">Suggested: {suggestedMerchant}</p>
                                                    <p className="text-sm font-semibold mt-1 text-primary">Category: {suggestedCategory}</p>
                                                </div>
                                            )}

                                            <p className="relative z-10 text-xs text-gray-500">{format(new Date(tx.date), 'dd MMM yyyy')}</p>
                                        </>
                                    )}
                                </Card>
                            </div>
                        );
                    })}

                    {currentIndex >= uncategorizedTxs.length && (
                        <Card className="w-full h-96 flex flex-col justify-center items-center text-center absolute z-10">
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
                        <button onClick={handleAcceptCard} className="w-20 h-20 rounded-full bg-green-900/50 text-green-400 flex items-center justify-center hover:bg-green-900/70 transition-colors">
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
