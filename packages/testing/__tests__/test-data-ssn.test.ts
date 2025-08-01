import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import { createRandomHetu } from '../src'
import { isSsnValid } from '@digabi/validation'

describe('test-data-ssn', () => {
  describe('createRandomHetu', () => {
    test('should create valid random ssn', () => {
      const ssn = createRandomHetu()
      assert.equal(isSsnValid(ssn), true)
    })
  })
})
