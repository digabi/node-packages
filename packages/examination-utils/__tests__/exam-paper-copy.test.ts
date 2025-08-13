import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { examCopyFileNameToS3Path } from '../src'

describe('exam-paper-copy-test', () => {
  describe('examCopyFileNameToS3Path', () => {
    test('generates s3 file path from exam paper copy file name and returns it', () => {
      assert.equal(examCopyFileNameToS3Path('2024K_10809.pdf'), '2024K/pdf/2024K_10809.pdf')
      assert.equal(examCopyFileNameToS3Path('2024S_13423.html'), '2024S/html/2024S_13423.html')
      assert.equal(examCopyFileNameToS3Path('2016S_123524.pdf'), '2016S/pdf/2016S_123524.pdf')
      assert.equal(examCopyFileNameToS3Path('2018K_123524.html'), '2018K/html/2018K_123524.html')
    })

    test('returns file name as is, if it does not contain extension', () => {
      assert.equal(examCopyFileNameToS3Path('2024K_10809'), '2024K_10809')
    })

    test('returns file name as is, if it is a falsy value', () => {
      assert.equal(examCopyFileNameToS3Path(''), '')
      // @ts-expect-error testing invalid parameter
      assert.equal(examCopyFileNameToS3Path(null), null)
      // @ts-expect-error testing invalid parameter
      assert.equal(examCopyFileNameToS3Path(undefined), undefined)
    })
  })
})
