export enum AppRole {
  EMPLOYEE = "EMPLOYEE",
  TEAM_LEAD = "TEAM_LEAD",
  MANAGER = "MANAGER",
  HR = "HR",
  IT_SUPPORT = "IT_SUPPORT",
  ADMIN = "ADMIN",
}

export type Permission =
  | "tickets:create"
  | "tickets:view:own"
  | "tickets:view:team"
  | "tickets:view:all"
  | "tickets:assign"
  | "tickets:update"
  | "documents:create"
  | "documents:approve"
  | "verification:create"
  | "verification:approve"
  | "background:view"
  | "background:manage"
  | "learning:view"
  | "learning:manage"
  | "admin:users"
  | "admin:settings"
  | "admin:analytics";

const rolePermissions: Record<AppRole, Permission[]> = {
  [AppRole.EMPLOYEE]: [
    "tickets:create",
    "tickets:view:own",
    "documents:create",
    "verification:create",
    "learning:view",
  ],

  [AppRole.TEAM_LEAD]: [
    "tickets:create",
    "tickets:view:own",
    "tickets:view:team",
    "documents:create",
    "verification:create",
    "learning:view",
  ],

  [AppRole.MANAGER]: [
    "tickets:create",
    "tickets:view:own",
    "tickets:view:team",
    "documents:create",
    "verification:create",
    "learning:view",
  ],

  [AppRole.HR]: [
    "documents:create",
    "documents:approve",
    "verification:create",
    "verification:approve",
    "background:view",
    "background:manage",
    "learning:view",
  ],

  [AppRole.IT_SUPPORT]: [
    "tickets:view:all",
    "tickets:assign",
    "tickets:update",
    "learning:view",
  ],

  [AppRole.ADMIN]: [
    "tickets:create",
    "tickets:view:own",
    "tickets:view:team",
    "tickets:view:all",
    "tickets:assign",
    "tickets:update",
    "documents:create",
    "documents:approve",
    "verification:create",
    "verification:approve",
    "background:view",
    "background:manage",
    "learning:view",
    "learning:manage",
    "admin:users",
    "admin:settings",
    "admin:analytics",
  ],
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  role: AppRole,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(
  role: AppRole,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function getRolePermissions(role: AppRole): Permission[] {
  return rolePermissions[role] ?? [];
}

export function isAdmin(role: AppRole): boolean {
  return role === AppRole.ADMIN;
}

export function isHR(role: AppRole): boolean {
  return role === AppRole.HR;
}

export function isITSupport(role: AppRole): boolean {
  return role === AppRole.IT_SUPPORT;
}

export function canManageUsers(role: AppRole): boolean {
  return hasPermission(role, "admin:users");
}

export function canManageSettings(role: AppRole): boolean {
  return hasPermission(role, "admin:settings");
}

export function canViewAnalytics(role: AppRole): boolean {
  return hasPermission(role, "admin:analytics");
}

export function canCreateTicket(role: AppRole): boolean {
  return hasPermission(role, "tickets:create");
}

export function canAssignTicket(role: AppRole): boolean {
  return hasPermission(role, "tickets:assign");
}

export function canUpdateTicket(role: AppRole): boolean {
  return hasPermission(role, "tickets:update");
}

export function canCreateDocumentRequest(role: AppRole): boolean {
  return hasPermission(role, "documents:create");
}

export function canApproveDocumentRequest(role: AppRole): boolean {
  return hasPermission(role, "documents:approve");
}

export function canCreateVerification(role: AppRole): boolean {
  return hasPermission(role, "verification:create");
}

export function canApproveVerification(role: AppRole): boolean {
  return hasPermission(role, "verification:approve");
}

export function canManageBackgroundVerification(role: AppRole): boolean {
  return hasPermission(role, "background:manage");
}

export function canViewLearning(role: AppRole): boolean {
  return hasPermission(role, "learning:view");
}

export function canManageLearning(role: AppRole): boolean {
  return hasPermission(role, "learning:manage");
}