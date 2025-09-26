// Frontend role constants (should match backend)
export const ROLES = {
  EVENT_COORDINATOR: 'event_coordinator',
  TE_HEAD: 'te_head',
  BE_HEAD: 'be_head',
  ADMIN: 'admin'
};

// Helper functions for frontend role checking
export function isAdmin(user) {
  return user?.events?.some(e => e.role === ROLES.ADMIN);
}

export function hasManagementRole(user) {
  return user?.events?.some(e => 
    [ROLES.TE_HEAD, ROLES.BE_HEAD, ROLES.ADMIN].includes(e.role)
  );
}

export function hasRole(user, role) {
  return user?.events?.some(e => e.role === role);
}

export function getUserRoles(user) {
  return user?.events?.map(e => e.role) || [];
}

export function getHighestRole(user) {
  const roles = getUserRoles(user);
  if (roles.includes(ROLES.ADMIN)) return ROLES.ADMIN;
  if (roles.includes(ROLES.TE_HEAD)) return ROLES.TE_HEAD;
  if (roles.includes(ROLES.BE_HEAD)) return ROLES.BE_HEAD;
  if (roles.includes(ROLES.EVENT_COORDINATOR)) return ROLES.EVENT_COORDINATOR;
  return null;
}