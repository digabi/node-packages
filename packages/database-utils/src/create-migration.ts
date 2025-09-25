import { writeFileSync } from 'fs'
import { normalize } from 'path'

const timeStampPart = new Date()
  .toISOString()
  .replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).\d{3}Z/, '$1$2$3-$4$5$6')

if (process.argv.length < 3) {
  console.log('Give migration name as parameter')
  process.exit(1)
}
const migrationFileName = `${timeStampPart}-${process.argv[2]}.sql`
const migrationFilePath = normalize(`${process.cwd()}/db/migrations/${migrationFileName}`)
writeFileSync(migrationFilePath, '')

console.log(`New migration file ${migrationFilePath} created `)
