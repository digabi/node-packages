import _ from 'lodash'
import { MultiSamlStrategy, PassportSamlConfig, Profile, ValidateInResponseTo } from '@node-saml/passport-saml'
import { getId, getNames, ProfileNames } from './suomifi-profile'

type SessionStorage = {
  getSessionIdByNameId: (nameId: string) => Promise<string | null>
  deleteSession: (sessionId: string) => Promise<void>
}

export type SamlCredentials = {
  ssnFromSaml: string
} & ProfilePassThroughFields &
  ProfileNames

export const passThroughFields = ['nameID', 'nameIDFormat', 'nameQualifier', 'spNameQualifier', 'sessionIndex'] as const

export type GetSamlOptions = (req: any) => Partial<PassportSamlConfig>
type ProfilePassThroughFields = Pick<Profile, (typeof passThroughFields)[number]>

let samlStrategy: MultiSamlStrategy

function checkUserCredentialsFromSamlProfile(profile: Profile): SamlCredentials {
  return _.merge(
    { ssnFromSaml: getId(profile) },
    _.pick(profile, passThroughFields),
    getNames(profile)
  ) as SamlCredentials
}

export function initAndGetSamlStrategy(options: GetSamlOptions, sessionStorage: SessionStorage): MultiSamlStrategy {
  const commonOptions: Partial<PassportSamlConfig> = {
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    disableRequestedAuthnContext: true,
    signatureAlgorithm: 'sha256',
    skipRequestCompression: false,
    acceptedClockSkewMs: 1500,
    validateInResponseTo: ValidateInResponseTo.always,
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: true
  }

  samlStrategy = new MultiSamlStrategy(
    {
      passReqToCallback: true,
      getSamlOptions: (req, done) => done(null, { ...commonOptions, ...options(req) })
    },
    (_req, profile, done) => {
      const creds = checkUserCredentialsFromSamlProfile(profile!)
      done(null, creds)
    },
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req, profile, done) => {
      if (sessionStorage && profile) {
        const sessionId = await sessionStorage.getSessionIdByNameId(profile.nameID)
        if (sessionId) {
          // req.user might be undefined if cookie is for some reason missing but session exists
          if (!req.user) {
            await sessionStorage.deleteSession(sessionId)
          }
          return done(null, req.user as SamlCredentials)
        }
      } else {
        // Expect cookie to always exist
        if (profile && req.user && profile.nameID === (req.user as SamlCredentials).nameID) {
          return done(null, req.user as SamlCredentials)
        }
      }
      done(new Error(`User not found, profile: ${JSON.stringify(profile)}`))
    }
  )

  return getSamlStrategy()
}

export function getSamlStrategy() {
  if (!samlStrategy) {
    throw new Error('SAML strategy must be initialized!')
  }
  return samlStrategy
}
