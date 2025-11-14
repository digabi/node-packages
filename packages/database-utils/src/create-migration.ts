#!/usr/bin/env node
import { writeFileSync } from 'fs'
import { generateMigrationPath } from './create-migration-path'

if (process.argv.length < 3) {
  console.log('Give migration name as parameter')
  process.exit(1)
}
const migrationFilePath = generateMigrationPath(`${process.cwd()}/db/migrations/`, process.argv[2])
writeFileSync(migrationFilePath, '')
console.log(`New migration file ${migrationFilePath} created`)
