import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { createLogger, requestLogger } from '../src'
import { testApp } from '@digabi/testing'
import { assertNextLogEvent } from './utils'
import { Logform } from 'winston'

describe('request-logger', () => {
  const logger = createLogger()

  before(async () => {
    const app = express()

    app.use(requestLogger(logger, { getRemoteUser: () => 'remote-user' }))

    app.get('/my-endpoint', (req, res) => {
      res.send('test')
    })

    await testApp.initApp(app)()
  })

  after(() => {
    testApp.closeApp()
  })

  test('should log request info', async () => {
    fetch(`${testApp.getServerPrefix()}/my-endpoint`)

    await assertNextLogEvent(logger, (info: Logform.TransformableInfo) => {
      assert.equal(info.message, 'Request finished')
      assert.equal(info.method, 'GET')
      assert.equal(info.url, '/my-endpoint')
      assert.equal(info.contentLength, 4)
      assert.equal(info.remoteAddress, '::1')
      assert.equal(info.remoteUser, 'remote-user')
      assert.equal((info.responseTime as number) > 0, true)
      assert.equal(info.route, '/my-endpoint')
      assert.equal(info.statusCode, 200)
    })
  })
})
