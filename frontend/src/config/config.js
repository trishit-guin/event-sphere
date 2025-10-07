// Frontend configuration constants
const config = {
  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
  },

  // Application Information
  app: {
    name: import.meta.env.VITE_APP_NAME || 'EventSphere',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0'
  },

  // Authentication Configuration
  auth: {
    tokenStorageKey: import.meta.env.VITE_TOKEN_STORAGE_KEY || 'eventSphere_token',
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 24 * 60 * 60 * 1000, // 24 hours
    refreshThreshold: 5 * 60 * 1000 // 5 minutes before expiry
  },

  // UI Configuration
  ui: {
    defaultPageSize: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 10,
    maxPageSize: 100,
    animationDuration: 300,
    toastDuration: 5000
  },

  // Feature Flags
  features: {
    debugMode: import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true',
    errorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
  },

  // External Services
  services: {
    googleAnalyticsId: import.meta.env.VITE_GA_TRACKING_ID,
    sentryDsn: import.meta.env.VITE_SENTRY_DSN
  },

  // Event Status Options
  eventStatus: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Task Status Options
  taskStatus: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    DONE: 'done',
    CANCELLED: 'cancelled'
  },

  // Task Priority Options
  taskPriority: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },

  // Role Constants (matching backend)
  roles: {
    EVENT_COORDINATOR: 'event_coordinator',
    TE_HEAD: 'te_head',
    BE_HEAD: 'be_head',
    ADMIN: 'admin'
  },

  // Date/Time Configuration
  dateTime: {
    defaultFormat: 'YYYY-MM-DD',
    displayFormat: 'MMM DD, YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'MMM DD, YYYY HH:mm'
  }
};

export default config;