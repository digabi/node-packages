import { test, describe, before, after, afterEach, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import * as pg from 'pg'
import postgresCacheProvider, { PostgresCacheProvider } from '../src'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'

const ttlMillis = 1000
const delay = promisify(setTimeout)

let pool: pg.Pool
let cache: PostgresCacheProvider
let container: StartedPostgreSqlContainer

before(async () => {
  container = await new PostgreSqlContainer('postgres:16.1')
    .withDatabase('passport-saml-cache-postgres-unittest')
    .start()

  pool = new pg.Pool({
    host: container.getHost(),
    port: container.getPort(),
    database: 'passport-saml-cache-postgres-unittest',
    user: container.getUsername(),
    password: container.getPassword()
  })

  const schema = await fs.readFile('./schema.sql', 'utf-8')
  await pool.query(schema)
})

beforeEach(async () => {
  await pool.query('DELETE FROM passport_saml_cache')

  cache = postgresCacheProvider(pool, { ttlMillis })
})

afterEach(() => cache.close())

after(async () => {
  await pool.end()
  await container.stop()
})

describe('validation', () => {
  test('throws an error if ttlMillis is not a positive integer', () => {
    assert.throws(() => postgresCacheProvider(pool, { ttlMillis: -1 }), /ttlMillis must be a positive integer/)
    assert.throws(() => postgresCacheProvider(pool, { ttlMillis: 1.5 }), /ttlMillis must be a positive integer/)
  })
})

describe('get()', () => {
  test('returns null if key does not exist', async () => {
    const res = await cache.getAsync('key')
    assert.equal(res, null)
  })

  test('returns the value if key exists', async () => {
    await cache.saveAsync('key', 'val')

    const res = await cache.getAsync('key')
    assert.equal(res, 'val')
  })
})

describe('save()', () => {
  test('returns the new value & timestamp if key does not exist', async context => {
    const result = await cache.saveAsync('_a823a9884699d6a26a8ad2d1f013f6bdf3f6c226', 'val')

    assert.notEqual(result!.createdAt, null)
    assert.equal(result!.value, 'val')
  })

  test('throws an error if key already exists', async () => {
    await cache.saveAsync('key', 'val1')

    assert.rejects(
      () => cache.saveAsync('key', 'val2'),
      /duplicate key value violates unique constraint "passport_saml_cache_pkey"/
    )
  })
})

describe('remove()', () => {
  test('returns null if key does not exist', async () => {
    const res = await cache.removeAsync('key')
    assert.equal(res, null)
  })

  test('returns the key if it existed', async () => {
    await cache.saveAsync('key', 'val')

    const res = await cache.removeAsync('key')
    assert.equal(res, 'key')

    const res2 = await cache.removeAsync('key')
    assert.equal(res2, null)
  })
})

describe('expiration', () => {
  test('deletes expired key automatically', async () => {
    await cache.saveAsync('key', 'val')
    await delay(ttlMillis * 2)

    const res = await cache.getAsync('key')
    assert.equal(res, null)
  })
})

describe('error handling', () => {
  test('calls the callback with an error object if an error occurs', async () => {
    const mockPool = {
      query: () => Promise.reject(new Error('Boom!'))
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const cache = postgresCacheProvider(mockPool as any, { ttlMillis })

    const error = new Error('Boom!')

    assert.rejects(() => cache.getAsync('key'), error)
    assert.rejects(() => cache.saveAsync('key', 'value'), error)
    assert.rejects(() => cache.removeAsync('key'), error)

    await delay(ttlMillis * 2) // Wait a bit. The cleanup job error should fire as well.
    cache.close()
  })
})
