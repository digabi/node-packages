import { testApp } from '@digabi/testing'
import express from 'express'
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import * as requestWrappers from '../src'

/**
 * Regression test for https://github.com/nodejs/node/issues/63574: passing a
 * Blob/FormData body to fetch() permanently leaks its backing buffer on
 * affected Node versions (confirmed on 24.17.0, not yet fixed upstream in any
 * released 24.x/26.x). postFormAsync must never route large file uploads
 * through that code path again.
 */
describe('postFormAsync memory usage', () => {
  const memoryTestApp = testApp.testAppContext()

  before(() => {
    const app = express()

    app.post('/upload', (req, res) => {
      req.resume()
      req.on('end', () => res.status(201).json({ ok: true }))
    })

    return memoryTestApp.initApp(app)()
  })

  after(memoryTestApp.closeApp)

  test(
    'does not leak memory across many large file uploads',
    { skip: !global.gc && 'run with --expose-gc for a meaningful assertion' },
    async () => {
      const PAYLOAD_MB = 5
      const WARMUP_ITERATIONS = 5
      const ITERATIONS = 30
      const payload = Buffer.alloc(PAYLOAD_MB * 1024 * 1024)

      async function upload() {
        await requestWrappers.postFormAsync(`${memoryTestApp.getServerPrefix()}/upload`, {
          examZip: { value: payload, options: { filename: 'exam.zip', contentType: 'application/octet-stream' } },
          userId: 'test-user'
        })
      }

      function arrayBuffersAfterGc() {
        global.gc?.()
        return process.memoryUsage().arrayBuffers
      }

      for (let i = 0; i < WARMUP_ITERATIONS; i++) await upload()
      const baseline = arrayBuffersAfterGc()

      for (let i = 0; i < ITERATIONS; i++) await upload()
      const afterMany = arrayBuffersAfterGc()

      const growthMB = (afterMany - baseline) / 1024 / 1024

      assert.ok(
        growthMB < PAYLOAD_MB * 2,
        `arrayBuffers grew by ${growthMB.toFixed(1)}MB over ${ITERATIONS} uploads after a ${WARMUP_ITERATIONS}-iteration ` +
          `warmup (baseline ${(baseline / 1024 / 1024).toFixed(1)}MB) - expected it to stay roughly flat. ` +
          `See https://github.com/nodejs/node/issues/63574.`
      )
    }
  )
})
