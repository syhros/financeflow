import React, { useState, useMemo, useRef, useEffect } from 'react';
import Card from './Card';
import { Page, Asset, Debt, Bill, Transaction, User, Notification, NotificationType } from '../types';
import { BalanceChart } from './charts';
import { BellIcon, iconMap } from './icons';
import { format, addDays, isWithinInterval, formatDistanceToNow } from 'date-fns';
import { useCurrency } from '../App';
import { generateAssetChartData, generateDebtChartData, generateNetWorthChartData } from '../utils/chartUtils';
import { ProfileModal, AccountSelectionModal, NotificationsPopout } from './shared/UserModals';

// Custom hook to detect clicks outside a component
const useOutsideClick = (ref: React.RefObject<HTMLDivElement>, callback: () => void) => {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, callback]);
};

const TransactionSummaryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
}> = ({ isOpen, onClose, transactions }) => {
    const { formatCurrency } = useCurrency();
    const summary = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            if (tx.type === 'income') acc.income += tx.amount;
            else if (tx.type === 'expense') acc.expense += tx.amount;
            return acc;
        }, { income: 0, expense: 0 });
    }, [transactions]);

    const netChange = summary.income - summary.expense;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-3xl border border-border-color overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-border-color">
                    <h2 className="text-xl font-bold text-white">Transactions Since Last Visit</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[80vh]">
                    <div className="lg:col-span-2 overflow-y-auto pr-2 space-y-2">
                         {transactions.map(tx => (
                            <div key={tx.id} className="flex items-center justify-between py-2">
                                <div className="flex items-center">
                                     <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 bg-gray-700">
                                        <img src={tx.logo} alt={tx.merchant} className="w-6 h-6 rounded-md object-contain p-0.5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-sm">{tx.merchant}</p>
                                        <p className="text-xs text-gray-400">{format(new Date(tx.date), 'dd MMM, p')}</p>
                                    </div>
                                </div>
                                <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-primary' : 'text-white'}`}>
                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount).replace(/[+-]/g, '')}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-1">
                        <Card>
                             <h3 className="text-lg font-bold text-white mb-4">Summary</h3>
                             <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center"><span className="text-gray-400">Income</span><span className="font-semibold text-primary">{formatCurrency(summary.income)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-gray-400">Expenses</span><span className="font-semibold text-white">{formatCurrency(summary.expense)}</span></div>
                                <div className="flex justify-between items-center pt-2 border-t border-border-color"><span className="text-white font-bold">Net Change</span><span className={`font-bold ${netChange >= 0 ? 'text-primary' : 'text-red-400'}`}>{formatCurrency(netChange)}</span></div>
                             </div>
                        </Card>
                    </div>
                </div>
                 <div className="p-4 border-t border-border-color">
                    <button onClick={onClose} className="w-full py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
};


const TimeFilterButton: React.FC<{ period: string; activePeriod: string; onClick: () => void;}> = ({ period, activePeriod, onClick }) => (
    <button onClick={onClick} className={`px-3 py-1 text-sm rounded-md transition-colors ${ activePeriod === period ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
        {period}
    </button>
);

interface DashboardProps {
    navigateTo: (page: Page) => void;
    assets: Asset[];
    debts: Debt[];
    bills: Bill[];
    transactions: Transaction[];
    user: User;
    onUpdateUser: (user: User) => void;
    notifications: Notification[];
    onMarkAllNotificationsRead: () => void;
    onNotificationClick: (notification: Notification) => void;
    isSummaryModalOpen: boolean;
    summaryTransactions: Transaction[];
    onCloseSummaryModal: () => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
    const { navigateTo, assets, debts, bills, transactions, user, onUpdateUser, notifications, onMarkAllNotificationsRead, onNotificationClick, isSummaryModalOpen, summaryTransactions, onCloseSummaryModal, theme, onToggleTheme } = props;
    const [balanceType, setBalanceType] = useState<'assets' | 'debts' | 'networth'>('networth');
    const [timePeriod, setTimePeriod] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Month');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isAccountSelectionOpen, setIsAccountSelectionOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const profileModalRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    useOutsideClick(profileModalRef, () => setIsProfileModalOpen(false));
    useOutsideClick(notificationsRef, () => setIsNotificationsOpen(false));
    
    const { formatCurrency } = useCurrency();

    const totalAssets = useMemo(() => assets.filter(a => a.status === 'Active').reduce((sum, acc) => sum + acc.balance, 0), [assets]);
    const totalDebts = useMemo(() => debts.filter(d => d.status === 'Active').reduce((sum, acc) => sum + acc.balance, 0), [debts]);
    const netWorth = useMemo(() => totalAssets - totalDebts, [totalAssets, totalDebts]);
    const unreadNotificationsCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const getChartData = () => {
        const timeFrameMap = { Day: 'day' as const, Week: 'week' as const, Month: 'month' as const, Year: 'year' as const };
        const timeFrame = timeFrameMap[timePeriod];

        if (balanceType === 'assets') {
            return generateAssetChartData(transactions, assets, timeFrame);
        } else if (balanceType === 'debts') {
            return generateDebtChartData(transactions, debts, timeFrame);
        } else {
            return generateNetWorthChartData(transactions, assets, debts, timeFrame);
        }
    }

    const upcomingBills = bills.filter(bill => {
        const today = new Date();
        const nextWeek = addDays(today, 7);
        return isWithinInterval(new Date(bill.dueDate), { start: today, end: nextWeek });
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    // Get displayed accounts based on user selection
    const getDisplayedAccounts = () => {
        const activeAssets = assets.filter(a => a.status === 'Active');
        const activeDebts = debts.filter(d => d.status === 'Active');

        if (!user.accountSelection || user.accountSelection.mode === 'automatic') {
            const assetCount = user.accountSelection?.automaticCounts.assets || 7;
            const debtCount = user.accountSelection?.automaticCounts.debts || 7;

            const topAssets = [...activeAssets].sort((a,b) => b.balance - a.balance).slice(0, assetCount);
            const topDebts = [...activeDebts].sort((a,b) => b.balance - a.balance).slice(0, debtCount);

            return { displayedAssets: topAssets, displayedDebts: topDebts };
        } else {
            const displayedAssets = activeAssets.filter(a => user.accountSelection!.selectedAssetIds.includes(a.id!));
            const displayedDebts = activeDebts.filter(d => user.accountSelection!.selectedDebtIds.includes(d.id!));

            return { displayedAssets, displayedDebts };
        }
    };

    const { displayedAssets, displayedDebts } = getDisplayedAccounts();
    const topAssets = displayedAssets;
    const topDebts = displayedDebts;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <TransactionSummaryModal isOpen={isSummaryModalOpen} onClose={onCloseSummaryModal} transactions={summaryTransactions} />
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 mt-1">Welcome back, {user.name.split(' ')[0]}!</p>
                </div>
                <div className="flex items-center gap-4">
                    <div ref={notificationsRef} className="relative">
                        <button onClick={() => setIsNotificationsOpen(prev => !prev)} className="text-gray-400 hover:text-white relative">
                            <BellIcon className="h-6 w-6" />
                            {unreadNotificationsCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-white ring-2 ring-base-bg">{unreadNotificationsCount}</span>
                            )}
                        </button>
                        <NotificationsPopout isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} notifications={notifications} onMarkAllRead={onMarkAllNotificationsRead} onNotificationClick={onNotificationClick} />
                    </div>
                     <div ref={profileModalRef}>
                        <button onClick={() => setIsProfileModalOpen(true)} title="Go to Settings">
                            <img src={user.avatarUrl} alt="Profile" className="w-10 h-10 rounded-full border-2 border-primary"/>
                        </button>
                        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={user} onUpdateUser={onUpdateUser} navigateTo={navigateTo} theme={theme} onToggleTheme={onToggleTheme} onOpenAccountSelection={() => setIsAccountSelectionOpen(true)} />
                        <AccountSelectionModal isOpen={isAccountSelectionOpen} onClose={() => setIsAccountSelectionOpen(false)} user={user} assets={assets} debts={debts} onUpdateUser={onUpdateUser} />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="flex flex-col justify-center">
                            <p className="text-gray-400">Total balance</p>
                            <p className="text-4xl font-bold text-white my-2">{formatCurrency(balanceType === 'assets' ? totalAssets : balanceType === 'debts' ? totalDebts : netWorth)}</p>
                            <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg w-min mt-2">
                                 <button onClick={() => setBalanceType('networth')} className={`px-4 py-1.5 text-sm rounded-md whitespace-nowrap ${balanceType === 'networth' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Net Worth</button>
                                 <button onClick={() => setBalanceType('assets')} className={`px-4 py-1.5 text-sm rounded-md ${balanceType === 'assets' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Assets</button>
                                 <button onClick={() => setBalanceType('debts')} className={`px-4 py-1.5 text-sm rounded-md ${balanceType === 'debts' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Debts</button>
                            </div>
                        </Card>
                        <Card className="flex flex-col justify-center">
                            <p className="text-gray-400">Net Worth</p>
                            <p className={`text-4xl font-bold my-2 ${netWorth >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCurrency(netWorth)}</p>
                            <p className="text-xs text-gray-500 mt-2">Assets minus Debts</p>
                        </Card>
                    </div>

                    <Card>
                         <div className="flex justify-end mb-4">
                            <div className="flex space-x-2 bg-gray-900 p-1 rounded-lg">
                               <TimeFilterButton period="Day" activePeriod={timePeriod} onClick={() => setTimePeriod('Day')} />
                               <TimeFilterButton period="Week" activePeriod={timePeriod} onClick={() => setTimePeriod('Week')} />
                               <TimeFilterButton period="Month" activePeriod={timePeriod} onClick={() => setTimePeriod('Month')} />
                               <TimeFilterButton period="Year" activePeriod={timePeriod} onClick={() => setTimePeriod('Year')} />
                            </div>
                         </div>
                         <div className="h-64">
                            <BalanceChart data={getChartData()} chartColor={balanceType === 'assets' ? '#26c45d' : balanceType === 'debts' ? '#f59e0b' : '#3b82f6'} reversed={balanceType === 'debts'} />
                         </div>
                    </Card>
                </div>

                <Card className="lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Accounts</h2>
                        <button onClick={() => navigateTo(Page.Accounts)} className="text-sm text-primary hover:underline font-semibold">View More</button>
                    </div>
                    <div className="space-y-4">
                        {topAssets.map(acc => {
                            const Icon = iconMap[acc.icon];
                            return (
                                <div key={acc.id} className="flex items-center">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${acc.color}`}>
                                        {Icon && <Icon className="h-5 w-5 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-white text-sm">{acc.name}</p>
                                        <p className="text-xs text-gray-400">{acc.type}</p>
                                    </div>
                                    <p className="font-bold text-white text-sm">{formatCurrency(acc.balance)}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-6 pt-6 border-t border-border-color">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Debts</h2>
                            <button onClick={() => navigateTo(Page.Debts)} className="text-sm text-primary hover:underline font-semibold">View More</button>
                        </div>
                        <div className="space-y-4">
                             {topDebts.map(acc => {
                                const Icon = iconMap[acc.icon];
                                return (
                                    <div key={acc.id} className="flex items-center">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${acc.color}`}>
                                            {Icon && <Icon className="h-5 w-5 text-white" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-white text-sm">{acc.name}</p>
                                            <p className="text-xs text-gray-400">{acc.type}</p>
                                        </div>
                                        <p className="font-bold text-white text-sm">{formatCurrency(acc.balance)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card className="lg:col-span-2">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
                        <button onClick={() => navigateTo(Page.Transactions)} className="text-sm text-primary hover:underline">View All</button>
                    </div>
                    <div className="divide-y divide-border-color">
                        {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6).map(tx => (
                            <div key={tx.id} className="flex items-center justify-between py-3">
                                <div className="flex items-center">
                                     <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 bg-gray-700">
                                        <img src={tx.logo} alt={tx.merchant} className="w-6 h-6 rounded-md object-contain p-0.5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-sm">{tx.merchant}</p>
                                        <p className="text-xs text-gray-400">{format(new Date(tx.date), 'dd MMM yyyy, p')}</p>
                                    </div>
                                </div>
                                <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-primary' : 'text-white'}`}>
                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount).replace(/[+-]/g, '')}
                                </p>
                            </div>
                        ))}
                    </div>
                 </Card>

                 <Card className="lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Upcoming Bills</h2>
                        <button onClick={() => navigateTo(Page.Bills)} className="text-sm text-primary hover:underline">View All</button>
                    </div>
                    <div className="divide-y divide-border-color">
                         {upcomingBills.slice(0, 3).map(bill => (
                             <div key={bill.id} className="flex items-center justify-between py-3">
                                 <div className="flex items-center">
                                     <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 bg-gray-700">
                                        <img src={`https://logo.clearbit.com/${bill.name.toLowerCase().replace('+', 'plus')}.com`} alt={bill.name} className="w-6 h-6 rounded-md object-contain p-0.5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-sm">{bill.name}</p>
                                        <p className="text-xs text-primary font-semibold">Due {format(new Date(bill.dueDate), 'MMM dd')}</p>
                                    </div>
                                 </div>
                                  <p className="font-bold text-sm text-white">{formatCurrency(bill.amount)}</p>
                             </div>
                         ))}
                    </div>
                 </Card>
            </div>
        </div>
    );
};

export default Dashboard;