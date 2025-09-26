const validator = require('validator');

// Common validation functions
const validationRules = {
  email: (value) => {
    if (!value) return 'Email is required';
    if (!validator.isEmail(value)) return 'Invalid email format';
    return null;
  },

  name: (value) => {
    if (!value) return 'Name is required';
    if (value.length < 2) return 'Name must be at least 2 characters';
    if (value.length > 100) return 'Name must not exceed 100 characters';
    if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name can only contain letters and spaces';
    return null;
  },

  title: (value) => {
    if (!value) return 'Title is required';
    if (value.length < 3) return 'Title must be at least 3 characters';
    if (value.length > 200) return 'Title must not exceed 200 characters';
    return null;
  },

  description: (value) => {
    if (!value) return 'Description is required';
    if (value.length < 10) return 'Description must be at least 10 characters';
    if (value.length > 1000) return 'Description must not exceed 1000 characters';
    return null;
  },

  url: (value) => {
    if (!value) return 'URL is required';
    if (!validator.isURL(value)) return 'Invalid URL format';
    return null;
  },

  date: (value) => {
    if (!value) return 'Date is required';
    if (!validator.isISO8601(value)) return 'Invalid date format (use ISO 8601)';
    const date = new Date(value);
    if (date < new Date()) return 'Date cannot be in the past';
    return null;
  },

  mongoId: (value) => {
    if (!value) return 'ID is required';
    if (!validator.isMongoId(value)) return 'Invalid ID format';
    return null;
  },

  role: (value, allowedRoles) => {
    if (!value) return 'Role is required';
    if (!allowedRoles.includes(value)) return `Role must be one of: ${allowedRoles.join(', ')}`;
    return null;
  }
};

// Sanitization functions
const sanitize = {
  string: (value) => {
    if (typeof value !== 'string') return '';
    return validator.escape(validator.trim(value));
  },

  email: (value) => {
    if (typeof value !== 'string') return '';
    return validator.normalizeEmail(value) || '';
  }
};

// Validation middleware factory
function validateRequest(schema) {
  return (req, res, next) => {
    const errors = [];
    
    // Validate each field according to schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      // Convert rules to array format if it's an object
      const rulesArray = Array.isArray(rules) ? rules : [rules];
      
      for (const rule of rulesArray) {
        let error = null;
        
        if (typeof rule === 'string' && validationRules[rule]) {
          error = validationRules[rule](value);
        } else if (typeof rule === 'function') {
          error = rule(value);
        } else if (typeof rule === 'object') {
          // Handle object-based validation rules
          if (rule.required && !value) {
            error = `${field} is required`;
          } else if (value) {
            // Only validate if value exists (unless required check already failed)
            if (rule.type === 'email') {
              error = validationRules.email(value);
            } else if (rule.type === 'role') {
              error = validationRules.role(value, rule.allowedValues);
            } else if (rule.type === 'date') {
              const date = new Date(value);
              if (isNaN(date.getTime())) {
                error = `${field} must be a valid date`;
              }
            } else if (rule.type === 'number') {
              const num = Number(value);
              if (isNaN(num)) {
                error = `${field} must be a number`;
              } else if (rule.min !== undefined && num < rule.min) {
                error = `${field} must be at least ${rule.min}`;
              } else if (rule.max !== undefined && num > rule.max) {
                error = `${field} must not exceed ${rule.max}`;
              }
            } else if (rule.type === 'array') {
              if (!Array.isArray(value)) {
                error = `${field} must be an array`;
              } else if (rule.minLength && value.length < rule.minLength) {
                error = `${field} must have at least ${rule.minLength} items`;
              } else if (rule.maxLength && value.length > rule.maxLength) {
                error = `${field} must not have more than ${rule.maxLength} items`;
              }
            }
            
            // Check string length constraints
            if (typeof value === 'string') {
              if (rule.minLength && value.length < rule.minLength) {
                error = `${field} must be at least ${rule.minLength} characters`;
              } else if (rule.maxLength && value.length > rule.maxLength) {
                error = `${field} must not exceed ${rule.maxLength} characters`;
              }
            }
          }
        }
        
        if (error) {
          errors.push({ field, message: error });
          break; // Stop at first error for this field
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors
      });
    }
    
    // Sanitize the validated data
    for (const [field, rules] of Object.entries(schema)) {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = sanitize.string(req.body[field]);
      }
    }
    
    next();
  };
}

module.exports = {
  validateRequest,
  validationRules,
  sanitize
};