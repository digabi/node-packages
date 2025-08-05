import winston, { format, LoggerOptions } from 'winston'
import process from 'process'
import { getBasicAuthUsername } from './utils'
import { awsFormats, localFormats } from './formats'
import { tracerExpressMiddleware } from './tracer'

import type { Handler, Request, Response } from 'express'

const requestFinishedMessage = 'Request finished'

/**
 * Create a winston logger with sane defaults for most of our projects.
 * The function accepts the same options as winston.createLogger.
 *
 * The created logger is configured in following manner:
 *
 * - All logs are sent to stdout, using the console transport
 * - In non-AWS environments, logs are colorized and pretty-printed
 * - In AWS environments, logs are serialized as ndjson for Cloudwatch
 *
 * You can add a custom formatter to the default console transport by
 * defining the `format` option.
 */
export function createLogger(options: LoggerOptions = {}) {
  const inAws = !!process.env.YTL_AWS_STACK

  // We need to tell winston how to colorize our custom 'audit' log level.
  // Unfortunately, winston stores colors globally and not per instance.
  winston.addColors({ audit: 'magenta' })

  const formats = (inAws ? awsFormats(options) : localFormats(options, requestFinishedMessage)).filter(x => !!x)

  return winston.createLogger({
    level: inAws ? 'http' : 'debug',
    levels: { audit: 0, error: 1, warn: 2, info: 3, http: 4, verbose: 5, debug: 6, silly: 7 },
    transports: [
      new winston.transports.Console({
        format: format.combine(...formats)
      })
    ],
    handleExceptions: true,
    ...options
  })
}

interface RequestLoggerOptions {
  /** Retrieves the name of the user that initiated the request. Defaults to the basic auth username. */
  getRemoteUser?: (request: Request) => string | undefined
}

/** Creates a HTTP request logger middleware for express */
export function requestLogger(logger: winston.Logger, options: RequestLoggerOptions = {}): [Handler, Handler] {
  // Store the request processing start times in a WeakMap to avoid modifying the response object.
  const startTimes = new WeakMap<Response, bigint>()
  const getRemoteUser = options.getRemoteUser || (req => getBasicAuthUsername(req.headers.authorization))

  function onFinished(this: Response) {
    const endTime = process.hrtime.bigint()
    const startTime = startTimes.get(this)!
    // Measure response times in microsecond precision (formatted as milliseconds with 0–3 decimals).
    const responseTime = Number((endTime - startTime) / 1000n) / 1000

    // Ensure each request is logged only once.
    this.removeListener('finish', onFinished)
    this.removeListener('error', onFinished)

    const req = this.req

    logger.http(requestFinishedMessage, {
      // HTTP method and URL first, so they're the first fields in the serialized output.
      method: req.method,
      url: req.originalUrl,
      contentLength: Number(this.get('content-length')),
      remoteAddress: req.ip,
      remoteUser: getRemoteUser(req),
      responseTime: responseTime,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      route: req.route?.path,
      statusCode: this.statusCode,
      userAgent: req.headers['user-agent']
    })
  }

  const tracerMiddleware = tracerExpressMiddleware()

  const loggingMiddleware: Handler = (req, res, next) => {
    startTimes.set(res, process.hrtime.bigint())
    res.on('finish', onFinished).on('error', onFinished)
    next()
  }

  // Express supports arrays of middlewares as well.
  return [tracerMiddleware, loggingMiddleware]
}
