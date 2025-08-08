import * as crypto from 'crypto'
import * as stream from 'stream'
import { Readable } from 'stream'
import * as cryptoUtils from '../src'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { randomString } from '@digabi/testing'

const readStreamToBuffer = async (outputStream: Readable): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const bufs: Buffer[] = []
    outputStream.on('data', (d: Buffer) => bufs.push(d))
    outputStream.on('end', () => resolve(Buffer.concat(bufs)))
    outputStream.on('error', error => reject(error))
  })

const generateKeyPair = (): crypto.KeyPairSyncResult<string, string> =>
  crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  })

describe('crypto-test.js', () => {
  test('Generates key and iv', () => {
    const keys = cryptoUtils.generateKeyAndIv()
    assert.equal(keys.key.length, 32)
    assert.equal(keys.iv.length, 16)
  })

  test('Derives key and iv from password', () => {
    const keys1 = cryptoUtils.deriveAES256KeyAndIv('foobar123#')
    const keys2 = cryptoUtils.deriveAES256KeyAndIv('foobar123#')

    assert.equal(keys1.key.length, 32)
    assert.equal(keys1.iv.length, 16)
    assert.deepEqual(keys1, keys2)
  })

  test('Strips whitespace from password', () => {
    const keys1 = cryptoUtils.deriveAES256KeyAndIv('foo bar 123#')
    const keys2 = cryptoUtils.deriveAES256KeyAndIv('foobar123#')

    assert.deepEqual(keys1, keys2)
  })

  test('Crypts and decrypts with AES256', () => {
    const password = crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)
    return testAES256(password, password, iv, true)
  })

  test('Decrypting AES256 fails with invalid password', () => {
    const password = crypto.randomBytes(32)
    const wrongPassword = crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)
    return testAES256(password, wrongPassword, iv, false)
  })

  test('Crypts and decrypts with RSA', () => {
    const { privateKey, publicKey } = generateKeyPair()

    const plainText = randomString(100)
    const cipherText = cryptoUtils.encryptWithPublicKey(publicKey, plainText)
    const decrypted = cryptoUtils.decryptWithPrivateKey(privateKey, cipherText)
    assert.notEqual(cipherText, plainText)
    assert.equal(decrypted, plainText)
  })

  test('Fails to decrypt RSA with wrong private key', () => {
    const { publicKey } = generateKeyPair()
    const { privateKey } = generateKeyPair()

    const plainText = randomString(100)

    const cipherText = cryptoUtils.encryptWithPublicKey(publicKey, plainText)
    assert.throws(() => cryptoUtils.decryptWithPrivateKey(privateKey, cipherText))
  })

  test('Crypts and decrypts with RSA buffer functions', () => {
    const { privateKey, publicKey } = generateKeyPair()

    const keys = cryptoUtils.generateKeyAndIv()
    const encodedKeys = { key: keys.key.toString('base64'), iv: keys.iv.toString('base64') }
    const keysEncrypted = cryptoUtils.encryptWithPublicKeyBuffer(publicKey, JSON.stringify(encodedKeys))
    const decrypted = JSON.parse(cryptoUtils.decryptWithPrivateKeyFromBuffer(privateKey, keysEncrypted).toString()) as {
      key: string
      iv: string
    }
    assert.equal(encodedKeys.key, decrypted.key)
    assert.equal(encodedKeys.iv, decrypted.iv)
  })

  test('Crypts and decrypts with AES asynchronously', () => {
    const keys = cryptoUtils.generateKeyAndIv()
    const obj = { foo: 'bar' }
    const encryptedP = cryptoUtils.encryptAES256Async(Buffer.from(JSON.stringify(obj)), keys.key, keys.iv)

    const b = cryptoUtils.decryptAES256Async(encryptedP, keys.key, keys.iv)
    const decrypted = JSON.parse(b.toString()) as typeof obj
    assert.deepEqual(obj, decrypted)
    return
  })

  test('Signs streams and buffers correctly', async () => {
    const { privateKey, publicKey } = generateKeyPair()
    const rightData = randomString(500)
    const wrongData = randomString(500)

    const rightDataBuffer = Buffer.from(rightData)
    const wrongDataBuffer = Buffer.from(wrongData)

    const signature = await cryptoUtils.signWithSHA256AndRSA(rightDataBuffer, privateKey)
    const bufferRightResult = cryptoUtils.verifyWithSHA256AndRSA(
      rightDataBuffer,
      publicKey,
      signature.toString('utf-8')
    )
    assert.equal(bufferRightResult, true)
    const bufferWrongResult = cryptoUtils.verifyWithSHA256AndRSA(
      wrongDataBuffer,
      publicKey,
      signature.toString('utf-8')
    )
    assert.equal(bufferWrongResult, false)

    const rightDataStream = new stream.PassThrough()
    rightDataStream.end(rightDataBuffer)

    const wrongDataStream = new stream.PassThrough()
    wrongDataStream.end(rightDataBuffer)

    const signatureStreamed = await cryptoUtils.signWithSHA256AndRSA(rightDataStream, privateKey)

    const rightStreamResult = cryptoUtils.verifyWithSHA256AndRSA(
      rightDataBuffer,
      publicKey,
      signatureStreamed.toString('utf-8')
    )
    assert.equal(rightStreamResult, true)

    const wrongStreamResult = cryptoUtils.verifyWithSHA256AndRSA(
      wrongDataBuffer,
      publicKey,
      signatureStreamed.toString('utf-8')
    )
    assert.equal(wrongStreamResult, false)
  })

  async function testAES256(encryptPw: Buffer, decryptPw: Buffer, iv: Buffer, shouldSucceed: boolean) {
    const plainText = randomString(1000)

    const plainTextIn = new stream.PassThrough()
    plainTextIn.end(plainText)

    const plainTextOutStream = plainTextIn
      .pipe(cryptoUtils.createAES256EncryptStreamWithIv(encryptPw, iv))
      .pipe(cryptoUtils.createAES256DecryptStreamWithIv(decryptPw, iv))

    const plainTextBuffer = await readStreamToBuffer(plainTextOutStream)

    assert.equal(plainTextBuffer.toString('utf-8') === plainText, shouldSucceed)
  }
})
