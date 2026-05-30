import z from 'zod'
import { RoleSchema } from './validations'
import { Perm } from '.'

export type MockUser = {
  username: string
  lastname: string
  firstname: string
  ssn: string
  henkiloOid: string
  principalOrganization: PrincipalOrganization[]
  roles?: { role: string }[]
}

export type PrincipalOrganization = {
  oid: string
  name: string
  uuid?: string
  language?: string
}

export interface Impersonation {
  id: number
  realSsn: string
  impersonatedSsn: string
  explanation: string
  validityStart: string
  validityEnd: string
  schoolUuid?: string
}

export type UserForAuthentication =
  | (User & {
      impersonation?: Impersonation
    })
  | ImpersonatedUser

type ImpersonatedUser = {
  ssn: 'IMPERSONATED'
  schools: [
    {
      schoolId: string
      roles: [
        {
          role: 'PRINCIPAL'
          startdate?: never
          enddate?: never
          allowedExams?: never
        }
      ]
    }
  ]
  impersonation: Impersonation
  roles?: never
  userAccountId?: never
}

export type UserToUpsert = UserDetails & {
  ssn: string
  userAccountId?: string
  schools?: UserSchoolToUpsert[]
  roles?: CensorRoleToUpsert[]
}

export type User = UserDetails & {
  ssn: string
  userAccountId: string
  schools: UserSchool[]
  roles: CensorRole[]
}

export type UserDetails = {
  email?: string
  firstnames?: string
  lastname?: string
  address?: string
  zip?: string
  postoffice?: string
  telephones?: string[]
}

export interface UserSchoolToUpsert {
  schoolId: string
  email?: string
  roles?: SchoolRole[]
}
export interface UserSchool {
  schoolId: string
  email?: string
  principal: boolean
  roles: SchoolRole[]
  permissions: Perm[]
}

export type Role = z.infer<typeof RoleSchema>

export interface SchoolRole {
  role: Role
  startdate?: string | null
  enddate?: string | null
  allowedExams?: string[]
}

export type ExamType = 'paper' | 'digital'

export interface CensorRoleDivisionToUpsert {
  censorDivisionUuid: string
  divisionName?: string
  divisionExamType?: ExamType
}

export type CensorRoleToUpsert = Omit<CensorRole, 'divisions'> & {
  divisions?: CensorRoleDivisionToUpsert[]
}

export interface DivisionToAdd {
  name: string
  examType?: ExamType
}

export type CensorRole = {
  role: 'CENSOR'
  startdate?: string | null
  enddate?: string | null
  metadata: { shortCode: string }
  divisions?: CensorRoleDivision[]
}

export interface CensorRoleDivision {
  censorDivisionUuid: string
  divisionName: string
  divisionExamType: ExamType
}

export type GradingTeacherSchoolRole = {
  role: 'GRADING_TEACHER'
  validityPeriod: string
  userAccountId: string
  schoolId: string
  name?: string
  disqualifications: string[]
  allowedExams: string[]
}

export type SchoolRoleToAdd = {
  schoolId: string
  role: Role
  startdate: string
  enddate?: string
  name?: string
  allowedExams?: string[]
}

export type UserWithSchoolRoleAndSchoolId = {
  userAccountId: string
  ssn: string
  userDetails: UserDetails
  name: string
  allowedExams: string[]
  disqualifications: string[]
}
