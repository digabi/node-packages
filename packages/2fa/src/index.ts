import * as crypto from 'crypto'
import encodeQR from 'qr'
import { toBase32, toBuffer } from './base32'

// NOTE:
// Do not change these parameters if you're not sure what you're doing!
// In testing, many authenticators silently fail if nonstandard settings
// for e.g. the algorithm are used, even if the settings are included
// in the activation URL/QR-code.

/** Algorithm to use with `crypto.createHmac` */
const ALGO = 'sha1' // ATTOW MS-Authenticator is SHA1 only (tested on iOS)

/** How many bytes should the shared secret keys contain */
const KEY_SIZE = 20 // 20 Bytes is 160 bits is 32 chars in base32

/** How often a new TOTP is generated in seconds */
const PERIOD_SECS = 30n

/**
 * Returns the TOTP for a given date or `null` if the key is invalid.
 *
 * **NB**:
 * You probably want to use `check` instead!
 * This function is exported mainly for tests only!
 *
 * @param key - The base 32 encoded shared secret key.
 * @param delta - Offset of the time window: set to e.g. `-1` to get the previous TOTP, `+1` for the next etc.
 * @param date - Date object to anchor generation to, defaults to current current time.
 */
export function get(key: Uint8Array, delta = 0, date?: Date) {
  if (typeof key === 'string')
    throw Error(
      'Passed a string as a key for TOTP generation.' +
        ' This makes the generation fail in subtle ways as the key should be a typed byte array.' +
        ' This function is not meant for end use; did you mean to use `check` instead?'
    )

  const d = BigInt(delta)
  const t = BigInt(date?.getTime() ?? Date.now())

  const hmac = crypto.createHmac(ALGO, key)
  const time = new DataView(new ArrayBuffer(8), 0, 8)

  time.setBigUint64(0, d + BigInt(t) / (1000n * PERIOD_SECS), false)
  hmac.update(time)

  const hash = hmac.digest()
  const i = hash[hash.length - 1] & 0x0f
  const t0 = (hash[i + 0] & 0x7f) << 0x18
  const t1 = (hash[i + 1] & 0xff) << 0x10
  const t2 = (hash[i + 2] & 0xff) << 0x08
  const t3 = (hash[i + 3] & 0xff) << 0x00
  const totp = t0 | t1 | t2 | t3

  return (totp % 1_000_000).toString(10).padStart(6, '0')
}

export type TotpResult =
  /** The checked TOTP was correct */
  | { ok: true }
  /** The checked TOTP was incorrect */
  | { ok: false; reason: 'WRONG_TOTP' }
  /** The given TOTP was in the list of already used TOTPs */
  | { ok: false; reason: 'SPENT_TOTP' }
  /** The given TOTP was not a string of six digits */
  | { ok: false; reason: 'MALFORMED_TOTP' }
  /** The key could not be decoded */
  | { ok: false; reason: 'MALFORMED_KEY' }

/**
 * Check whether the given TOTP is valid for the key at call time.
 * Accepts the current TOTP and the one from the previous period.
 *
 * **NB**:
 * The last parameter for a date should not be used in applications!
 * It is available only for use in automated testing!
 *
 * **NB**:
 * The caller is responsible for resisting TOTP-reuse!
 * This means that you should save the _last two successfully used TOTPs_
 * and refuse to accept them again. In practice, when you successfully
 * log a user in, you should save the used TOTP in a database (shared
 * across application instances) and disallow using that TOTP and the
 * previous successful one in the next log in attempt.
 *
 * @param key - The base 32 encoded shared secret key.
 * @param totp - The TOTP to check.
 * @param spentTotps - List of used TOTPs to refuse. Should include the latest and the one before that _successfully used_ TOTPs.
 */
export function check(key: string, totp: string, spentTotps: string[], date?: Date): TotpResult {
  if (spentTotps.length < 2)
    throw Error(
      'Tried to check TOTP without excluding the two last successfully used TOTPs.' +
        ' This is dangerous as it subverts the "one-time" part of the OTP system.' +
        ' Please pass in at least two passwords to exclude from the check.'
    )

  const k = toBuffer(key)

  if (k === null) return { ok: false, reason: 'MALFORMED_KEY' }
  if (!/^\d{6}$/.test(totp)) return { ok: false, reason: 'MALFORMED_TOTP' }
  if (spentTotps.includes(totp)) return { ok: false, reason: 'SPENT_TOTP' }

  const curr = get(k, +0, date)
  const prev = get(k, -1, date)

  return totp === curr || totp === prev
    ? { ok: true } // prettier-ignore
    : { ok: false, reason: 'WRONG_TOTP' }
}

/** Returns a new TOTP shared secret key. */
export function genKey() {
  const key = crypto.randomBytes(KEY_SIZE)
  const enc = toBase32(key)
  return enc
}

/**
 * Returns an `otpauth` URL for the given key along with a QR code as a
 * data URL. This can then be shown in an `<img />` tag as the value of
 * its `src` attribute.
 *
 * The `issuer` field should be both machine and human-friendly; use e.g.
 * "YTL-rekisteri" instead of "YTL:n rekisteri". MS Authenticator seems to
 * swap spaces for pluses here at least, along with other weirdness.
 *
 * The label should most probably be the user account name; spaces apparently
 * render correctly here, so labels like "Mikko Mallikas", "mmallikas", and
 * "mikko@example.com" are all ok.
 */
export function getUrl(key: string, issuer: string, label: string) {
  const url = new URL('otpauth://totp')

  url.pathname = label
  url.searchParams.set('secret', key)
  url.searchParams.set('issuer', issuer)

  const qrSvg = encodeQR(url.toString(), 'svg', { border: 0 })

  return { url, qr: `data:image/svg+xml;utf8,${qrSvg}` }
}
