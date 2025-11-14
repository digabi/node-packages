import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { generateMigrationPath } from '../src/create-migration-path'

describe('create-migration', () => {
  describe('generateMigrationPath', () => {
    test('should generate migration path with timestamp', () => {
      const migrationPath = generateMigrationPath('/tmp', 'test-migration')
      assert.match(migrationPath, new RegExp(`^/tmp/${datetime()}-test-migration.sql$`))
    })

    test('normalize path', () => {
      const migrationPath = generateMigrationPath('/tmp//db//migration/', 'test-migration')
      assert.match(migrationPath, new RegExp(`^\\/tmp/db/migration/${datetime()}-test-migration.sql$`))
    })

    test('deny having slash in the migration name', () => {
      assert.throws(() => generateMigrationPath('.', '/test-migration'))
    })

    test('require migration name', () => {
      assert.throws(() => generateMigrationPath('.', ''))
      assert.throws(() => generateMigrationPath('.', '    '))
    })
  })
})

function datetime() {
  const date = new Date().toISOString().substring(0, 10).replace(/-/g, '')
  const time = '\\d{6}' // ignore time (just check they are numbers) in matching
  return `${date}-${time}`
}
