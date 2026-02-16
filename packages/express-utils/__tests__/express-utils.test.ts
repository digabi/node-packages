import { test, describe, afterEach, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { testApp } from '@digabi/testing'
import express, { Express } from 'express'
import { AppError, DataError, ProxyError, proxyWithOpts, setupDefaultErrorHandlers } from '../src'
import _ from 'lodash'
import { Logger } from 'winston'

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

describe('express-utils', () => {
  let app: Express

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

describe('proxyWithOpts', () => {
  let proxyApp: Express
  let upstreamServer: http.Server
  let upstreamPort: number
  const proxyErrors: ProxyError[] = []

  let signalRequestReceived: () => void
  let signalCanRespond: () => void
  let signalErrorLogged: () => void
  let requestReceived: Promise<void>
  let canRespond: Promise<void>
  let errorLogged: Promise<void>

  const proxyLogger = {
    error: (...args: ProxyError[]) => {
      proxyErrors.push(args[1])
      signalErrorLogged()
    },
    warn: (...args: ProxyError[]) => {
      proxyErrors.push(args[1])
      signalErrorLogged()
    }
  }

  beforeEach(async () => {
    proxyErrors.length = 0

    requestReceived = new Promise<void>(resolve => {
      signalRequestReceived = resolve
    })
    canRespond = new Promise<void>(resolve => {
      signalCanRespond = resolve
    })
    errorLogged = new Promise<void>(resolve => {
      signalErrorLogged = resolve
    })

    // Upstream server waits for signal before responding - eliminates race conditions
    upstreamServer = http.createServer((_req, res) => {
      signalRequestReceived() // Tell test: request arrived
      // Wait for test signal, then respond
      const respond = async () => {
        await canRespond
        res.writeHead(200, { 'content-type': 'text/plain' })
        res.end('data')
      }
      void respond()
    })

    await new Promise<void>(resolve => {
      upstreamServer.listen(0, () => {
        upstreamPort = (upstreamServer.address() as { port: number }).port
        resolve()
      })
    })

    proxyApp = express()
    proxyApp.use('/proxy', proxyWithOpts(`http://localhost:${upstreamPort}`, {}))

    setupDefaultErrorHandlers(proxyApp, false, proxyLogger as unknown as Logger)

    return testApp.initApp(proxyApp)()
  })

  afterEach(async () => {
    testApp.closeApp()
    await new Promise<void>(resolve => upstreamServer.close(() => resolve()))
  })

  test('client disconnect should not cause 500 error', async () => {
    const port = Number(testApp.getServerPrefix().split(':')[2])

    const req = http.request({ hostname: 'localhost', port, path: '/proxy/data' })
    req.on('error', () => {}) // Ignore client-side errors
    req.end()

    await requestReceived // 1. Wait for request to reach upstream
    req.destroy() // 2. Destroy client connection
    // Small delay to ensure connection closure propagates to proxy's response
    await new Promise(resolve => setTimeout(resolve, 10))
    signalCanRespond() // 3. Tell upstream to respond now (to destroyed connection)

    // Wait for error to be logged
    await errorLogged

    const has500Error = proxyErrors.some(e => e.status === 500)
    const has400Error = proxyErrors.some(e => e.status === 400)

    assert.equal(has500Error, false, 'Client disconnect should not cause 500 error')
    assert.equal(has400Error, true, 'Client disconnect should cause 400 error')
  })
})
