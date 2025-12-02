import React, { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ResetPasswordPage from './ResetPasswordPage';

type AuthView = 'login' | 'register' | 'reset';

const AuthContainer: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  return (
    <>
      {currentView === 'login' && (
        <LoginPage
          onSwitchToRegister={() => setCurrentView('register')}
          onSwitchToReset={() => setCurrentView('reset')}
        />
      )}
      {currentView === 'register' && (
        <RegisterPage onSwitchToLogin={() => setCurrentView('login')} />
      )}
      {currentView === 'reset' && (
        <ResetPasswordPage onSwitchToLogin={() => setCurrentView('login')} />
      )}
    </>
  );
};

export default AuthContainer;
