import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { hasApplicationPermission, hasPermission, isPrincipal, Perm, PermissionGrant, User } from '../src/index'
import { randomUUID } from 'node:crypto'

const schoolIds = [randomUUID(), randomUUID(), randomUUID()]

const user: User = {
  userAccountId: '',
  ssn: '',
  firstnames: '',
  lastname: '',
  schools: schoolIds.map(schoolId => ({ schoolId, permissions: [], principal: false, roles: [] })),
  acceptedEulas: []
}

describe('Permissions', () => {
  const testCases = <{ permissions: Perm[]; principal?: boolean; requiredPermission: Perm; expectedResult: boolean }[]>[
    {
      permissions: [],
      requiredPermission: '*',
      expectedResult: false
    },
    {
      permissions: [],
      requiredPermission: 'application-dyslexia',
      expectedResult: false
    },

    {
      permissions: [],
      requiredPermission: 'application-illness',
      expectedResult: false
    },

    {
      permissions: ['application-dyslexia', 'foo'],
      requiredPermission: '*',
      expectedResult: true
    },
    {
      permissions: ['application-dyslexia'],
      requiredPermission: 'application-illness',
      expectedResult: false
    },
    {
      permissions: ['application-dyslexia'],
      requiredPermission: 'application-dyslexia',
      expectedResult: true
    },

    {
      permissions: [],
      principal: true,
      requiredPermission: '*',
      expectedResult: true
    },
    {
      permissions: [],
      principal: true,
      requiredPermission: 'application-foreign',
      expectedResult: true
    }
  ]

  test('check variety of permissions', () => {
    for (const testCase of testCases) {
      const testCaseUser = modifyUser(user, 0, testCase.permissions, testCase.principal)
      const message = `${testCase.expectedResult ? 'Accessible' : 'Inaccessible'} (user permissions: [${testCase.permissions.toString()}], principal: ${testCase.principal ?? false}, required permission: ${testCase.requiredPermission})`
      assert.equal(hasPermission(testCaseUser, testCase.requiredPermission), testCase.expectedResult, message)
    }
  })

  test('check if principal', () => {
    const testCaseUser = modifyUser(user, 0, [], true)
    assert.equal(isPrincipal(testCaseUser), true)
  })

  test('check if principal in given school', () => {
    const testCaseUser = modifyUser(user, 0, [], true)
    assert.equal(isPrincipal(testCaseUser, { schoolId: user.schools[0].schoolId }), true)
    assert.equal(isPrincipal(testCaseUser, { schoolId: user.schools[1].schoolId }), false)
  })

  test('check if a user has a permission in given school', () => {
    const testCaseUser = modifyUser(user, 0, ['observations'])
    assert.equal(hasPermission(testCaseUser, 'observations', { schoolId: testCaseUser.schools[0].schoolId }), true)
    assert.equal(hasPermission(testCaseUser, 'observations', { schoolId: testCaseUser.schools[1].schoolId }), false)
    const testCasePrincipal = modifyUser(user, 0, [], true)
    assert.equal(hasPermission(testCasePrincipal, 'observations', { schoolId: testCaseUser.schools[0].schoolId }), true)
    assert.equal(
      hasPermission(testCasePrincipal, 'observations', { schoolId: testCaseUser.schools[1].schoolId }),
      false
    )
  })

  test('check if a user has a permission in given school ignoring principal right', () => {
    const testCaseUser = modifyUser(user, 0, [], true)
    assert.equal(
      hasPermission(testCaseUser, 'observations', {
        schoolId: testCaseUser.schools[0].schoolId,
        ignorePrincipalRight: true
      }),
      false
    )
    assert.equal(
      hasPermission(testCaseUser, 'observations', {
        schoolId: testCaseUser.schools[1].schoolId,
        ignorePrincipalRight: true
      }),
      false
    )
  })

  test('check if a user has an application permission', () => {
    const testCaseUser = modifyUser(user, 0, ['application-illness'])
    assert.equal(hasApplicationPermission(testCaseUser), true)
    assert.equal(hasApplicationPermission(testCaseUser, { schoolId: testCaseUser.schools[1].schoolId }), false)
    const testCasePrincipal = modifyUser(user, 0, [], true)
    assert.equal(hasApplicationPermission(testCasePrincipal), true)
    assert.equal(hasApplicationPermission(testCasePrincipal, { schoolId: testCaseUser.schools[1].schoolId }), false)
  })
})

function modifyUser(user: User, schoolIindex: number, permissions: Perm[], principal?: boolean): User {
  const grants = permissions.map(p => ({ permission: p })) as PermissionGrant[]
  return {
    ...user,
    schools: user.schools.map((school, index) =>
      index === schoolIindex ? { ...school, principal: principal ?? false, permissions: grants } : school
    )
  }
}
