import React, { useState, useEffect } from 'react';
import { User, Asset, Debt, Page, Notification, NotificationType } from '../../types';
import { CloseIcon, PencilIcon, SettingsIcon, CalendarDaysIcon, CheckCircleIcon, InformationCircleIcon } from '../icons';
import { formatDistanceToNow } from 'date-fns';

export const AccountSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User;
    assets: Asset[];
    debts: Debt[];
    onUpdateUser: (user: User) => void;
}> = ({ isOpen, onClose, user, assets, debts, onUpdateUser }) => {
    const [mode, setMode] = useState<'automatic' | 'manual'>(user.accountSelection?.mode || 'automatic');
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(user.accountSelection?.selectedAssetIds || []);
    const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>(user.accountSelection?.selectedDebtIds || []);
    const [assetCount, setAssetCount] = useState(user.accountSelection?.automaticCounts.assets || 3);
    const [debtCount, setDebtCount] = useState(user.accountSelection?.automaticCounts.debts || 3);

    useEffect(() => {
        if (isOpen) {
            setMode(user.accountSelection?.mode || 'automatic');
            setSelectedAssetIds(user.accountSelection?.selectedAssetIds || []);
            setSelectedDebtIds(user.accountSelection?.selectedDebtIds || []);
            setAssetCount(user.accountSelection?.automaticCounts.assets || 3);
            setDebtCount(user.accountSelection?.automaticCounts.debts || 3);
        }
    }, [isOpen, user]);

    const activeAssets = assets.filter(a => a.status === 'Active');
    const activeDebts = debts.filter(d => d.status === 'Active');

    const toggleAsset = (id: string) => {
        if (selectedAssetIds.includes(id)) {
            setSelectedAssetIds(selectedAssetIds.filter(aid => aid !== id));
        } else {
            const total = selectedAssetIds.length + 1 + selectedDebtIds.length;
            if (total <= 7) {
                setSelectedAssetIds([...selectedAssetIds, id]);
            }
        }
    };

    const toggleDebt = (id: string) => {
        if (selectedDebtIds.includes(id)) {
            setSelectedDebtIds(selectedDebtIds.filter(did => did !== id));
        } else {
            const total = selectedAssetIds.length + selectedDebtIds.length + 1;
            if (total <= 7) {
                setSelectedDebtIds([...selectedDebtIds, id]);
            }
        }
    };

    const handleSave = () => {
        onUpdateUser({
            ...user,
            accountSelection: {
                mode,
                selectedAssetIds,
                selectedDebtIds,
                automaticCounts: {
                    assets: assetCount,
                    debts: debtCount
                }
            }
        });
        onClose();
    };

    const totalSelected = selectedAssetIds.length + selectedDebtIds.length;
    const totalAuto = assetCount + debtCount;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card-bg rounded-lg shadow-xl w-full max-w-2xl border border-border-color" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-border-color">
                    <h2 className="text-xl font-bold text-white">Dashboard Account Selection</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="flex gap-2 mb-6">
                        <button onClick={() => setMode('automatic')} className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${mode === 'automatic' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                            Automatic Selection
                        </button>
                        <button onClick={() => setMode('manual')} className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${mode === 'manual' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                            Manual Selection
                        </button>
                    </div>

                    {mode === 'automatic' ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">Automatically display accounts with highest balances. Maximum 6 total accounts.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Regular Accounts</label>
                                    <select value={assetCount} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (val + debtCount <= 6) setAssetCount(val);
                                    }} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none">
                                        {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                                            <option key={n} value={n} disabled={n + debtCount > 7}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Debt Accounts</label>
                                    <select value={debtCount} onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (assetCount + val <= 6) setDebtCount(val);
                                    }} className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-primary outline-none">
                                        {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                                            <option key={n} value={n} disabled={assetCount + n > 7}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">Total: {totalAuto} accounts</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">Select up to 7 accounts to display on your dashboard. {totalSelected}/7 selected</p>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Regular Accounts</h3>
                                <div className="space-y-2">
                                    {activeAssets.map(asset => (
                                        <label key={asset.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors">
                                            <input type="checkbox" checked={selectedAssetIds.includes(asset.id!)} onChange={() => toggleAsset(asset.id!)} disabled={!selectedAssetIds.includes(asset.id!) && totalSelected >= 7} className="w-5 h-5 rounded border-gray-500 text-primary focus:ring-primary" />
                                            <span className="text-white font-medium">{asset.name}</span>
                                            <span className="text-gray-400 text-sm ml-auto">{asset.type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Debt Accounts</h3>
                                <div className="space-y-2">
                                    {activeDebts.map(debt => (
                                        <label key={debt.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors">
                                            <input type="checkbox" checked={selectedDebtIds.includes(debt.id!)} onChange={() => toggleDebt(debt.id!)} disabled={!selectedDebtIds.includes(debt.id!) && totalSelected >= 7} className="w-5 h-5 rounded border-gray-500 text-primary focus:ring-primary" />
                                            <span className="text-white font-medium">{debt.name}</span>
                                            <span className="text-gray-400 text-sm ml-auto">{debt.type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-border-color flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">Save Selection</button>
                </div>
            </div>
        </div>
    );
};

export const ProfileModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onUpdateUser: (user: User) => void;
    navigateTo: (page: Page) => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    onOpenAccountSelection: () => void;
}> = ({ isOpen, onClose, user, onUpdateUser, navigateTo, theme, onToggleTheme, onOpenAccountSelection }) => {

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
                     <button onClick={() => { onOpenAccountSelection(); onClose(); }} className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-md hover:bg-gray-700 transition-colors">
                        <SettingsIcon className="w-5 h-5 text-gray-400" />
                        <span>Dashboard Account Selection</span>
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

export const NotificationsPopout: React.FC<{
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
