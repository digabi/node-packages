import { isValid, parse } from 'date-fns'
import { promises as fs } from 'fs'
import pg, { Connection } from 'pg-using-bluebird'
import { Logger } from 'winston'

export const parseDateFromMigrationFilePath = (str: string, logger: Logger) => {
  const dateFormat = 'yyyyMMdd-HHmmss'
  const matchedDate = str.match(/^\d{8}-\d{6}(?=-\S+\.sql$)/)
  const parsedDate = matchedDate ? parse(matchedDate[0], dateFormat, new Date()) : undefined
  if (!parsedDate || !isValid(parsedDate)) {
    const invalidDate = `Date ${str} in migration file name is not valid, the format should be ${dateFormat}`
    logger.error(invalidDate)
    throw new Error(invalidDate)
  }
  return parsedDate
}

const createMigrationTable = (tx: Connection) =>
  tx.queryAsync(`
        CREATE TABLE IF NOT EXISTS schemaversion (
            schemaversion_id BIGSERIAL PRIMARY KEY,
            filename TEXT UNIQUE NOT NULL,
            applied TIMESTAMP WITH TIME ZONE NOT NULL
        )
    `)

const lockSchemaTable = (tx: Connection) => tx.queryAsync('LOCK TABLE schemaversion IN ACCESS EXCLUSIVE MODE NOWAIT')

const getAppliedMigrations = (tx: Connection): Promise<string[]> =>
  tx.queryRowsAsync<{ filename: string }>('SELECT filename FROM schemaversion').map(row => row.filename)

const getUnappliedMigrationFiles = async (
  logger: Logger,
  lockTx: Connection,
  migrationDir: string
): Promise<Array<string>> => {
  const appliedMigrations = await getAppliedMigrations(lockTx)

  try {
    await fs.stat(migrationDir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
  }

  const migrations = await fs.readdir(migrationDir)
  return migrations
    .filter(name => name.match(/\.sql$/i) !== null)
    .filter(filePath => !appliedMigrations.includes(filePath))
    .map(path => ({ path, date: parseDateFromMigrationFilePath(path, logger) }))
    .sort((a, b) => a.date.valueOf() - b.date.valueOf())
    .map(({ path }) => path)
}

const applyMigration = async (
  logger: Logger,
  lockTx: Connection,
  specPath: string,
  quiet: boolean,
  migrationDir: string
) => {
  const script = await fs.readFile(`${migrationDir}/${specPath}`, 'utf8')

  try {
    await lockTx.queryAsync(script)
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to apply migration ${specPath}, ${error.message}`)
    }
    throw error
  }

  await lockTx.queryAsync('INSERT INTO schemaversion (filename, applied) VALUES ($1, NOW())', [specPath])

  if (!quiet) {
    logger.info(`Applied migration ${specPath}`)
  }
}

export const migrate = async ({
  logger,
  dbUrl,
  dbNames,
  quiet = false,
  migrationDir = `${process.cwd()}/db/migrations`,
  tx
}: {
  logger: Logger
  dbUrl: string
  dbNames: string[]
  quiet?: boolean
  migrationDir?: string
  tx?: Connection
}) => {
  const isValidService = dbNames.some(name => dbUrl.includes(name))
  if (!isValidService || (dbUrl.includes('aws') && !process.env.YTL_AWS_STACK)) {
    logger.error('Trying to migrate to invalid environment', {
      dbNames,
      dbUrl,
      YTL_AWS_STACK: process.env.YTL_AWS_STACK
    })
    throw new Error(`Cannot migrate to given environment`)
  }

  const pgrm = pg({ dbUrl })
  try {
    if (tx) {
      await createMigrationTable(tx)
    } else {
      await pgrm.withTransaction(tx => createMigrationTable(tx))
    }
  } catch (error) {
    const stack = String((error as Error).stack)
    logger.error(`Fatal error occured while creating migration table (schemaversion): ${stack}`)
    throw error
  }

  try {
    if (tx) {
      await runMigrationsInTransaction(tx)
    } else {
      await pgrm.withTransaction((lockTx: Connection) => runMigrationsInTransaction(lockTx))
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Fatal error occured while running migrations: ${error.message}`)
    } else {
      logger.error(error)
    }
    throw error
  }

  async function runMigrationsInTransaction(lockTx: Connection) {
    try {
      if (!(await lockSchemaTable(lockTx))) {
        logger.warn('Could not lock schema table. Someone else is probably running the migrations.')
        return
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === '55P03') {
        logger.warn(
          'Error 55P03 lock_not_available while locking schema table. Ignoring error without trying to migrate as someone else is probably running the migrations.'
        )
        return
      } else {
        logger.error(`Unknown error while locking the schema table: ${String(error)}`)
        throw error
      }
    }
    const files = await getUnappliedMigrationFiles(logger, lockTx, migrationDir)
    if (!quiet) {
      logger.info(`Applying total of ${files.length} migrations`)
    }

    try {
      for (const file of files) {
        await applyMigration(logger, lockTx, file, quiet, migrationDir)
      }
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e.message)
      } else {
        logger.error(e)
      }
    }
  }
}
