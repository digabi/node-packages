import { Profile } from '@node-saml/passport-saml'
import _ from 'lodash'

const NATIONAL_IDENTIFICATION_NUMBER_OID = 'urn:oid:1.2.246.21'
const ELECTRONIC_IDENTIFICATION_NUMBER_OID = 'urn:oid:1.2.246.22'
const COMMON_NAME_OID = 'urn:oid:2.5.4.3'
const LAST_NAME_OID = 'urn:oid:2.5.4.4'
const FIRST_NAME_ID = 'http://eidas.europa.eu/attributes/naturalperson/CurrentGivenName'

type SuomiFiProfile = Profile & {
  [NATIONAL_IDENTIFICATION_NUMBER_OID]?: string
  [ELECTRONIC_IDENTIFICATION_NUMBER_OID]?: string
  [COMMON_NAME_OID]?: string
  [LAST_NAME_OID]?: string
  [FIRST_NAME_ID]?: string
}

export type ProfileNames = {
  displayName: string
  firstName: string
  lastName: string
}

export function getNames(profile: SuomiFiProfile): ProfileNames {
  const fullName = profile[COMMON_NAME_OID]
  const lastName = profile[LAST_NAME_OID]
  const firstName = profile[FIRST_NAME_ID]

  if (firstName && lastName) {
    return {
      displayName: fullName || '-',
      firstName,
      lastName
    }
  } else if (fullName) {
    return {
      displayName: fullName || '-',
      firstName: _.tail(fullName.split(' ')).join(' ') || '-',
      lastName: fullName.split(' ')[0] || '-'
    }
  } else {
    return {
      displayName: '-',
      firstName: '-',
      lastName: '-'
    }
  }
}

export function getId(profile: SuomiFiProfile) {
  if (profile[NATIONAL_IDENTIFICATION_NUMBER_OID]) {
    return profile[NATIONAL_IDENTIFICATION_NUMBER_OID]
  }

  if (profile[ELECTRONIC_IDENTIFICATION_NUMBER_OID]) {
    return profile[ELECTRONIC_IDENTIFICATION_NUMBER_OID]
  }

  return '-'
}
