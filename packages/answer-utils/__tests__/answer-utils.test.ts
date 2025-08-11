import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { screenshotImageRegexp, containsInvalidImgTags, sanitizeAnswerContent } from '../src'
import winston from 'winston'
import { Writable } from 'node:stream'

describe('answer-utils', () => {
  test('has exported screenshotImageRegexp variable', () => {
    assert.notStrictEqual(
      screenshotImageRegexp,
      /img src="\/screenshot\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi
    )
  })

  test('answer content can be sanitized', () => {
    assert.equal(
      sanitizeAnswerContent(
        '<unknown>foo</unknown> <p>foo</p><div foo="bar"><img foo="bar" src="x" alt="y"><br><span>text</span>'
      ),
      'foo foo<div><img src="x" alt="y" /><br />text</div>'
    )
  })

  test('detect invalid image sources', () => {
    const invalidUrls = [
      `/../screenshot/${crypto.randomUUID()}`,
      '/../math.svg?latex=x^2',
      `/screenshot/abc`,
      'https://math-demo.abitti.fi/math.svg'
    ]
    const validUrls = ['/math.svg?latex=x^2', `/screenshot/${crypto.randomUUID()}`]
    let logOutput = ''

    const stream = new Writable({
      write(chunk: string, _encoding, callback) {
        logOutput += chunk
        callback()
      }
    })

    const logger = winston.createLogger({
      transports: [new winston.transports.Stream({ stream })],
      handleExceptions: true
    })

    for (const invalidUrl of invalidUrls) {
      logOutput = ''
      const img = `<img src="${invalidUrl}">`
      assert.equal(containsInvalidImgTags(img, logger), true, `Should be invalid: ${img}`)
      assert.match(logOutput, /"level":"warn"/)
      assert.match(logOutput, /Following image tags are invalid:/)
      assert.equal(logOutput.includes(invalidUrl), true)
    }

    logOutput = ''
    for (const validUrl of validUrls) {
      const img = `<img src="${validUrl}">`
      assert.equal(containsInvalidImgTags(img, logger), false, `Should be valid: ${img}`)
    }
    assert.equal(logOutput, '')
  })
})
