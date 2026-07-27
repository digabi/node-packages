import {
  applicationPermissions,
  AppPerm,
  Perm,
  PermissionGrant,
  PermissionOptions,
  User,
  UserForAuthentication,
  UserSchool
} from './index'

type UserToCheck = UserForAuthentication | User

function userSchools(user: UserToCheck, options?: PermissionOptions): UserSchool[] {
  return options?.schoolId ? user.schools.filter(school => school.schoolId === options.schoolId) : user.schools
}

export function userPermissionGrants(user: UserToCheck, options?: PermissionOptions): PermissionGrant[] {
  return userSchools(user, options).flatMap(school => school.permissions)
}

export function userPermissions(user: UserToCheck, options?: PermissionOptions): Perm[] {
  return userPermissionGrants(user, options).map(grant => grant.permission)
}

export function isPrincipal(user: UserToCheck, options?: PermissionOptions): boolean {
  return userSchools(user, options).find(school => school.principal) !== undefined
}

export function hasPermission(user: UserToCheck, requiredPermission: Perm | '*', options?: PermissionOptions): boolean {
  const principal = isPrincipal(user, options)
  if (principal && !options?.ignorePrincipalRight) {
    return true
  }
  const permissions = userPermissions(user, options)
  if (requiredPermission === '*') {
    return permissions.length > 0 // if required permission is '*', any user permission will do
  }
  return permissions.includes(requiredPermission)
}

function isApplicationPermission(permission: Perm): permission is AppPerm {
  return applicationPermissions.includes(permission as AppPerm)
}

export function hasApplicationPermission(user: UserToCheck, options?: PermissionOptions): boolean {
  return (
    isPrincipal(user, options) ||
    userPermissions(user, options).find(permission => isApplicationPermission(permission)) !== undefined
  )
}
