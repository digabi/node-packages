import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import { randomString } from '../src'

describe('test-data-generic', () => {
  describe('randomString', () => {
    test('should return random string with 12 chars by default', () => {
      const res = randomString()
      assert.equal(res.length, 12)
      assert.equal(typeof res, 'string')
    })

    test('should return random string with given length', () => {
      const res = randomString(5)
      assert.equal(res.length, 5)
      assert.equal(typeof res, 'string')
    })
  })
})
