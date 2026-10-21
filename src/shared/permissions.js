// Role-based access control, shared by the API (enforcement) and the admin panel (navigation).
import { ROLES } from './options.js';

// Admins can do everything; members have no admin permission. The list stays so
// a narrower staff role can be added later without touching every check.
const ADMIN = [ROLES.ADMIN];

export const PERMISSIONS = Object.freeze({
  'admin.access': ADMIN,
  'overview.view': ADMIN,
  'biodata.review': ADMIN,
  'biodata.edit': ADMIN,
  'reports.manage': ADMIN,
  'tickets.manage': ADMIN,
  'recovery.manage': ADMIN,
  'users.view': ADMIN,
  'users.manage': ADMIN,
  'roles.assign': ADMIN,
  'payments.manage': ADMIN,
  'refunds.manage': ADMIN,
  'connections.adjust': ADMIN,
  'packages.manage': ADMIN,
  'settings.manage': ADMIN,
  'content.manage': ADMIN,
  'analytics.view': ADMIN,
  'audit.view': ADMIN,
});

/** True when `role` has `permission`. */
export function can(role, permission) {
  return (PERMISSIONS[permission] ?? []).includes(role);
}

/** True for roles that may open the admin dashboard. */
export function isAdmin(role) {
  return role === ROLES.ADMIN;
}
