import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Card from './Card';
import { Page, Asset, Debt, Bill, Transaction, User, Notification, NotificationType } from '../types';
import { BalanceChart } from './charts';
import { BellIcon, PlusIcon, iconMap, SettingsIcon, CalendarDaysIcon, CheckCircleIcon, InformationCircleIcon, PencilIcon, CloseIcon } from './icons';
import { format, addDays, isWithinInterval, formatDistanceToNow } from 'date-fns';
import { useCurrency } from '../App';
import { assetDayData, assetWeekData, assetMonthData, assetYearData, debtDayData, debtWeekData, debtMonthData, debtYearData } from '../data/mockData';

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

const ProfileModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onUpdateUser: (user: User) => void;
    navigateTo: (page: Page) => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}> = ({ isOpen, onClose, user, onUpdateUser, navigateTo, theme, onToggleTheme }) => {
    
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(user);

    useEffect(() => {
        if (isOpen) {
            setFormData(user);
            setIsEditing(false);
        }
    }, [isOpen, user]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSave = () => {
        onUpdateUser(formData);
        setIsEditing(false);
    };
    
    const handleCancel = () => {
        setFormData(user);
        setIsEditing(false);
    };

    if (!isOpen) return null;
    
    const commonInputStyles = "w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-primary outline-none transition-colors";
    const labelStyles = "block text-sm font-medium text-gray-400 mb-1";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-start pt-20" onClick={onClose}>
            <div 
                className={`bg-card-bg rounded-lg shadow-xl w-full max-w-sm border border-border-color text-white transform transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col items-center p-6 border-b border-border-color">
                    <div className="relative group">
                        <img src={formData.avatarUrl} alt="Profile" className="w-24 h-24 rounded-full border-4 border-primary"/>
                        {isEditing && (
                             <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <PencilIcon className="w-6 h-6 text-white" />
                            </div>
                        )}
                    </div>
                    {isEditing ? (
                        <div className="w-full mt-4 space-y-3">
                            <div><label htmlFor="name" className={labelStyles}>Full Name</label><input type="text" id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={commonInputStyles} /></div>
                            <div><label htmlFor="username" className={labelStyles}>Username</label><input type="text" id="username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className={commonInputStyles} /></div>
                             <div><label htmlFor="avatarUrl" className={labelStyles}>Avatar URL</label><input type="text" id="avatarUrl" value={formData.avatarUrl} onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})} className={commonInputStyles} /></div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold mt-4">{user.name}</h2>
                            <p className="text-sm text-gray-400">@{user.username}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </>
                    )}
                </div>
                <div className="p-4 space-y-2">
                     {isEditing ? (
                        <div className="flex gap-2">
                             <button onClick={handleCancel} className="w-full py-3 bg-gray-600/50 text-white rounded-lg font-semibold hover:bg-gray-600/80 transition-colors">Cancel</button>
                            <button onClick={handleSave} className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">Save</button>
                        </div>
                     ) : (
                         <button onClick={() => setIsEditing(true)} className="w-full text-center flex items-center justify-center gap-3 px-4 py-3 rounded-md hover:bg-gray-700 transition-colors">
                            <PencilIcon className="w-5 h-5 text-gray-400" />
                            <span>Edit Profile</span>
                        </button>
                     )}
                     <button onClick={() => { navigateTo(Page.Settings); onClose(); }} className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-md hover:bg-gray-700 transition-colors">
                        <SettingsIcon className="w-5 h-5 text-gray-400" />
                        <span>Account Settings</span>
                    </button>
                    <div className="w-full flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.95-4.243l-1.59-1.591M3.75 12H6m.386-6.364L7.93 7.125M12 6a6 6 0 100 12 6 6 0 000-12z" /></svg>
                            <span>Theme</span>
                        </div>
                        <button onClick={onToggleTheme} className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-gray-600'}`}>
                            <div className={`bg-white w-4 h-4 rounded-full transform transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                </div>
                 <div className="p-4">
                    <button onClick={() => alert('Logged out!')} className="w-full py-3 bg-red-600/20 text-red-400 rounded-lg font-semibold hover:bg-red-600/40 transition-colors">
                        Logout
                    </button>
                </div>
            </div>
        </div>
    )
}

const NotificationsPopout: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkAllRead: () => void;
    onNotificationClick: (notification: Notification) => void;
}> = ({ isOpen, onClose, notifications, onMarkAllRead, onNotificationClick }) => {
    
    const notificationIcons: {[key in NotificationType]: React.FC<any>} = {
        'Bill': CalendarDaysIcon,
        'Goal': CheckCircleIcon,
        'Summary': InformationCircleIcon,
        'Info': InformationCircleIcon,
    };

    const handleItemClick = (notification: Notification) => {
        onNotificationClick(notification);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={`absolute top-16 right-0 w-80 bg-card-bg border border-border-color rounded-lg shadow-2xl z-40 text-white transition-all duration-300 origin-top-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="flex justify-between items-center p-3 border-b border-border-color">
                <h3 className="font-bold">Notifications</h3>
                <button onClick={onMarkAllRead} className="text-xs text-primary hover:underline">Mark all as read</button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map(n => {
                        const Icon = notificationIcons[n.type];
                        return (
                            <div key={n.id} onClick={() => handleItemClick(n)} className="flex items-start gap-3 p-3 hover:bg-gray-800/50 cursor-pointer border-b border-border-color last:border-b-0">
                                {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>}
                                <Icon className={`w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0 ${n.read ? 'ml-2' : ''}`} />
                                <div className="flex-1">
                                    <p className={`text-sm ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">{formatDistanceToNow(new Date(n.date), { addSuffix: true })}</p>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <p className="text-sm text-gray-500 text-center p-8">No new notifications.</p>
                )}
            </div>
        </div>
    )
}

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
    const [balanceType, setBalanceType] = useState<'assets' | 'debts'>('assets');
    const [timePeriod, setTimePeriod] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Month');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
        const sourceData = balanceType === 'assets'
            ? { Day: assetDayData, Week: assetWeekData, Month: assetMonthData, Year: assetYearData }
            : { Day: debtDayData, Week: debtWeekData, Month: debtMonthData, Year: debtYearData };
        return sourceData[timePeriod];
    }

    const upcomingBills = bills.filter(bill => {
        const today = new Date();
        const nextWeek = addDays(today, 7);
        return isWithinInterval(new Date(bill.dueDate), { start: today, end: nextWeek });
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    const topAssets = [...assets].filter(a => a.status === 'Active').sort((a,b) => b.balance - a.balance).slice(0,3);
    const topDebts = [...debts].filter(d => d.status === 'Active').sort((a,b) => b.balance - a.balance).slice(0,3);

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
                        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={user} onUpdateUser={onUpdateUser} navigateTo={navigateTo} theme={theme} onToggleTheme={onToggleTheme} />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="flex flex-col justify-center">
                            <p className="text-gray-400">Total balance</p>
                            <p className="text-4xl font-bold text-white my-2">{formatCurrency(balanceType === 'assets' ? totalAssets : totalDebts)}</p>
                            <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg w-min mt-2">
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
                            <BalanceChart data={getChartData()} chartColor={balanceType === 'assets' ? '#26c45d' : '#f59e0b'} />
                         </div>
                    </Card>
                </div>

                <Card className="lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Accounts</h2>
                        <button onClick={() => navigateTo(Page.Accounts)} className="text-primary hover:text-green-300"><PlusIcon className="w-5 h-5"/></button>
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
                         {assets.filter(a => a.status === 'Active').length > 3 && <button onClick={() => navigateTo(Page.Accounts)} className="text-sm text-primary hover:underline w-full text-center pt-2">View More</button>}
                    </div>
                    <div className="mt-6 pt-6 border-t border-border-color">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Debts</h2>
                            <button onClick={() => navigateTo(Page.Debts)} className="text-primary hover:text-green-300"><PlusIcon className="w-5 h-5"/></button>
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
                            {debts.filter(d => d.status === 'Active').length > 3 && <button onClick={() => navigateTo(Page.Debts)} className="text-sm text-primary hover:underline w-full text-center pt-2">View More</button>}
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
                        {transactions.slice(0, 4).map(tx => (
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