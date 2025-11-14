/** Base 32 alphabet in the RFC-4648 flavour */
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/**
 * Converts an Uint8Array to a base32 string in the RFC-4648 flavour.
 * @see e.g. https://github.com/LinusU/base32-encode
 */
export function toBase32(buff: Uint8Array) {
  let win = 0 // A size for a "window" of bits to shrink from 8 (byte) to 5 (base32 char)
  let tmp = 0 // Temporary buffer to shift bytes around
  let str = '' // Output string

  for (let i = 0; i < buff.length; i++) {
    tmp = (tmp << 8) | buff[i]
    win += 8

    while (win >= 5) {
      str += ALPHA[(tmp >>> (win - 5)) & 0x1f]
      win -= 5
    }
  }

  if (win > 0) str += ALPHA[(tmp << (5 - win)) & 0x1f]

  return str
}

/**
 * Converts a base32 string in the RFC-4648 flavour to a buffer.
 * Returns `null` if input is undecodable (i.e. contains invalid chars).
 * @see e.g. https://github.com/LinusU/base32-decode
 */
export function toBuffer(str: string) {
  const buf = new Uint8Array(((str.length * 5) / 8) | 0)

  let win = 0
  let tmp = 0
  let ptr = 0

  for (let i = 0; i < str.length; i++) {
    const a = ALPHA.indexOf(str[i])
    if (a < 0) return null

    tmp = (tmp << 5) | a
    win += 5

    if (win >= 8) {
      buf[ptr++] = (tmp >>> (win - 8)) & 0xff
      win -= 8
    }
  }

  return buf
}
