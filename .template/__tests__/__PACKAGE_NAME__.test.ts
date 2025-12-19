import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { example } from '../src'

describe('__PACKAGE_NAME__', () => {
  test('example test', () => {
    assert.strictEqual(example(), 'Hello from @digabi/__PACKAGE_NAME__')
  })
})
