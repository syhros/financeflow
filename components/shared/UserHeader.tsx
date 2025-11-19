import React, { useState } from 'react';
import { User, Notification, Page } from '../../types';
import { BellIcon } from '../icons';
import { NotificationsPopout, ProfileModal, AccountSelectionModal } from './UserModals';

interface UserHeaderProps {
    user: User;
    notifications: Notification[];
    onUpdateUser: (user: User) => void;
    onMarkAllNotificationsRead: () => void;
    onNotificationClick: (notification: Notification) => void;
    navigateTo: (page: Page) => void;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    assets: any[];
    debts: any[];
    onSignOut?: () => void;
}

const UserHeader: React.FC<UserHeaderProps> = ({
    user,
    notifications,
    onUpdateUser,
    onMarkAllNotificationsRead,
    onNotificationClick,
    navigateTo,
    theme,
    onToggleTheme,
    assets,
    debts,
    onSignOut
}) => {
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isAccountSelectionOpen, setIsAccountSelectionOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const unreadNotificationsCount = notifications.filter(n => !n.read).length;

    return (
        <div className="flex items-center gap-4">
            <div className="relative">
                <button
                    onClick={() => setIsNotificationsOpen(prev => !prev)}
                    className="text-gray-400 hover:text-white relative"
                >
                    <BellIcon className="h-6 w-6" />
                    {unreadNotificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-white ring-2 ring-base-bg">
                            {unreadNotificationsCount}
                        </span>
                    )}
                </button>
                <NotificationsPopout
                    isOpen={isNotificationsOpen}
                    onClose={() => setIsNotificationsOpen(false)}
                    notifications={notifications}
                    onMarkAllRead={onMarkAllNotificationsRead}
                    onNotificationClick={(notif) => {
                        onNotificationClick(notif);
                        setIsNotificationsOpen(false);
                    }}
                />
            </div>
            <div>
                <button onClick={() => setIsProfileModalOpen(true)} title="Profile">
                    <img
                        src={user.avatarUrl}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-primary"
                    />
                </button>
                <ProfileModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    user={user}
                    onUpdateUser={onUpdateUser}
                    navigateTo={navigateTo}
                    theme={theme}
                    onToggleTheme={onToggleTheme}
                    onOpenAccountSelection={() => setIsAccountSelectionOpen(true)}
                    onSignOut={onSignOut}
                />
                <AccountSelectionModal
                    isOpen={isAccountSelectionOpen}
                    onClose={() => setIsAccountSelectionOpen(false)}
                    user={user}
                    assets={assets}
                    debts={debts}
                    onUpdateUser={onUpdateUser}
                />
            </div>
        </div>
    );
};

export default UserHeader;
