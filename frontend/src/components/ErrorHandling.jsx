import { useState, useEffect } from 'react';

// Custom hook for API calls with error handling and loading states
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = async (apiFunction, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(...args);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return { loading, error, callApi, clearError };
};

// Error Display Component
export const ErrorDisplay = ({ error, onRetry, onDismiss }) => {
  if (!error) return null;

  const getErrorMessage = (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  };

  const getErrorType = (error) => {
    if (error.response?.status === 401) return 'authentication';
    if (error.response?.status === 403) return 'authorization';
    if (error.response?.status === 404) return 'not-found';
    if (error.response?.status >= 500) return 'server';
    if (error.code === 'NETWORK_ERROR') return 'network';
    return 'general';
  };

  const errorType = getErrorType(error);
  const errorMessage = getErrorMessage(error);

  const errorConfig = {
    authentication: {
      icon: '🔒',
      title: 'Authentication Required',
      description: 'Please log in to continue.',
      color: 'yellow'
    },
    authorization: {
      icon: '🚫',
      title: 'Access Denied',
      description: 'You don\'t have permission to perform this action.',
      color: 'red'
    },
    'not-found': {
      icon: '🔍',
      title: 'Not Found',
      description: 'The requested resource could not be found.',
      color: 'blue'
    },
    server: {
      icon: '🛠️',
      title: 'Server Error',
      description: 'Something went wrong on our end. Please try again later.',
      color: 'red'
    },
    network: {
      icon: '🌐',
      title: 'Network Error',
      description: 'Please check your internet connection and try again.',
      color: 'orange'
    },
    general: {
      icon: '⚠️',
      title: 'Error',
      description: 'An unexpected error occurred.',
      color: 'red'
    }
  };

  const config = errorConfig[errorType];
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[config.color]}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">{config.icon}</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{config.title}</h3>
          <div className="mt-1 text-sm">
            <p>{errorMessage}</p>
            {errorType === 'general' && (
              <p className="mt-1 text-xs opacity-75">{config.description}</p>
            )}
          </div>
          <div className="mt-3 flex space-x-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm bg-white px-3 py-1 rounded border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <svg 
        className={`animate-spin ${sizes[size]} text-blue-500`} 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};

// Full page loading component
export const FullPageLoading = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-lg text-gray-600">{text}</p>
    </div>
  </div>
);

// Async component wrapper with error boundary and loading
export const AsyncComponent = ({ 
  children, 
  loading, 
  error, 
  onRetry, 
  loadingText, 
  fallback 
}) => {
  if (loading) {
    return fallback || <LoadingSpinner text={loadingText} />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={onRetry} 
        onDismiss={() => {/* Handle dismiss */}} 
      />
    );
  }

  return children;
};

// Toast notification for temporary error messages
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now().toString();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showError = (message, duration) => addToast(message, 'error', duration);
  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);

  return {
    toasts,
    addToast,
    removeToast,
    showError,
    showSuccess,
    showWarning,
    showInfo
  };
};

// Toast Container Component
export const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts || toasts.length === 0) return null;

  const typeStyles = {
    error: 'bg-red-500 border-red-600',
    success: 'bg-green-500 border-green-600',
    warning: 'bg-yellow-500 border-yellow-600',
    info: 'bg-blue-500 border-blue-600'
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`max-w-sm w-full text-white p-4 rounded-lg border shadow-lg ${typeStyles[toast.type]} animate-slide-in`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="ml-2 text-white hover:text-gray-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};