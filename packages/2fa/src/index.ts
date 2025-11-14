import * as crypto from 'crypto'
import encodeQR from 'qr'
import { toBase32, toBuffer } from './base32'

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
  | { ok: false; reason: 'BAD_TOTP' }
  /** The key could not be decoded */
  | { ok: false; reason: 'BAD_KEY' }

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
 * and refuse to accept them again. In practice, when you succesfully
 * log a user in, you should save the used TOTP in a database (shared
 * across application instances) and disallow using that TOTP and the
 * previous successful one in the next log in attempt.
 *
 * @param key - The base 32 encoded shared secret key.
 * @param totp - The TOTP to check.
 */
export function check(key: string, totp: string, date?: Date): TotpResult {
  const k = toBuffer(key)

  if (k === null) return { ok: false, reason: 'BAD_KEY' }

  const curr = get(k, +0, date)
  const prev = get(k, -1, date)

  return totp === curr || totp === prev
    ? { ok: true } // prettier-ignore
    : { ok: false, reason: 'BAD_TOTP' }
}

/** Returns a new TOTP shared secret key. */
export function genKey() {
  const key = crypto.randomBytes(KEY_SIZE)
  const enc = toBase32(key)
  return enc
}

/**
 * Returns an `otpauth` URL for the given key along with a QR code as a
 * string of `<svg />`. This can then be displayed as a data url with the
 * prefix `data:image/svg+xml;utf8,`.
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
  url.searchParams.set('algorithm', ALGO)
  url.searchParams.set('digits', '6')
  url.searchParams.set('period', '30')

  return { url, qr: encodeQR(url.toString(), 'svg', { border: 0 }) }
}
