import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import {
  AttestationSchema,
  MAX_ATTESTATION_BASE64_LENGTH,
  VerifiedAccessChallengesSchema,
  VerifiedAccessCompletionSchema,
  VerifiedAccessContextSchema,
  VerifiedAccessObservationSchema
} from '../src'

test('accepts KTP context without accepting caller-selected organization policy', () => {
  const context = { sessionId: randomUUID(), examId: randomUUID() }
  assert.deepEqual(VerifiedAccessContextSchema.parse(context), context)
  assert.equal(VerifiedAccessContextSchema.safeParse({ ...context, expectedIdentity: 'example.org' }).success, false)
  assert.equal(VerifiedAccessContextSchema.safeParse({ ...context, sessionId: 'invalid' }).success, false)
})

test('bounds base64 string lengths consistently for challenges and responses', () => {
  const largest = 'A'.repeat(MAX_ATTESTATION_BASE64_LENGTH)
  assert.equal(AttestationSchema.safeParse(largest).success, true)
  assert.equal(AttestationSchema.safeParse(`${largest}A`).success, false)
  assert.equal(AttestationSchema.safeParse('abc').success, false)
  assert.equal(AttestationSchema.safeParse(123).success, false)
})

test('requires both challenge scopes, protocol v1 and a finite expiry', () => {
  const challenges = {
    version: 1,
    attemptId: randomUUID(),
    expiresAt: Date.now(),
    challenges: { machine: 'AAAA', kiosk: 'BBBB' }
  }
  assert.deepEqual(VerifiedAccessChallengesSchema.parse(challenges), challenges)
  for (const change of [{ version: 2 }, { expiresAt: Infinity }, { challenges: { machine: 'AAAA' } }]) {
    assert.equal(VerifiedAccessChallengesSchema.safeParse({ ...challenges, ...change }).success, false)
  }
})

test('requires both responses and the attempt ID when completing', () => {
  const completion = { attemptId: randomUUID(), machineResponse: 'AAAA', kioskResponse: 'BBBB' }
  assert.deepEqual(VerifiedAccessCompletionSchema.parse(completion), completion)
  assert.equal(VerifiedAccessCompletionSchema.safeParse({ ...completion, kioskResponse: undefined }).success, false)
  assert.equal(VerifiedAccessCompletionSchema.safeParse({ ...completion, customerId: 'other' }).success, false)
})

test('accepts verified, rejected and unavailable observations without granting admission', () => {
  for (const status of ['verified', 'rejected', 'unavailable']) {
    const observation = {
      version: 1,
      attemptId: randomUUID(),
      source: 'simulation',
      observationOnly: true,
      admissionAllowed: false,
      sessionBindingVerified: false,
      checkedAt: Date.now(),
      machine: { status, code: 'DEVICE_RESULT' },
      kiosk: { status, code: 'KIOSK_RESULT' }
    }
    assert.deepEqual(VerifiedAccessObservationSchema.parse(observation), observation)
    for (const change of [
      { admissionAllowed: true },
      { observationOnly: false },
      { sessionBindingVerified: true },
      { source: 'unknown' },
      { machine: { status: 'unknown', code: 'DEVICE_RESULT' } }
    ]) {
      assert.equal(VerifiedAccessObservationSchema.safeParse({ ...observation, ...change }).success, false)
    }
  }
})
