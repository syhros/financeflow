import React, { useRef, useState, useEffect } from 'react';
import { BellIcon } from '../icons';
import { User, Notification } from '../../types';

interface HeaderWithNavProps {
    title: string;
    user: User;
    notifications: Notification[];
    onMarkAllNotificationsRead: () => void;
    onNotificationClick: (notification: Notification) => void;
    onProfileClick: () => void;
}

const HeaderWithNav: React.FC<HeaderWithNavProps> = ({
    title,
    user,
    notifications,
    onMarkAllNotificationsRead,
    onNotificationClick,
    onProfileClick
}) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <div className="flex items-center gap-4">
                <div ref={notificationsRef} className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <BellIcon className="w-6 h-6 text-gray-300" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-card-bg border border-border-color rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                            <div className="p-3 border-b border-border-color flex justify-between items-center">
                                <span className="font-semibold text-white">Notifications</span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={onMarkAllNotificationsRead}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            {notifications.length > 0 ? (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => {
                                            onNotificationClick(n);
                                            setShowNotifications(false);
                                        }}
                                        className={`p-3 border-b border-border-color cursor-pointer hover:bg-gray-700 transition-colors ${
                                            !n.read ? 'bg-gray-700/30' : ''
                                        }`}
                                    >
                                        <p className="text-sm text-white font-medium">{n.title}</p>
                                        <p className="text-xs text-gray-400 mt-1">{n.message}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-gray-400 text-sm">
                                    No notifications
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <button onClick={onProfileClick} className="hover:opacity-80 transition-opacity">
                    <img src={user.avatarUrl} alt="Profile" className="w-10 h-10 rounded-full border-2 border-primary" />
                </button>
            </div>
        </div>
    );
};

export default HeaderWithNav;
