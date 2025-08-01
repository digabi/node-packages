import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import { objectPropertiesToCamel } from '../src'

describe('objectPropertiesToCamel', () => {
  test('camelizes underscores', () => {
    assert.deepEqual(objectPropertiesToCamel({ foo_bar: 1, foz_baz_zus: '2' }), { fooBar: 1, fozBazZus: '2' })
  })

  test('camelizes underscores at the top level only', () => {
    assert.deepEqual(objectPropertiesToCamel({ foo_bar: 1, foz_baz_zus: { goo_gar: { zoo_zar: 3 } } }), {
      fooBar: 1,
      fozBazZus: { goo_gar: { zoo_zar: 3 } }
    })
  })
})
