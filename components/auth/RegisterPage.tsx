import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  const validatePassword = (pwd: string) => {
    const errors: string[] = [];
    if (pwd.length < 6) errors.push('At least 6 characters');
    if (!/[A-Z]/.test(pwd)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(pwd)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(pwd)) errors.push('One number');
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    const newFieldErrors = { ...fieldErrors };

    if (name === 'password') {
      const errors = validatePassword(value);
      newFieldErrors.password = errors.length > 0 ? errors.join(', ') : null;
    }

    if (name === 'confirmPassword' && formData.password) {
      if (value && value !== formData.password) {
        newFieldErrors.confirmPassword = 'Passwords do not match';
      } else if (value && value === formData.password) {
        newFieldErrors.confirmPassword = null;
      }
    }

    if (name === 'password' && formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        newFieldErrors.confirmPassword = 'Passwords do not match';
      } else {
        newFieldErrors.confirmPassword = null;
      }
    }

    setFieldErrors(newFieldErrors);
  };

  const validateForm = () => {
    if (!formData.name || !formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setError('Password must contain: ' + passwordErrors.join(', '));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.name,
      formData.username
    );

    if (error) {
      if (error.message.includes('already registered')) {
        setError('This email is already registered');
      } else if (error.message.includes('duplicate key')) {
        setError('This username is already taken');
      } else {
        setError(error.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700/50">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Zenith Finance</h1>
            <p className="text-slate-400">Create your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="John Doe"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="johndoe"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="your@email.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition pr-10 ${
                    fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-blue-500'
                  }`}
                  placeholder="At least 6 characters"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? '✕' : '•'}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="mt-2 text-xs text-red-400 space-y-1">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside ml-1">
                    {fieldErrors.password.split(', ').map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition pr-10 ${
                    fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-blue-500'
                  }`}
                  placeholder="Re-enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-300 transition"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? '✕' : '•'}
                </button>
              </div>
              {formData.confirmPassword && !fieldErrors.confirmPassword && (
                <p className="mt-2 text-xs text-green-400">Passwords match</p>
              )}
              {fieldErrors.confirmPassword && (
                <p className="mt-2 text-xs text-red-400">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-400 hover:text-blue-300 font-medium transition"
              disabled={loading}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
