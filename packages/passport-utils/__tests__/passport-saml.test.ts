import { test, describe, before, after, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { closeServer, createSamlTestServer, SAML_MOCK_PORT } from './resources/passport-saml-test-server'
import { FetchWithCookies } from './resources/fetch-with-cookies'
import { Server } from 'node:http'

async function samlLogin(customSamlResponse?: string) {
  const url = `http://localhost:${SAML_MOCK_PORT}`
  const fetchWithCookies = new FetchWithCookies()

  const loginRequest = await fetchWithCookies.fetch(`${url}/login`, { redirect: 'manual' })
  const redirectUrl = loginRequest.headers.get('location')!

  const samlResponseRequest = await fetchWithCookies.fetch(redirectUrl)
  const samlResponsePage = await samlResponseRequest.text()

  const start = '<span id="samlResponse">'
  const end = '</span>'
  const samlResponse = samlResponsePage.substring(
    samlResponsePage.indexOf(start) + start.length,
    samlResponsePage.indexOf(end)
  )

  const callbackStart = '<form id="login" action="'
  const callbackEnd = '" method="post">'

  const samlCallbackUrl = samlResponsePage.substring(
    samlResponsePage.indexOf(callbackStart) + callbackStart.length,
    samlResponsePage.indexOf(callbackEnd)
  )

  const formData = new URLSearchParams()
  formData.append('SAMLResponse', customSamlResponse || samlResponse)

  const samlAcsResponse = await fetchWithCookies.fetch(samlCallbackUrl, {
    method: 'POST',
    body: formData,
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })

  return samlAcsResponse
}

describe('passport-utils', () => {
  describe('Login', () => {
    let server: Server

    before(async () => {
      server = await createSamlTestServer()
    })

    after(async () => {
      await closeServer(server)
    })

    test('should log in', async () => {
      const loginResponse = await samlLogin()
      assert.equal(loginResponse.status, 200)
    })

    test('should fail, if saml response is invalid', async () => {
      const loginResponse = await samlLogin('invalid saml response')
      assert.equal(loginResponse.status, 401)
      const responseText = await loginResponse.text()
      assert.equal(responseText, 'Not a valid XML document')
    })
  })

  describe('Hardenings', () => {
    let server: Server

    afterEach(async () => {
      await closeServer(server)
    })

    test('should fail with mismatching audience', async () => {
      server = await createSamlTestServer({ audience: 'invalid audience' })
      const loginResponse = await samlLogin()
      assert.equal(loginResponse.status, 401)
      const responseText = await loginResponse.text()
      assert.equal(
        responseText,
        'SAML assertion audience mismatch. Expected: invalid audience Received: passport-saml-test'
      )
    })

    test('should fail with mismatching inResponseTo', async () => {
      server = await createSamlTestServer({ invalidateInResponseTo: true })

      const loginResponse = await samlLogin()
      assert.equal(loginResponse.status, 401)
      const responseText = await loginResponse.text()
      assert.equal(responseText, 'InResponseTo is not valid')
    })

    test('should fail if assertion signature is missing ', async () => {
      server = await createSamlTestServer({ skipAssertionSignature: true })

      const loginResponse = await samlLogin()
      assert.equal(loginResponse.status, 401)
      const responseText = await loginResponse.text()
      assert.equal(responseText, 'Invalid signature from encrypted assertion')
    })

    test('should fail if assertion signature is not valid', async () => {
      server = await createSamlTestServer({ invalidateAssertionSignature: true })

      const loginResponse = await samlLogin()
      assert.equal(loginResponse.status, 401)
      const responseText = await loginResponse.text()
      assert.equal(responseText, 'Invalid signature from encrypted assertion')
    })

    // This fails with suomi.fi library, but not with upstream.
    // According to https://github.com/vrk-kpa/suomifi-passport-saml?tab=readme-ov-file#---status-of-this-fork---
    // This enforcement should be done with wantAssertionsSigned and by passing decryptionPvk
    test.skip('should fail if assertion is not encrypted', async () => {
      server = await createSamlTestServer({ skipAssertionEncryption: true })
      const loginResponse = await samlLogin()
      assert.equal(loginResponse.status, 401)
      const responseText = await loginResponse.text()
      assert.equal(responseText, 'Unencrypted assertion(s) are not allowed')
    })

    test('should fail if top level signature is missing', async () => {
      server = await createSamlTestServer({ skipTopLevelSignature: true })

      const loginResponse = await samlLogin()
      assert.equal(loginResponse.status, 401)
      const responseText = await loginResponse.text()
      assert.equal(responseText, 'Invalid document signature')
    })

    test('should fail if top level signature is invalid', async () => {
      server = await createSamlTestServer({ invalidateTopLevelSignature: true })

      const loginResponse = await samlLogin()
      assert.equal(loginResponse.status, 401)
      const responseText = await loginResponse.text()
      assert.equal(responseText, 'Invalid document signature')
    })
  })
})
