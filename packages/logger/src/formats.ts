import { format, LoggerOptions } from 'winston'
import { getRequestId } from './tracer'
import { inspect } from 'node:util'

const splatSymbol = Symbol.for('splat')

/**
 * An alternative to winston's `format.splat()`.
 *
 * This formatter does two things:
 *
 * - Combines log messages with multiple string arguments, so e.g. `logger.info('foo', 'bar')` is combined to `'foo bar'`.
 *   This matches the old behavior of winston 2.
 * - It allows the user to add multiple metadata objects to the log message. All own enumerable properties from each
 *   metadata object are added to the final log message with Object.assign(). This matches the behavior of
 *   `format.splat()`.
 *
 * Unlike winston's `format.splat()`, it doesn't support printf-style parameters.
 */
const combineMeta = format(info => {
  const splats = (info[splatSymbol] as unknown[]) || []

  for (let i = 0; i < splats.length; i++) {
    const splat = splats[i]
    if (
      i > 0 && // The first object is already assigned by winston
      splat != null &&
      typeof splat === 'object'
    ) {
      Object.assign(info, splat)
    } else if (typeof splat === 'string') {
      ;(info.message as string) += ` ${splat}`
    }
  }

  return info
})

const convertErrorToObject = format(info => {
  for (const key in info) {
    if (Object.prototype.hasOwnProperty.call(info, key) && info[key] instanceof Error) {
      const errorInstance = info[key]
      info[key] = { ...errorInstance, message: errorInstance.message, stack: errorInstance.stack }
    }
  }
  return info
})

const trimMessage = format(info => {
  if (typeof info.message === 'string' || info.message instanceof String) {
    info.message = info.message.trim()
  }

  return info
})

function serializeMeta(meta: Record<string, unknown>) {
  let str = ''

  for (const key in meta) {
    if (Object.prototype.hasOwnProperty.call(meta, key)) {
      const value = meta[key]
      if (value !== undefined) {
        str += `\n  ${key}: ${inspect(value)}`
      }
    }
  }

  return str
}

export function awsFormats(options: LoggerOptions) {
  return [
    format.timestamp(),
    combineMeta(),
    format(info => {
      info.requestId = getRequestId()
      return info
    })(),
    convertErrorToObject(),
    options.format,
    trimMessage(),
    format.json()
  ]
}

export function localFormats(options: LoggerOptions, requestFinishedMessage: string) {
  return [
    format.colorize(),
    format.timestamp(),
    combineMeta(),
    trimMessage(),
    options.format,
    format.printf(({ level, timestamp, message, stack, ...meta }) => {
      if (message === requestFinishedMessage) {
        const { method, url, statusCode, responseTime } = meta
        // Simple morgan-like request logging.
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return `${timestamp} ${level}: ${method} ${url} ${statusCode} ${responseTime}ms`
      }

      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      let msg = `${timestamp} ${level}: ${message}`

      // Print metadata fields on a separate line, indented by 2 spaces.
      msg += serializeMeta(meta)
      // Print the error stack on a separate line, indented by 2 spaces.
      if (stack) msg += `\n  ${String(stack as string)}`

      return msg
    })
  ]
}
