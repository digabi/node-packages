import test, { after, before, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createLogger } from '../src'
import { Logform } from 'winston'
import { getBasicAuthUsername } from '../src/utils'
import { assertNextLogEvent, MyError } from './utils'

describe('logger', () => {
  describe('formats', () => {
    describe('timestamp', () => {
      test('should add timestamp to events', async () => {
        const logger = createLogger()
        logger.log('info', 'test')

        await assertNextLogEvent(logger, (info: Logform.TransformableInfo) => {
          assert.equal(info.message, 'test')
          assert.equal(info.timestamp !== undefined, true)
        })
      })
    })

    describe('trimMessage', () => {
      test('should trim logged messages', async () => {
        const logger = createLogger()
        logger.log('info', 'test.   ')

        await assertNextLogEvent(logger, (info: Logform.TransformableInfo) => {
          assert.equal(info.message, 'test.')
        })
      })
    })

    describe('combineMeta', () => {
      test('should combine multiple string arguments', async () => {
        const logger = createLogger()
        logger.log('info', 'test', 'test3')

        await assertNextLogEvent(logger, (info: Logform.TransformableInfo) => {
          assert.equal(info.message, 'test test3')
        })
      })

      test('should combine multiple metadata objects', async () => {
        const logger = createLogger()
        logger.log('info', 'test', { a: 1 }, { b: 3 })

        await assertNextLogEvent(logger, (info: Logform.TransformableInfo & { a: number; b: number }) => {
          assert.equal(info.a, 1)
          assert.equal(info.b, 3)
          assert.equal(info.message, 'test')
        })
      })
    })
  })

  describe('convertErrorToObject', () => {
    before(() => {
      process.env.YTL_AWS_STACK = 'true'
    })

    after(() => {
      process.env.YTL_AWS_STACK = undefined
    })

    test('should convert error to object', async () => {
      const logger = createLogger()

      logger.error('Error happened', { error: new MyError('Test error', 'someData') })

      await assertNextLogEvent(logger, (info: Logform.TransformableInfo & { error: MyError }) => {
        const actualMessage = info[Symbol.for('message')] as string

        assert.equal(info.message, 'Error happened')
        assert.equal(info.error.message, 'Test error')
        assert.equal(info.error.customField, 'someData')
        assert.equal(info.error.stack!.includes('Error: Test error\n'), true)
        assert.match(
          actualMessage,
          /{"error":{"customField":"someData","message":"Test error","stack":"Error: Test error\\n/
        )
      })
    })
  })
})
