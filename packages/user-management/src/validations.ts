import z from 'zod'

export const RoleSchema = z.enum([
  'PRINCIPAL',
  'ASSISTANT',
  'SPECIALEDUCATOR',
  'EDUCATOR',
  'PROFESSIONAL',
  'STUDENT',
  'PARENT',
  'STUDENTCOUNSELLOR',
  'GRADING_TEACHER',
  'KTP_ADMIN'
])

export type AddRoleSchema = z.infer<typeof AddRoleSchema>
export const AddRoleSchema = z.object({
  schoolId: z.uuid(),
  role: RoleSchema,
  startdate: z.iso.date(),
  enddate: z.iso.date().optional(),
  name: z.string().optional(),
  allowedExams: z
    .array(z.string().regex(/^.{1,2}$/))
    .optional()
    .transform(arr => new Set(arr))
})

export type DeleteRoleSchema = z.infer<typeof DeleteRoleSchema>
export const DeleteRoleSchema = z.object({
  schoolId: z.uuid(),
  role: RoleSchema
})
