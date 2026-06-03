import z from 'zod'
import { RoleSchema } from './validations'
import { isSsnValid } from '@digabi/validation'
import { allPermissions } from './permissions'

const zodSsn = z.string().refine(isSsnValid, { message: 'Invalid ssn' })
export type Role = z.infer<typeof RoleSchema>

export type ExamType = z.infer<typeof ExamTypeSchema>
export const ExamTypeSchema = z.enum(['paper', 'digital'])

export type PrincipalOrganization = z.infer<typeof PrincipalOrganizationSchema>
export const PrincipalOrganizationSchema = z.object({
  oid: z.string(),
  name: z.string(),
  uuid: z.uuid().optional(),
  language: z.string().optional()
})

export type Impersonation = z.infer<typeof ImpersonationSchema>
export const ImpersonationSchema = z.object({
  id: z.number(),
  realSsn: zodSsn,
  impersonatedSsn: zodSsn,
  explanation: z.string(),
  validityStart: z.string(),
  validityEnd: z.string(),
  schoolUuid: z.string().optional()
})

export type MockUser = z.infer<typeof MockUserSchema>
export const MockUserSchema = z.object({
  username: z.string(),
  lastname: z.string(),
  firstname: z.string(),
  ssn: zodSsn,
  henkiloOid: z.string(),
  principalOrganization: z.array(PrincipalOrganizationSchema),
  roles: z.array(z.object({ role: z.string() })).optional()
})

export type UserDetails = z.infer<typeof UserDetailsSchema>
export const UserDetailsSchema = z.object({
  email: z.email().optional(),
  firstnames: z.string().optional(),
  lastname: z.string().optional(),
  address: z.string().optional(),
  zip: z.string().optional(),
  postoffice: z.string().optional(),
  telephones: z.array(z.string()).optional()
})

export type SchoolRole = z.infer<typeof SchoolRoleSchema>
export const SchoolRoleSchema = z.object({
  role: RoleSchema,
  startdate: z.iso.date().optional(),
  enddate: z.iso.date().optional(),
  name: z.string().optional(),
  allowedExams: z.array(z.string()).optional()
})

export type UserSchoolToUpsert = z.infer<typeof UserSchoolToUpsertSchema>
export const UserSchoolToUpsertSchema = z.object({
  schoolId: z.uuid(),
  email: z.email().optional(),
  roles: z.array(SchoolRoleSchema).optional()
})

export type CensorRoleDivision = z.infer<typeof CensorRoleDivisionSchema>
export const CensorRoleDivisionSchema = z.object({
  censorDivisionUuid: z.uuid(),
  divisionName: z.string(),
  divisionExamType: ExamTypeSchema
})

export type CensorRoleDivisionToUpsert = z.infer<typeof CensorRoleDivisionToUpsertSchema>
export const CensorRoleDivisionToUpsertSchema = z.object({
  censorDivisionUuid: z.string(),
  divisionName: z.string().optional(),
  divisionExamType: ExamTypeSchema.optional()
})

export type CensorRole = z.infer<typeof CensorRoleSchema>
export const CensorRoleSchema = z.object({
  role: z.literal('CENSOR'),
  startdate: z.iso.date().nullish(),
  enddate: z.iso.date().nullish(),
  metadata: z.object({ shortCode: z.string() }),
  divisions: z.array(CensorRoleDivisionSchema).optional()
})

export type CensorRoleToUpsert = z.infer<typeof CensorRoleToUpsertSchema>
export const CensorRoleToUpsertSchema = z.object({
  role: z.literal('CENSOR'),
  startdate: z.iso.date().nullish(),
  enddate: z.iso.date().nullish(),
  metadata: z.object({ shortCode: z.string() }).optional(),
  divisions: z.array(CensorRoleDivisionToUpsertSchema).optional()
})

export type DivisionToAdd = z.infer<typeof DivisionToAddSchema>
export const DivisionToAddSchema = z.object({
  name: z.string(),
  examType: ExamTypeSchema.optional()
})

export type SchoolRoleToAdd = z.infer<typeof SchoolRoleToAddSchema>
export const SchoolRoleToAddSchema = z.object({
  schoolId: z.string(),
  role: RoleSchema,
  startdate: z.iso.date(),
  enddate: z.iso.date().optional(),
  name: z.string().optional(),
  allowedExams: z.array(z.string()).optional()
})

export type GradingTeacherSchoolRole = z.infer<typeof GradingTeacherSchoolRoleSchema>
export const GradingTeacherSchoolRoleSchema = z.object({
  role: z.literal('GRADING_TEACHER'),
  validityPeriod: z.string(),
  userAccountId: z.string(),
  schoolId: z.string(),
  name: z.string().optional(),
  disqualifications: z.array(z.string()),
  allowedExams: z.array(z.string())
})

export type UserSchool = z.infer<typeof UserSchoolSchema>
export const UserSchoolSchema = z.object({
  schoolId: z.string(),
  email: z.string().optional(),
  principal: z.boolean(),
  roles: z.array(SchoolRoleSchema),
  permissions: z.array(z.enum(allPermissions))
})

export type User = z.infer<typeof UserSchema>
export const UserSchema = UserDetailsSchema.extend({
  ssn: zodSsn,
  userAccountId: z.string(),
  schools: z.array(UserSchoolSchema),
  roles: z.array(CensorRoleSchema)
})

export type UserToUpsert = z.infer<typeof UserToUpsertSchema>
export const UserToUpsertSchema = UserDetailsSchema.extend({
  ssn: zodSsn,
  userAccountId: z.uuid().optional(),
  schools: z.array(UserSchoolToUpsertSchema).optional(),
  roles: z.array(CensorRoleToUpsertSchema).optional()
})

const ImpersonatedUserSchema = z.object({
  ssn: z.literal('IMPERSONATED'),
  schools: z.tuple([
    z.object({
      schoolId: z.string(),
      roles: z.tuple([z.object({ role: z.literal('PRINCIPAL') })])
    })
  ]),
  impersonation: ImpersonationSchema
})

export type UserForAuthentication = z.infer<typeof UserForAuthenticationSchema>
export const UserForAuthenticationSchema = z.union([
  UserSchema.extend({ impersonation: ImpersonationSchema.optional() }),
  ImpersonatedUserSchema
])

export type UserWithSchoolRoleAndSchoolId = z.infer<typeof UserWithSchoolRoleAndSchoolIdSchema>
export const UserWithSchoolRoleAndSchoolIdSchema = z.object({
  userAccountId: z.string(),
  ssn: zodSsn,
  userDetails: UserDetailsSchema,
  name: z.string(),
  allowedExams: z.array(z.string()),
  disqualifications: z.array(z.string())
})
