import { applicationPermissions, AppPerm, perm, Perm, PermissionOptions, User, UserSchool } from './index'

function userSchools(user: User, options?: PermissionOptions): UserSchool[] {
  return options?.schoolId ? user.schools.filter(school => school.schoolId === options.schoolId) : user.schools
}

export function userPermissions(user: User, options?: PermissionOptions): Perm[] {
  return userSchools(user, options).flatMap(school => school.permissions) ?? []
}

export function isPrincipal(user: User, options?: PermissionOptions): boolean {
  return userSchools(user, options).find(school => school.principal) !== undefined
}

export function hasPermission(user: User, requiredPermission: Perm, options?: PermissionOptions): boolean {
  const principal = isPrincipal(user, options)
  if (principal && !options?.ignorePrincipalRight) {
    return true
  }
  const permissions = userPermissions(user, options)
  if (requiredPermission === perm.any) {
    return permissions.length > 0 // if required permission is '*', any user permission will do
  }
  return permissions.includes(requiredPermission)
}

function isApplicationPermission(permission: Perm): permission is AppPerm {
  return applicationPermissions.includes(permission as AppPerm)
}

export function hasApplicationPermission(user: User, options?: PermissionOptions): boolean {
  return (
    isPrincipal(user, options) ||
    userPermissions(user, options).find(permission => isApplicationPermission(permission)) !== undefined
  )
}
