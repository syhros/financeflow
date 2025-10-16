import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-gray-600 border-t-primary rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;

// Full page loading component
export const LoadingPage: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-bg">
    <LoadingSpinner size="lg" />
    <p className="text-gray-400 mt-4">{message}</p>
  </div>
);

// Inline loading component
export const LoadingInline: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner size="md" className="mr-3" />
    <span className="text-gray-400">{message}</span>
  </div>
);

// Button loading state
export const ButtonLoading: React.FC = () => (
  <LoadingSpinner size="sm" className="mr-2" />
);
