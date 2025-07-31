import { testApp } from '@digabi/testing'
import express from 'express'
import * as requestWrappers from '../src'
import bodyParser from 'body-parser'
import multer from 'multer'
import { loadSomeFileToBuffer } from './utils'
import { CookieJar } from 'tough-cookie'
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { fileUploadMiddleware, respondWithZip, setupDefaultErrorHandlers, DataError } from '@digabi/express'

interface Test {
  value: number
}

describe('fetch-wrappers-test', () => {
  let request: express.Request

  before(() => {
    const app = express()
    const upload = multer()

    app.use(bodyParser.json({ limit: 20 * 1024 * 1024 }))
    app.use(express.urlencoded({ extended: true }))

    app.use((req, res, next) => {
      request = req
      next()
    })

    app.get('/', (req, res) => {
      res.json({ ok: 'ok' })
    })

    app.get('/empty', (req, res) => {
      res.status(204).end()
    })

    app.head('/', (req, res) => {
      res.json({ ok: 'ok' })
    })

    app.post('/form', upload.none(), (req, res) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      res.json({ got: req.body })
    })

    app.use('/json', (req, res) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      res.json({ got: req.body })
    })

    app.post('/text', (req, res) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      res.send('Some text')
    })

    app.post('/error', (req, res) => {
      throw new DataError(`student did error`, 409, 'screenshotLimitReached')
    })

    app.get('/file', (req, res) => {
      const { buffer } = loadSomeFileToBuffer()

      return respondWithZip(res, 'test.zip', buffer)
    })

    app.post('/file', fileUploadMiddleware('screenshot', 4 * 1024 * 1024, 501, 'file too big'), (req, res) => {
      res.send('File uploaded')
    })

    app.post('/login', (req, res) => {
      res.cookie('token', 'test-123', {
        httpOnly: false,
        secure: false,
        maxAge: 3600000 * 24,
        sameSite: 'strict'
      })

      res.sendStatus(200)
    })

    //@ts-expect-error logger type
    setupDefaultErrorHandlers(app, true, console)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return testApp.initApp(app)()
  })

  after(testApp.closeApp)

  describe('Query string', () => {
    test('should ignore undefined', async () => {
      const qs = { prop1: 'test', prop2: undefined }

      await requestWrappers.postJsonAsync(
        `${testApp.getServerPrefix()}/json`,
        {},
        {
          qs
        }
      )

      assert.equal(request.originalUrl, '/json?prop1=test')
    })

    test('should set query string', async () => {
      const qs = { prop1: 'test', prop2: true, prop3: 1, prop4: false }

      await requestWrappers.postJsonAsync(
        `${testApp.getServerPrefix()}/json`,
        {},
        {
          qs
        }
      )

      assert.equal(request.query.prop1, 'test')
      assert.equal(request.query.prop2, 'true')
      assert.equal(request.query.prop3, '1')
      assert.equal(request.query.prop4, 'false')

      assert.equal(request.originalUrl, '/json?prop1=test&prop2=true&prop3=1&prop4=false')
    })
  })

  describe('Basic authentication', () => {
    test('should set basic authentication headers if auth is present in options', async () => {
      const content = { original: 'body object' }

      await requestWrappers.postJsonAsync(`${testApp.getServerPrefix()}/json`, content, {
        auth: { username: 'test', password: 'password' }
      })

      assert.equal(request.headers.authorization, 'Basic dGVzdDpwYXNzd29yZA==')
    })
  })

  describe('cookieJar', () => {
    test('should persist cookie if jar is set to true', async () => {
      const content = { original: 'body object' }

      await requestWrappers.postJsonAsync(`${testApp.getServerPrefix()}/login`, content, { jar: true })
      await requestWrappers.getJsonAsync(`${testApp.getServerPrefix()}/`, { jar: true })

      assert.equal(request.headers.cookie, 'token=test-123')
    })

    test('should be able to provide external cookie jar', async () => {
      const cookieJar = new CookieJar()
      await requestWrappers.postJsonAsync(`${testApp.getServerPrefix()}/login`, {}, { jar: cookieJar })
      await requestWrappers.getJsonAsync(`${testApp.getServerPrefix()}/`, { jar: cookieJar })
      assert.equal(request.headers.cookie, 'token=test-123')

      const cookieJar2 = new CookieJar()
      await requestWrappers.getJsonAsync(`${testApp.getServerPrefix()}/`, { jar: cookieJar2 })
      assert.equal(request.headers.cookie, '')
    })
  })

  describe('postJsonAsync', () => {
    const interfaceTestContent: Test = { value: 1 }

    const requestBodyTypes = [
      { content: { a: 1 } },
      { content: [{ a: 1 }] },
      { content: [1] },
      { content: ['test'] },
      { content: interfaceTestContent }
    ]

    requestBodyTypes.map(({ content }) =>
      test(`should allow request body to be ${JSON.stringify(content)}`, async () => {
        const url = `${testApp.getServerPrefix()}/json`

        const response = await requestWrappers.postJsonAsync(url, content)
        assert.deepEqual(response, { got: content })
      })
    )

    test('should post the content and receives the response', async () => {
      const content = { original: 'body object' }
      const response = await requestWrappers.postJsonAsync<{ got: { original: string } }>(
        `${testApp.getServerPrefix()}/json`,
        content
      )

      assert.deepEqual(request.body, content)
      assert.equal(request.headers['content-type'], 'application/json')
      assert.deepEqual(response, { got: content })
    })

    test('should return Response object if fullResponse true', async () => {
      const response = await requestWrappers.postJsonAsync(`${testApp.getServerPrefix()}/json`, {}, {}, true)
      assert.equal(response instanceof Response, true)
    })

    test('should allow overriding the url from options', async () => {
      const content = { original: 'body object' }
      const res = await requestWrappers.postJsonAsync('unused url', content, {
        url: `${testApp.getServerPrefix()}/json`
      })

      assert.deepEqual(request.body, content)
      assert.equal(request.headers['content-type'], 'application/json')
      assert.deepEqual(res, { got: content })
    })

    test('should handle response not being valid json', async () => {
      const response = await requestWrappers.postJsonAsync(`${testApp.getServerPrefix()}/text`)
      assert.equal(response, 'Some text')
    })

    test('should be able to access DataError', async () => {
      const expectedStatusCode = 409
      const expectedErrorType = 'screenshotLimitReached'

      try {
        await requestWrappers.postJsonAsync(`${testApp.getServerPrefix()}/error`)
      } catch (error: any) {
        // eslint-disable-next-line
        const { status, errorType } = error.body.error

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        assert.equal(error.statusCode, expectedStatusCode)
        assert.equal(status, expectedStatusCode)
        assert.equal(errorType, expectedErrorType)
      }
    })

    test('should add headers to request', async () => {
      await requestWrappers.postJsonAsync(
        `${testApp.getServerPrefix()}/json`,
        {},
        { headers: { 'some-header': 'test' } }
      )

      assert.equal(request.headers['some-header'], 'test')
    })
  })

  describe('postFormAsync', () => {
    test('should post formData in legacy format and receives the response', async () => {
      const { buffer, filename } = loadSomeFileToBuffer()

      const formData = {
        screenshot: {
          value: buffer,
          options: {
            filename,
            contentType: 'image/png'
          }
        },
        id: 1
      }

      const response = await requestWrappers.postFormAsync(`${testApp.getServerPrefix()}/file`, formData)

      assert.equal(request.file?.size, 10344)
      // eslint-disable-next-line
      assert.equal(request.body.id, '1')
      assert.equal(response, 'File uploaded')
    })

    test('should post formData and receives the response', async () => {
      const formData = new FormData()
      formData.append('original', 'test')

      const response = await requestWrappers.postFormAsync<{ got: { original: string } }>(
        `${testApp.getServerPrefix()}/form`,
        formData
      )

      assert.deepStrictEqual({ ...request.body }, { original: 'test' })
      assert.equal(request.headers['content-type']?.split(';')[0], 'multipart/form-data')
      assert.deepStrictEqual(response, { got: { original: 'test' } })
    })

    test('should post file', async () => {
      const formData = new FormData()
      const { buffer, filename } = loadSomeFileToBuffer()
      formData.append('screenshot', new Blob([buffer], { type: 'image/png' }), filename)
      formData.append('id', 1)

      const response = await requestWrappers.postFormAsync(`${testApp.getServerPrefix()}/file`, formData)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      assert.equal(request.body.id, '1')
      assert.equal(request.file?.size, 10344)
      assert.equal(response, 'File uploaded')
    })

    test('should receive Response object when posting with fullResponse true', async () => {
      const formData = new FormData()
      formData.append('original', 'test')

      const response = await requestWrappers.postFormAsync(`${testApp.getServerPrefix()}/form`, formData, {}, true)

      assert.equal(response instanceof Response, true)
    })
  })

  describe('postUrlEncodedFormAsync', () => {
    test('should post object encoded in url', async () => {
      const data = {
        original: 'test'
      }

      const response = await requestWrappers.postUrlEncodedFormAsync<{ got: { original: string } }>(
        `${testApp.getServerPrefix()}/json`,
        data
      )

      assert.deepEqual(request.body, { original: 'test' })
      assert.equal(request.headers['content-type'], 'application/x-www-form-urlencoded;charset=UTF-8')
      assert.deepEqual(response, { got: { original: 'test' } })
    })

    test('should get Response object when fullResponse true', async () => {
      const data = {
        original: 'test'
      }

      const response = await requestWrappers.postUrlEncodedFormAsync(
        `${testApp.getServerPrefix()}/json`,
        data,
        {},
        true
      )

      assert.equal(response instanceof Response, true)
    })
  })

  describe('getJsonAsync', () => {
    test('should receive the response', async () => {
      const response = await requestWrappers.getJsonAsync<{ ok: string }>(testApp.getServerPrefix())
      assert.deepEqual({ ok: 'ok' }, response)
    })

    test('should return undefined when response has no body', async () => {
      const response = await requestWrappers.getJsonAsync<undefined>(`${testApp.getServerPrefix()}/empty`)
      assert.equal(undefined, response)
    })

    test('should throw if endpoints returns 404', () =>
      assert.rejects(requestWrappers.getJsonAsync(`${testApp.getServerPrefix()}/404`)))

    test('should return Response object if fullResponse true', async () => {
      const response = await requestWrappers.getJsonAsync(`${testApp.getServerPrefix()}`, {}, true)
      assert.equal(response instanceof Response, true)
    })
  })

  describe('headAsync', () => {
    test('should make head request', async () => {
      const res = await requestWrappers.headAsync(testApp.getServerPrefix())
      assert.equal(200, res.status)
    })
  })

  describe('getBinaryAsync', () => {
    test('should get file as buffer', async () => {
      const res = await requestWrappers.getBinaryAsync(`${testApp.getServerPrefix()}/file`)
      assert.equal(res instanceof Buffer, true)
    })

    test('should get Response if fullResponse is true', async () => {
      const response = await requestWrappers.getBinaryAsync(testApp.getServerPrefix(), {}, true)
      assert.equal(response instanceof Response, true)
    })
  })

  describe('getBinaryResponseAsync', () => {
    test('should get Response by default', async () => {
      const response = await requestWrappers.getBinaryResponseAsync(testApp.getServerPrefix())
      assert.equal(response instanceof Response, true)
    })
  })

  describe('putJsonAsync', () => {
    test('should put json', async () => {
      const data = {
        original: 'test'
      }

      const response = await requestWrappers.putJsonAsync<{ got: { original: string } }>(
        `${testApp.getServerPrefix()}/json`,
        data
      )

      assert.deepEqual(request.body, data)
      assert.deepEqual(response, { got: data })
    })

    test('should return Response object when fullResponse is true', async () => {
      const data = {
        original: 'test'
      }

      const response = await requestWrappers.putJsonAsync<{ got: { original: string } }>(
        `${testApp.getServerPrefix()}/json`,
        data,
        {},
        true
      )

      assert.equal(response instanceof Response, true)
    })
  })

  describe('deleteJsonAsync', () => {
    test('should do delete request', async () => {
      const data = {
        original: 'test'
      }

      const response = await requestWrappers.deleteJsonAsync<{ got: { original: string } }>(
        `${testApp.getServerPrefix()}/json`,
        data
      )

      assert.deepEqual(request.body, data)
      assert.deepEqual(response, { got: data })
    })

    test('should return Response object if fullResponse is true', async () => {
      const data = {
        original: 'test'
      }

      const response = await requestWrappers.deleteJsonAsync<{ got: { original: string } }>(
        `${testApp.getServerPrefix()}/json`,
        data,
        {},
        true
      )

      assert.equal(response instanceof Response, true)
    })
  })
})
