import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { parseDateFromMigrationFilePath } from '../src/migration-runner'
import { Logger } from 'winston'

const mockLogger = {
  error: () => {}
} as unknown as Logger

describe('migration-runner', () => {
  describe('parseDateFromMigrationFilePath', () => {
    test('should parse date from migration file path', () => {
      const path = '20221212-155836-add-screenshot-index.sql'
      const date = parseDateFromMigrationFilePath(path, mockLogger)

      assert.equal(date.toISOString(), '2022-12-12T13:58:36.000Z')
      assert.equal(date.valueOf(), 1670853516000)
    })
  })
})
