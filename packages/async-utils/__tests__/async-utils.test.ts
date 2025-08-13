import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { asyncFilter } from '../src'

describe('async-utils', () => {
  describe('asyncFilter', () => {
    test('should filter with async fn', async () => {
      const arr = [{ value: 1 }, { value: 2 }, { value: 3 }]
      const isValid = (value: number) => Promise.resolve(value === 1 ? true : false)

      const res = await asyncFilter(arr, ({ value }) => isValid(value))

      assert.deepEqual(res, [arr[0]])
    })
  })
})
