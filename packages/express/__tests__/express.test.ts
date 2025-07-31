import { test, describe, afterEach, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { testApp } from '@digabi/testing'
import express from 'express'
import { AppError, DataError, setupDefaultErrorHandlers } from '../src'
import _ from 'lodash'

const errorMessages: unknown[] = []
const warnMessages: unknown[] = []

const logger = {
  error: function (...args: unknown[]) {
    errorMessages.push(args)
  },
  warn: function (...args: unknown[]) {
    warnMessages.push(args)
  }
}

describe('express', () => {
  let app: ReturnType<typeof express>

  beforeEach(() => {
    errorMessages.length = 0
    warnMessages.length = 0
    app = express()

    app.get('/', (req, res) => {
      res.send('ok')
    })

    app.get('/internalServerError', (_req, _res) => {
      throw new Error('A Random backend failure')
    })

    app.get('/conflict', (req, res, next) => {
      const error = new AppError('Conflict', 409)
      next(error)
    })

    app.get('/dataerror', (req, res, next) => {
      const error = new DataError('DataError Message')
      next(error)
    })

    return testApp.initApp(app)()
  })

  afterEach(testApp.closeApp)

  describe('in dev mode', () => {
    // @ts-expect-error logger type not complete
    beforeEach(() => setupDefaultErrorHandlers(app, true, logger))

    test('should get root successfully', async () => {
      const res = await fetch(testApp.getServerPrefix())
      const data = await res.text()

      assert.equal(data, 'ok')
    })

    test('should fail with 404 on unknown paths', async () => {
      const res = await fetch(`${testApp.getServerPrefix()}/fourohfour`)
      const data = await res.text()

      assert.equal(res.status, 404)
      assert.match(data, /Cannot GET \/fourohfour/)
    })

    test('should fail with 500 on generic errors', async () => {
      const res = await fetch(`${testApp.getServerPrefix()}/internalServerError`)
      const body = await res.json()

      assert.equal(res.status, 500)
      assert.deepEqual(body, { error: {}, message: 'A Random backend failure' })
      assert.equal(errorMessages.length, 1)
    })

    test('should fail with given error code', async () => {
      const res = await fetch(`${testApp.getServerPrefix()}/conflict`)
      const body = await res.json()

      assert.equal(res.status, 409)
      assert.deepEqual(body, { error: { name: 'AppError', status: 409 }, message: 'Conflict' })
      assert.equal(warnMessages.length, 1)
    })

    test('DataError should have message and error visible', async () => {
      const res = await fetch(`${testApp.getServerPrefix()}/dataerror`)
      const body = await res.json()
      assert.equal(res.status, 400)
      assert.deepEqual(body, { error: { status: 400, name: 'DataError' }, message: 'DataError Message' })
      assert.equal(warnMessages.length, 1)
    })
  })

  describe('in production mode', () => {
    // @ts-expect-error logger type not complete
    beforeEach(() => setupDefaultErrorHandlers(app, false, logger))

    test('should get root successfully', async () => {
      const res = await fetch(testApp.getServerPrefix())
      const data = await res.text()

      assert.equal(data, 'ok')
    })

    test('should fail with 404 on unknown paths', async () => {
      const res = await fetch(`${testApp.getServerPrefix()}/fourohfour`)
      const data = await res.text()

      assert.equal(res.status, 404)
      assert.match(data, /Cannot GET \/fourohfour/)
    })

    test('should fail with 500 on generic errors without message', async () => {
      const res = await fetch(`${testApp.getServerPrefix()}/internalServerError`)
      const body = await res.json()

      assert.equal(res.status, 500)
      assert.deepEqual(body, { error: {}, message: '' })
      assert.equal(errorMessages.length, 1)
    })

    test('should fail with given error code without message', async () => {
      const res = await fetch(`${testApp.getServerPrefix()}/conflict`)
      const body = await res.json()

      assert.equal(res.status, 409)
      assert.deepEqual(body, { error: {}, message: '' })
      assert.equal(warnMessages.length, 1)
    })

    test('DataError should have message visible but empty error', async () => {
      const res = await fetch(`${testApp.getServerPrefix()}/dataerror`)
      const body = await res.json()

      assert.equal(res.status, 400)
      assert.deepEqual(body, { error: {}, message: 'DataError Message' })
      assert.equal(warnMessages.length, 1)
    })
  })
})
