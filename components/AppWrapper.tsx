import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from './Auth/AuthPage';
import LoadingSpinner from './shared/LoadingSpinner';
import { supabaseService } from '../services/supabaseService';

interface AppWrapperProps {
    children: React.ReactNode;
    onUserLoaded: (userId: string) => void;
}

const AppWrapper: React.FC<AppWrapperProps> = ({ children, onUserLoaded }) => {
    const { user, loading } = useAuth();
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        const initializeUser = async () => {
            if (user) {
                try {
                    let profile = await supabaseService.getUserProfile(user.id);

                    if (!profile) {
                        await supabaseService.createUserProfile(user.id, {
                            email: user.email || '',
                            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
                            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                            avatar_url: user.user_metadata?.avatar_url || null
                        });

                        profile = await supabaseService.getUserProfile(user.id);
                    }

                    let settings = await supabaseService.getUserSettings(user.id);
                    if (!settings) {
                        await supabaseService.updateUserSettings(user.id, {
                            currency: 'GBP',
                            notifications_enabled: true,
                            auto_categorize: true,
                            smart_suggestions: true,
                            theme: 'dark'
                        });
                    }

                    onUserLoaded(user.id);
                } catch (error) {
                    console.error('Error initializing user:', error);
                } finally {
                    setInitializing(false);
                }
            } else {
                setInitializing(false);
            }
        };

        initializeUser();
    }, [user, onUserLoaded]);

    if (loading || initializing) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="large" />
                    <p className="text-gray-400 mt-4">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <AuthPage />;
    }

    return <>{children}</>;
};

export default AppWrapper;
