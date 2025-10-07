import api from '../api';

// Cached roles data
let cachedRoles = null;
let cachedRoleLabels = null;
let cachedAvailableRoles = null;

// Fetch roles from backend API
export async function fetchRolesFromAPI() {
  try {
    const response = await api.get('/admin/roles');
    cachedRoles = response.data.roles;
    cachedRoleLabels = response.data.roleLabels;
    cachedAvailableRoles = response.data.availableRoles;
    return response.data;
  } catch (error) {
    console.error('Failed to fetch roles from API:', error);
    // Fallback to hardcoded values if API fails
    return getFallbackRoles();
  }
}

// Fallback roles if API fails
function getFallbackRoles() {
  const ROLES = {
    VOLUNTEER: 'volunteer',
    TEAM_MEMBER: 'team_member',
    EVENT_COORDINATOR: 'event_coordinator',
    TE_HEAD: 'te_head',
    BE_HEAD: 'be_head',
    ADMIN: 'admin'
  };

  const ROLE_LABELS = {
    [ROLES.VOLUNTEER]: 'Volunteer',
    [ROLES.TEAM_MEMBER]: 'Team Member',
    [ROLES.EVENT_COORDINATOR]: 'Event Coordinator',
    [ROLES.TE_HEAD]: 'Technical Head',
    [ROLES.BE_HEAD]: 'Backend Head',
    [ROLES.ADMIN]: 'Administrator'
  };

  const availableRoles = [
    { value: ROLES.VOLUNTEER, label: ROLE_LABELS[ROLES.VOLUNTEER] },
    { value: ROLES.TEAM_MEMBER, label: ROLE_LABELS[ROLES.TEAM_MEMBER] },
    { value: ROLES.EVENT_COORDINATOR, label: ROLE_LABELS[ROLES.EVENT_COORDINATOR] },
    { value: ROLES.TE_HEAD, label: ROLE_LABELS[ROLES.TE_HEAD] },
    { value: ROLES.BE_HEAD, label: ROLE_LABELS[ROLES.BE_HEAD] },
    { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN] }
  ];

  return { roles: ROLES, roleLabels: ROLE_LABELS, availableRoles };
}

// Export ROLES object (synchronous access, uses cached or fallback)
export const ROLES = cachedRoles || getFallbackRoles().roles;

// Export ROLE_LABELS (synchronous access)
export const ROLE_LABELS = cachedRoleLabels || getFallbackRoles().roleLabels;

// Get available roles for dropdowns
export function getAvailableRoles() {
  return cachedAvailableRoles || getFallbackRoles().availableRoles;
}

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
  if (roles.includes(ROLES.TEAM_MEMBER)) return ROLES.TEAM_MEMBER;
  if (roles.includes(ROLES.VOLUNTEER)) return ROLES.VOLUNTEER;
  return null;
}