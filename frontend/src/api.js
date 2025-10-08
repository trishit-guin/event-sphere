import axios from 'axios';
import config from './config/config.js';

// Create an axios instance with configuration
const api = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include JWT token if present
api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem(config.auth.tokenStorageKey);
    if (token) {
      requestConfig.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    if (config.features.debugMode) {
      requestConfig.metadata = { startTime: new Date() };
    }
    
    // Log the actual request URL for debugging
    console.log('API Request:', {
      method: requestConfig.method?.toUpperCase(),
      url: requestConfig.url,
      baseURL: requestConfig.baseURL,
      fullURL: `${requestConfig.baseURL}${requestConfig.url}`
    });
    
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log response time in debug mode
    if (config.features.debugMode && response.config.metadata) {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`API Request to ${response.config.url} took ${duration}ms`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log API errors for debugging
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    // Handle 401 errors (unauthorized) - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem(config.auth.tokenStorageKey);
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle 429 errors (rate limit) - retry after delay
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      const retryAfter = error.response.headers['retry-after'] * 1000 || 5000;
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      return api(originalRequest);
    }

    // Handle network errors with retry logic
    if (!error.response && !originalRequest._retry && originalRequest._retryCount < config.api.retryAttempts) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      await new Promise(resolve => setTimeout(resolve, config.api.retryDelay * originalRequest._retryCount));
      return api(originalRequest);
    }

    // Log errors in debug mode
    if (config.features.debugMode) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }

    return Promise.reject(error);
  }
);

export default api; 