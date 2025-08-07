import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { generatePassphraseAsync } from '../src'

const testWordList = Array.from({ length: 1000 }, (_, i) => `word${i}`)

describe('passphrase-generator', () => {
  test('should generate passphrases with four words by default', async () => {
    const passphrase = await generatePassphraseAsync(testWordList)

    assert.equal(passphrase.split(' ').length, 4)
    assert.match(passphrase, /\bword\d+\b \bword\d+\b \bword\d+\b \bword\d+\b/)
  })

  test('should generate passphrase with given count', async () => {
    const passphrase = await generatePassphraseAsync(testWordList, 6)

    assert.equal(passphrase.split(' ').length, 6)
    assert.match(passphrase, /\bword\d+\b \bword\d+\b \bword\d+\b \bword\d+\b \bword\d+\b \bword\d+\b/)
  })

  test('should generate different passphrases on each invocation', async () => {
    const passphrase = await generatePassphraseAsync(testWordList)
    const passphrase2 = await generatePassphraseAsync(testWordList)

    assert.notEqual(passphrase, passphrase2)
  })
})
