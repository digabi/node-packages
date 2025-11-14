import assert from 'node:assert/strict'
import { test, describe } from 'node:test'

import { check, get as getTotp } from '../src/index'
import { toBuffer } from '../src/base32'

const cases: [key: string, totp: string, ts: number][] = [
  ['JBSWY3DPEHPK3PXP', '355393', 1763052571132],
  ['JBSWY3DPEHPK3PXP', '122654', 1763052601528],
  ['JBSWY3DPEHPK3PXP', '040338', 1763052631097],
  ['JBSWY3DPEHPK3PXP', '994987', 1763052661065],
  ['JBSWY3DPEHPK3PXP', '365734', 1763052691498],
  ['JBSWY3DPEHPK3PXP', '708698', 1763052722183],
  ['JBSWY3DPEHPK3PXP', '190324', 1763052753243],
  ['JBSWY3DPEHPK3PXP', '854416', 1763052781699],
  ['JBSWY3DPEHPK3PXP', '805126', 1763052812954],
  ['JBSWY3DPEHPK3PXP', '418775', 1763052842633]
]

describe('totp', () => {
  describe('cases', () => {
    for (const [key, totp, ts] of cases) {
      test(`generates correct totp: ${totp}`, () => {
        assert.equal(getTotp(toBuffer(key)!, 0, new Date(ts)), totp)
      })
    }
  })

  describe('accepts current totp', () => {
    for (const [key, totp, ts] of cases) {
      test(`accepts totp: ${totp}`, () => {
        assert.deepStrictEqual(check(key, totp, new Date(ts)), { ok: true })
      })
    }
  })

  describe('accepts totp from the immediately previous period', () => {
    for (const [prev, curr] of cases.slice(1).map((k, i) => [cases[i], k] as const)) {
      const [key, totp, _ts] = prev
      const [_key, _totp, ts] = curr
      test(`accepts totp: ${totp}`, () => {
        assert.deepStrictEqual(check(key, totp, new Date(ts)), { ok: true })
      })
    }
  })

  describe('does not accept totp from two periods ago', () => {
    for (const [prev, _, curr] of cases.slice(2).map((k, i) => [cases[i], cases[i + 1], k] as const)) {
      const [key, totp, _ts] = prev
      const [_key, _totp, ts] = curr
      test(`does not accept totp: ${totp}`, () => {
        assert.deepStrictEqual(check(key, totp, new Date(ts)), { ok: false, reason: 'BAD_TOTP' })
      })
    }
  })

  describe('does not accept totps from the next period', () => {
    for (const [curr, next] of cases.slice(1).map((k, i) => [cases[i], k] as const)) {
      const [_key, _totp, ts] = curr
      const [key, totp, _ts] = next
      test(`does not accept totp: ${totp}`, () => {
        assert.deepStrictEqual(check(key, totp, new Date(ts)), { ok: false, reason: 'BAD_TOTP' })
      })
    }
  })
})
