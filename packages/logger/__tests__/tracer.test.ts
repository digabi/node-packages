import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { createLogger, requestLogger } from '../src'
import { getRequestId } from '../src/tracer'
import { testApp } from '@digabi/js-test-utils'

describe('tracer', () => {
  before(async () => {
    const app = express()
    const logger = createLogger()

    app.use(requestLogger(logger))

    app.get('/request-id', (req, res) => {
      const id = getRequestId()
      res.send(id)
    })

    await testApp.initApp(app)()
  })

  after(() => {
    testApp.closeApp()
  })

  test('should get requestId', async () => {
    const res = await fetch(`${testApp.getServerPrefix()}/request-id`)
    const id = await res.text()

    assert.equal(id !== undefined, true)
    assert.equal(id.length > 5, true)
  })

  test('should use given requestId', async () => {
    const res = await fetch(`${testApp.getServerPrefix()}/request-id`, {
      headers: {
        'X-Amzn-Trace-Id': 'test-123'
      }
    })
    const id = await res.text()
    assert.equal(id, 'test-123')
  })
})
