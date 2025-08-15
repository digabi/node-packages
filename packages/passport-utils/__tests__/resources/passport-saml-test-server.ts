import express, { Express } from 'express'
import bodyParser from 'body-parser'
import { createSamlMockRouter, getSamlMockCertificates, SamlMockOverrides } from '@digabi/saml-mock'
import { TestCacheProvider } from './test-cache-provider'
import { GetSamlOptions, initAndGetSamlStrategy, SamlCredentials } from '../../src'
import type { Server } from 'node:http'

export const SAML_MOCK_PORT = 54068

const samlUser = {
  ssn: '010170-999R',
  firstname: 'Reino',
  lastname: 'Rehtori'
}

async function passportSetup(
  app: Express,
  port: number,
  samlOverrides: Partial<SamlMockOverrides & { audience: string }>
) {
  /** Passport has some internal state that has to be cleared between test runs */
  delete require.cache[require.resolve('passport')]
  const passport = (await import('passport')).default

  const testCacheProvider = new TestCacheProvider()
  const getUser = () => new Promise(resolve => resolve(samlUser))
  const mockSessionStorage = {
    getSessionIdByNameId: () => Promise.resolve('test'),
    deleteSession: () => Promise.resolve()
  }

  const samlMockOptions = { audience: 'passport-saml-test' }
  const samlMockRouter = createSamlMockRouter(`http://localhost:${port}/saml/acs`, getUser, samlMockOptions)

  let entryPoint = `http://localhost:${port}/saml/`
  if (samlOverrides.invalidateInResponseTo) {
    entryPoint += '?invalidateInResponseTo=true'
  } else if (samlOverrides.invalidateAssertionSignature) {
    entryPoint += '?invalidateAssertionSignature=true'
  } else if (samlOverrides.skipAssertionEncryption) {
    entryPoint += '?skipAssertionEncryption=true'
  } else if (samlOverrides.invalidateTopLevelSignature) {
    entryPoint += '?invalidateTopLevelSignature=true'
  } else if (samlOverrides.skipTopLevelSignature) {
    entryPoint += '?skipTopLevelSignature=true'
  } else if (samlOverrides.skipAssertionSignature) {
    entryPoint += '?skipAssertionSignature=true'
  }

  const { privateKey, certificate } = getSamlMockCertificates()

  const samlStrategyOptions: GetSamlOptions = req => {
    // samlStrategyOptions function contains req parameter, but not using it in tests
    if (!req) throw new Error('Request parameter not found in options function')

    return {
      callbackUrl: `http://localhost:${port}/saml/acs`,
      entryPoint,
      logoutUrl: `http://localhost:${port}/saml/logout`,
      audience: samlOverrides.audience || samlMockOptions.audience,
      issuer: 'saml-issuer',
      privateKey,
      decryptionPvk: privateKey,
      idpCert: certificate,
      cacheProvider: testCacheProvider
    }
  }

  const strategy = initAndGetSamlStrategy(samlStrategyOptions, mockSessionStorage)
  passport.use(strategy)

  passport.serializeUser((user, done) => {
    done(null, { ...user, id: (user as SamlCredentials).ssnFromSaml, hetu: (user as SamlCredentials).ssnFromSaml })
  })

  passport.deserializeUser((user: SamlCredentials, done) => {
    done(null, { ...user, id: user.ssnFromSaml, hetu: user.ssnFromSaml })
  })

  app.use('/saml', samlMockRouter)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  app.get('/login', passport.authenticate('saml'), (_req, _res, next) => next)
  app.post('/saml/acs', (req, res, next) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    passport.authenticate('saml', (err: Error, user: Express.User) => {
      if (err) {
        return res.status(401).send(err.message)
      }
      req.logIn(user, { session: true }, () => res.sendStatus(200))
    })(req, res, next)
  })

  app.use('/*splat', (_req, res) => res.sendStatus(404))
}

export function closeServer(server: Server) {
  return new Promise((resolve, reject) => {
    server.close(err => {
      if (err) {
        reject(err)
      }

      resolve(true)
    })
  })
}

export async function createSamlTestServer(
  samlOverrides: Partial<SamlMockOverrides & { audience: string }> = {}
): Promise<Server> {
  const app = express()

  app.use(bodyParser.urlencoded({ limit: 20 * 1024 * 1024, extended: true }))
  await passportSetup(app, SAML_MOCK_PORT, samlOverrides)

  return new Promise(resolve => {
    const server = app.listen(SAML_MOCK_PORT, err => {
      resolve(server)
    })
  })
}
