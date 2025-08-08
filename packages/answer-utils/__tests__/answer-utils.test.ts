import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { screenshotImageRegexp, containsInvalidImgTags, sanitizeAnswerContent } from '../src'

const invalidUrls = [
  `/../screenshot/${crypto.randomUUID()}`,
  '/../math.svg?latex=x^2',
  `/screenshot/abc`,
  'https://math-demo.abitti.fi/math.svg'
]
const validUrls = ['/math.svg?latex=x^2', `/screenshot/${crypto.randomUUID()}`]

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
    for (const invalidUrl of invalidUrls) {
      const img = `<img src="${invalidUrl}">`
      assert.equal(containsInvalidImgTags(img), true, `Should be invalid: ${img}`)
    }

    for (const validUrl of validUrls) {
      const img = `<img src="${validUrl}">`
      assert.equal(containsInvalidImgTags(img), false, `Should be valid: ${img}`)
    }
  })
})
