import z from 'zod'

// Application limit in base64 characters (192 KiB), not a Google protocol limit.
export const MAX_ATTESTATION_BASE64_LENGTH = 192 * 1024
// Transport size check only; sa-yo's attestation decoder validates canonical base64 and protobuf.
export const AttestationSchema = z.string().min(4).max(MAX_ATTESTATION_BASE64_LENGTH)

export const VerifiedAccessContextSchema = z.object({ sessionId: z.uuid(), examId: z.uuid() }).strict()

export const VerifiedAccessCompletionSchema = z
  .object({
    attemptId: z.uuid(),
    machineResponse: AttestationSchema,
    kioskResponse: AttestationSchema
  })
  .strict()

export const VerifiedAccessChallengesSchema = z
  .object({
    version: z.literal(1),
    attemptId: z.uuid(),
    expiresAt: z.number().finite(),
    challenges: z.object({ machine: AttestationSchema, kiosk: AttestationSchema }).strict()
  })
  .strict()

export const VerifiedAccessCheckSchema = z
  .object({
    status: z.enum(['verified', 'rejected', 'unavailable']),
    code: z
      .string()
      .regex(/^[A-Z_]+$/)
      .max(64)
  })
  .strict()

// Observations do not grant exam admission or establish same-device session binding.
export const VerifiedAccessObservationSchema = z
  .object({
    version: z.literal(1),
    attemptId: z.uuid(),
    source: z.enum(['google', 'simulation']),
    observationOnly: z.literal(true),
    admissionAllowed: z.literal(false),
    sessionBindingVerified: z.literal(false),
    checkedAt: z.number().finite(),
    machine: VerifiedAccessCheckSchema,
    kiosk: VerifiedAccessCheckSchema
  })
  .strict()

export type VerifiedAccessContext = z.infer<typeof VerifiedAccessContextSchema>
export type VerifiedAccessCompletion = z.infer<typeof VerifiedAccessCompletionSchema>
export type VerifiedAccessChallenges = z.infer<typeof VerifiedAccessChallengesSchema>
export type VerifiedAccessCheck = z.infer<typeof VerifiedAccessCheckSchema>
export type VerifiedAccessObservation = z.infer<typeof VerifiedAccessObservationSchema>
