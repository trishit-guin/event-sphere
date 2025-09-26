// Role definitions and hierarchy
const ROLES = {
  VOLUNTEER: 'volunteer',
  TEAM_MEMBER: 'team_member',
  EVENT_COORDINATOR: 'event_coordinator',
  TE_HEAD: 'te_head',
  BE_HEAD: 'be_head',
  ADMIN: 'admin'
};

// Role hierarchy levels
const ROLE_HIERARCHY = {
  [ROLES.VOLUNTEER]: 0,
  [ROLES.TEAM_MEMBER]: 0,
  [ROLES.EVENT_COORDINATOR]: 1,
  [ROLES.TE_HEAD]: 2,
  [ROLES.BE_HEAD]: 2,
  [ROLES.ADMIN]: 3
};

// Role permissions
const PERMISSIONS = {
  // Basic permissions for all authenticated users
  VIEW_EVENTS: 'view_events',
  VIEW_TASKS: 'view_tasks',
  VIEW_ARCHIVE: 'view_archive',
  
  // Event coordinator permissions
  CREATE_TASKS: 'create_tasks',
  EDIT_OWN_TASKS: 'edit_own_tasks',
  
  // Management permissions (te_head, be_head)
  EDIT_EVENTS: 'edit_events',
  DELETE_EVENTS: 'delete_events',
  EDIT_ALL_TASKS: 'edit_all_tasks',
  DELETE_TASKS: 'delete_tasks',
  MANAGE_ARCHIVE: 'manage_archive',
  
  // Admin permissions
  CREATE_EVENTS: 'create_events',
  MANAGE_USERS: 'manage_users',
  ASSIGN_USERS: 'assign_users',
  SYSTEM_ADMIN: 'system_admin'
};

// Role-permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.VOLUNTEER]: [
    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_ARCHIVE
  ],
  [ROLES.TEAM_MEMBER]: [
    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_ARCHIVE,
    PERMISSIONS.EDIT_OWN_TASKS
  ],
  [ROLES.EVENT_COORDINATOR]: [
    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_ARCHIVE,
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.EDIT_OWN_TASKS
  ],
  [ROLES.TE_HEAD]: [
    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_ARCHIVE,
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.EDIT_OWN_TASKS,
    PERMISSIONS.EDIT_EVENTS,
    PERMISSIONS.DELETE_EVENTS,
    PERMISSIONS.EDIT_ALL_TASKS,
    PERMISSIONS.DELETE_TASKS,
    PERMISSIONS.MANAGE_ARCHIVE
  ],
  [ROLES.BE_HEAD]: [
    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_ARCHIVE,
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.EDIT_OWN_TASKS,
    PERMISSIONS.EDIT_EVENTS,
    PERMISSIONS.DELETE_EVENTS,
    PERMISSIONS.EDIT_ALL_TASKS,
    PERMISSIONS.DELETE_TASKS,
    PERMISSIONS.MANAGE_ARCHIVE
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_ARCHIVE,
    PERMISSIONS.CREATE_TASKS,
    PERMISSIONS.EDIT_OWN_TASKS,
    PERMISSIONS.EDIT_EVENTS,
    PERMISSIONS.DELETE_EVENTS,
    PERMISSIONS.EDIT_ALL_TASKS,
    PERMISSIONS.DELETE_TASKS,
    PERMISSIONS.MANAGE_ARCHIVE,
    PERMISSIONS.CREATE_EVENTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.ASSIGN_USERS,
    PERMISSIONS.SYSTEM_ADMIN
  ]
};

// Helper functions
function getRoleLevel(role) {
  return ROLE_HIERARCHY[role] || 0;
}

function hasPermission(userRoles, permission) {
  if (!userRoles || !Array.isArray(userRoles)) {
    return false;
  }
  return userRoles.some(role => 
    ROLE_PERMISSIONS[role] && ROLE_PERMISSIONS[role].includes(permission)
  );
}

function isAdmin(userRoles) {
  if (!userRoles || !Array.isArray(userRoles)) {
    return false;
  }
  return userRoles.includes(ROLES.ADMIN);
}

function hasManagementRole(userRoles) {
  if (!userRoles || !Array.isArray(userRoles)) {
    return false;
  }
  return userRoles.some(role => [ROLES.TE_HEAD, ROLES.BE_HEAD, ROLES.ADMIN].includes(role));
}

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getRoleLevel,
  hasPermission,
  isAdmin,
  hasManagementRole
};