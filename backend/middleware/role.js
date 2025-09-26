const { 
  ROLES, 
  ROLE_HIERARCHY, 
  PERMISSIONS, 
  getRoleLevel, 
  hasPermission, 
  isAdmin, 
  hasManagementRole 
} = require('../constants/roles');

// Check if user has required role or higher
function hasRequiredRole(userRoles, requiredRole) {
  if (!userRoles || !Array.isArray(userRoles)) {
    return false;
  }
  const requiredLevel = getRoleLevel(requiredRole);
  return userRoles.some(role => getRoleLevel(role) >= requiredLevel);
}

// Main role middleware
module.exports = function(requiredRole) {
  return (req, res, next) => {
    if (!req.user || !req.user.events || !Array.isArray(req.user.events)) {
      return res.status(403).json({ message: 'Access denied: no valid roles found' });
    }
    
    const userRoles = req.user.events.map(e => e.role);
    
    if (!hasRequiredRole(userRoles, requiredRole)) {
      return res.status(403).json({ message: 'Access denied: insufficient role' });
    }
    next();
  };
};

// Permission-based middleware
module.exports.requirePermission = function(permission) {
  return (req, res, next) => {
    if (!req.user || !req.user.events || !Array.isArray(req.user.events)) {
      return res.status(403).json({ message: 'Access denied: no valid roles found' });
    }
    
    const userRoles = req.user.events.map(e => e.role);
    
    if (!hasPermission(userRoles, permission)) {
      return res.status(403).json({ 
        message: `Access denied: ${permission} permission required` 
      });
    }
    next();
  };
};

// Export additional role checking functions
module.exports.hasAdminRole = function(req, res, next) {
  if (!req.user || !req.user.events || !Array.isArray(req.user.events)) {
    return res.status(403).json({ message: 'Access denied: no valid roles found' });
  }
  
  const userRoles = req.user.events.map(e => e.role);
  
  if (!isAdmin(userRoles)) {
    return res.status(403).json({ message: 'Access denied: admin role required' });
  }
  next();
};

module.exports.hasManagementRole = function(req, res, next) {
  if (!req.user || !req.user.events || !Array.isArray(req.user.events)) {
    return res.status(403).json({ message: 'Access denied: no valid roles found' });
  }
  
  const userRoles = req.user.events.map(e => e.role);
  
  if (!hasManagementRole(userRoles)) {
    return res.status(403).json({ message: 'Access denied: management role required' });
  }
  next();
}; 