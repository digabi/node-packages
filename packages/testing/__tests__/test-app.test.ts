import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import { testApp } from '../src'

describe('test-app', () => {
  before(async () => {
    const app = express()

    app.get('/my-endpoint', (req, res) => {
      res.send('test')
    })

    await testApp.initApp(app)()
  })

  after(() => {
    testApp.closeApp()
  })

  test('should spawn server and do request', async () => {
    const res = await fetch(`${testApp.getServerPrefix()}/my-endpoint`)
    const data = await res.text()

    assert.equal(data, 'test')
  })
})
