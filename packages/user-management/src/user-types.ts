import z from 'zod'
import { RoleSchema } from './validations'
import { zodSsn } from '@digabi/validation'
import { PermissionGrantSchema } from './permissions'

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
  id: z.uuid(),
  realSsn: zodSsn,
  impersonatedSsn: zodSsn.or(z.literal('')),
  explanation: z.string(),
  validityStart: z.string(),
  validityEnd: z.string(),
  schoolUuid: z.string().nullish()
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
  firstnames: z.string(),
  lastname: z.string()
})

export type StoredUserDetails = z.infer<typeof StoredUserDetailsSchema>
export const StoredUserDetailsSchema = z.object({
  email: z.email().optional(),
  firstnames: z.string().optional(),
  lastname: z.string().optional()
})

export type SchoolRole = z.infer<typeof SchoolRoleSchema>
export const SchoolRoleSchema = z.object({
  role: RoleSchema,
  startdate: z.iso.date().optional(),
  enddate: z.iso.date().optional(),
  name: z.string().optional(),
  allowedExams: z.array(z.string()).optional(),
  disqualifications: z.array(z.uuid()).optional()
})

export type UserSchoolToUpsert = z.infer<typeof UserSchoolToUpsertSchema>
export const UserSchoolToUpsertSchema = z
  .object({
    schoolId: z.uuid(),
    permissions: z.array(PermissionGrantSchema).optional()
  })
  .strict()

export type CensorDivision = z.infer<typeof CensorDivisionSchema>
export const CensorDivisionSchema = z.object({
  censorDivisionUuid: z.uuid(),
  divisionName: z.string()
})

export type CensorDivisionToUpsert = z.infer<typeof CensorDivisionToUpsertSchema>
export const CensorDivisionToUpsertSchema = z.object({
  censorDivisionUuid: z.string(),
  divisionName: z.string().optional()
})

export type Censoring = z.infer<typeof CensoringSchema>
export const CensoringSchema = z.object({
  divisions: z.array(CensorDivisionSchema).optional(),
  shortCode: z.string(),
  timeFrame: z.object({ from: z.iso.datetime().nullable(), to: z.iso.datetime().nullable() })
})

export type CensorRole = z.infer<typeof CensorRoleSchema>
export const CensorRoleSchema = z.object({
  role: z.literal('CENSOR'),
  startdate: z.iso.date().nullish(),
  enddate: z.iso.date().nullish(),
  metadata: z.object({ shortCode: z.string() }),
  divisions: z.array(CensorDivisionSchema).optional()
})

export type CensorRoleToUpsert = z.infer<typeof CensorRoleToUpsertSchema>
export const CensorRoleToUpsertSchema = z.object({
  role: z.literal('CENSOR'),
  startdate: z.iso.date().nullish(),
  enddate: z.iso.date().nullish(),
  metadata: z.object({ shortCode: z.string() }).optional(),
  divisions: z.array(CensorDivisionToUpsertSchema).optional()
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
  principal: z.boolean(),
  permissions: z.array(PermissionGrantSchema)
})

export type User = z.infer<typeof UserSchema>
export const UserSchema = StoredUserDetailsSchema.extend({
  ssn: zodSsn,
  userAccountId: z.string(),
  schools: z.array(UserSchoolSchema),
  censoring: CensoringSchema.optional(),
  impersonation: z.never().optional(),
  acceptedEulas: z.array(z.enum(['teacher', 'principal', 'censor']))
}).strict()

export type UserToUpsert = z.infer<typeof UserToUpsertSchema>
export const UserToUpsertSchema = UserDetailsSchema.extend({
  ssn: zodSsn,
  schools: z.array(UserSchoolToUpsertSchema),
  censoring: CensoringSchema.optional()
}).strict()

export type PersonalImpersonation = z.infer<typeof PersonalImpersonationSchema>
export const PersonalImpersonationSchema = UserSchema.extend({ impersonation: ImpersonationSchema }).strict()

export type SchoolImpersonation = z.infer<typeof SchoolImpersonationSchema>
export const SchoolImpersonationSchema = z
  .object({
    impersonation: ImpersonationSchema,
    ssn: z.literal('IMPERSONATED'),
    acceptedEulas: z.tuple([z.literal('principal')]),
    schools: z
      .array(
        z.object({
          schoolId: z.string(),
          principal: z.literal(true),
          permissions: z.array(PermissionGrantSchema).max(0, "Impersonated principal doesn't have other permissions")
        })
      )
      .max(1, 'Impersonated principal has one school')
  })
  .strict()

export type ImpersonatedUser = z.infer<typeof ImpersonatedUserSchema>
export const ImpersonatedUserSchema = z.xor([PersonalImpersonationSchema, SchoolImpersonationSchema])
export type UserForAuthentication = z.infer<typeof UserForAuthenticationSchema>
export const UserForAuthenticationSchema = z.xor([UserSchema, ImpersonatedUserSchema])

export type UserWithSchoolRoleAndSchoolId = z.infer<typeof UserWithSchoolRoleAndSchoolIdSchema>
export const UserWithSchoolRoleAndSchoolIdSchema = z.object({
  userAccountId: z.string(),
  ssn: zodSsn,
  userDetails: UserDetailsSchema,
  name: z.string(),
  allowedExams: z.array(z.string()),
  disqualifications: z.array(z.string())
})
