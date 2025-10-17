import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type AuthMode = 'login' | 'register' | 'reset';

const AuthPage: React.FC = () => {
    const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);

        try {
            if (mode === 'login') {
                if (!email || !password) {
                    setError('Please enter email and password');
                    setLoading(false);
                    return;
                }
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message);
                }
            } else if (mode === 'register') {
                if (!email || !password || !name || !username) {
                    setError('Please fill in all fields');
                    setLoading(false);
                    return;
                }
                if (password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setLoading(false);
                    return;
                }
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }
                const { error } = await signUp(email, password, username, name);
                if (error) {
                    setError(error.message);
                } else {
                    setMessage('Account created successfully! Please check your email to verify your account.');
                    setMode('login');
                }
            } else if (mode === 'reset') {
                if (!email) {
                    setError('Please enter your email');
                    setLoading(false);
                    return;
                }
                const { error } = await resetPassword(email);
                if (error) {
                    setError(error.message);
                } else {
                    setMessage('Password reset link sent! Please check your email.');
                    setMode('login');
                }
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setLoading(true);
        const { error } = await signInWithGoogle();
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Zenith Finance</h1>
                    <p className="text-gray-400">Your personal finance dashboard</p>
                </div>

                <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setMode('login')}
                            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                                mode === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setMode('register')}
                            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                                mode === 'register' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            Register
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg">
                            <p className="text-green-400 text-sm">{message}</p>
                        </div>
                    )}

                    {mode === 'reset' ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('login')}
                                className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Back to Login
                            </button>
                        </form>
                    ) : (
                        <>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {mode === 'register' && (
                                    <>
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                                Full Name
                                            </label>
                                            <input
                                                id="name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 outline-none transition-colors"
                                                placeholder="John Doe"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                                Username
                                            </label>
                                            <input
                                                id="username"
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 outline-none transition-colors"
                                                placeholder="johndoe"
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 outline-none transition-colors"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 outline-none transition-colors"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                {mode === 'register' && (
                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                            Confirm Password
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 outline-none transition-colors"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                )}
                                {mode === 'login' && (
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setMode('reset')}
                                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                                </button>
                            </form>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Sign in with Google
                            </button>
                        </>
                    )}
                </div>

                <p className="text-center text-gray-500 text-sm mt-6">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
