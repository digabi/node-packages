import { normalize } from 'path'

export function generateMigrationPath(migrationFolder: string, migrationName: string) {
  const migrationNameTrimmed = migrationName.replace(/\s/g, '')
  if (!migrationNameTrimmed) {
    throw new Error('No migration name')
  }
  if (migrationNameTrimmed.includes('/')) {
    throw new Error("Migration name cannot contain '/'")
  }
  const timeStampPart = new Date()
    .toISOString()
    .replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).\d{3}Z/, '$1$2$3-$4$5$6')

  const migrationFileName = `${timeStampPart}-${migrationNameTrimmed}.sql`
  return normalize(`${migrationFolder}/${migrationFileName}`)
}
