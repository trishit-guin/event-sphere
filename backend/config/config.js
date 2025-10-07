// Configuration constants - centralized configuration management
module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Database configuration
  database: {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/event-sphere',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    issuer: process.env.JWT_ISSUER || 'event-sphere',
    audience: process.env.JWT_AUDIENCE || 'event-sphere-users'
  },

  // CORS configuration
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.FRONTEND_URL || 'https://your-domain.com').split(',')
      : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 15 * 60 * 1000, // 15 minutes
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000, // 24 hours
    whitelistedIPs: process.env.WHITELISTED_IPS ? process.env.WHITELISTED_IPS.split(',') : []
  },

  // Email configuration (for future use)
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@event-sphere.com'
  },

  // Application limits
  limits: {
    maxEventsPerUser: parseInt(process.env.MAX_EVENTS_PER_USER) || 50,
    maxTasksPerEvent: parseInt(process.env.MAX_TASKS_PER_EVENT) || 200,
    maxArchiveLinksPerEvent: parseInt(process.env.MAX_ARCHIVE_LINKS_PER_EVENT) || 100,
    maxUsersPerEvent: parseInt(process.env.MAX_USERS_PER_EVENT) || 500
  },

  // Pagination defaults
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT) || 10,
    maxLimit: parseInt(process.env.MAX_PAGE_LIMIT) || 100
  },

  // Cache configuration (for future use)
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 300, // 5 minutes
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600 // 10 minutes
  },

  // Default admin user for bootstrapping
  defaultAdmin: {
    name: process.env.DEFAULT_ADMIN_NAME || 'System Admin',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@event-sphere.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPass123!@#'
  },

  // Event status options
  eventStatus: {
    DRAFT: 'draft',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  // Task priorities
  taskPriority: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  }
};